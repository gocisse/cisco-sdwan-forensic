// broker.go
// SSE Broker for managing client connections and broadcasting messages

package sse

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

// Client represents a connected SSE client
type Client struct {
	SystemIP string
	Chan     chan []byte
	Done     chan struct{}
}

// Broker manages SSE clients for a specific data type (BFD, Usage, Stats)
type Broker struct {
	clients    map[*Client]bool
	clientsMu  sync.RWMutex
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Message
}

// Message wraps data with a system-ip for targeted broadcasting
type Message struct {
	SystemIP string
	Data     []byte
}

// NewBroker creates a new SSE Broker
func NewBroker() *Broker {
	return &Broker{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client, 100),
		unregister: make(chan *Client, 100),
		broadcast:  make(chan *Message, 1000),
	}
}

// Run starts the broker's event loop
func (b *Broker) Run() {
	for {
		select {
		case client := <-b.register:
			b.clientsMu.Lock()
			b.clients[client] = true
			b.clientsMu.Unlock()
			log.Printf("✅ SSE Client connected - system-ip: %s (total: %d)", client.SystemIP, len(b.clients))

		case client := <-b.unregister:
			b.clientsMu.Lock()
			if _, ok := b.clients[client]; ok {
				delete(b.clients, client)
				close(client.Chan)
				close(client.Done)
			}
			b.clientsMu.Unlock()
			log.Printf("❌ SSE Client disconnected - system-ip: %s (total: %d)", client.SystemIP, len(b.clients))

		case msg := <-b.broadcast:
			b.clientsMu.RLock()
			for client := range b.clients {
				// Only send to clients with matching system-ip
				if client.SystemIP == msg.SystemIP {
					select {
					case client.Chan <- msg.Data:
						// Message sent successfully
					default:
						// Client channel full, skip (prevents blocking)
						log.Printf("⚠️ Client channel full for system-ip: %s", client.SystemIP)
					}
				}
			}
			b.clientsMu.RUnlock()
		}
	}
}

// Register adds a new client to the broker
func (b *Broker) Register(systemIP string) *Client {
	client := &Client{
		SystemIP: systemIP,
		Chan:     make(chan []byte, 100),
		Done:     make(chan struct{}),
	}
	b.register <- client
	return client
}

// Unregister removes a client from the broker
func (b *Broker) Unregister(client *Client) {
	b.unregister <- client
}

// Broadcast sends data to all clients with matching system-ip
func (b *Broker) Broadcast(systemIP string, data []byte) {
	msg := &Message{
		SystemIP: systemIP,
		Data:     data,
	}
	select {
	case b.broadcast <- msg:
	default:
		log.Printf("⚠️ Broadcast channel full, dropping message for system-ip: %s", systemIP)
	}
}

// GetClientCount returns the number of connected clients
func (b *Broker) GetClientCount() int {
	b.clientsMu.RLock()
	defer b.clientsMu.RUnlock()
	return len(b.clients)
}

// GetClientSystemIPs returns all unique system-ips currently connected
func (b *Broker) GetClientSystemIPs() []string {
	b.clientsMu.RLock()
	defer b.clientsMu.RUnlock()

	ipMap := make(map[string]bool)
	for client := range b.clients {
		ipMap[client.SystemIP] = true
	}

	ips := make([]string, 0, len(ipMap))
	for ip := range ipMap {
		ips = append(ips, ip)
	}
	return ips
}

// ======================
// SSE Handler
// ======================

// SSEHandler creates an HTTP handler for SSE connections
func (b *Broker) SSEHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get system-ip from query parameter
		systemIP := r.URL.Query().Get("system-ip")
		if systemIP == "" {
			http.Error(w, "system-ip query parameter required", http.StatusBadRequest)
			return
		}

		// Set SSE headers
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Ensure the response writer supports flushing
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}

		// Register client
		client := b.Register(systemIP)
		defer b.Unregister(client)

		// Send initial connection message
		_, _ = w.Write([]byte("event: connected\ndata: {\"status\":\"connected\"}\n\n"))
		flusher.Flush()

		// Keep connection alive with heartbeat
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-r.Context().Done():
				// Client disconnected
				return

			case <-client.Done:
				// Server closing connection
				return

			case data := <-client.Chan:
				// Send data event
				_, err := w.Write([]byte("event: data\ndata: "))
				if err != nil {
					return
				}
				_, _ = w.Write(data)
				_, _ = w.Write([]byte("\n\n"))
				flusher.Flush()

			case <-ticker.C:
				// Send heartbeat to keep connection alive
				_, err := w.Write([]byte("event: heartbeat\ndata: {\"time\":"))
				if err != nil {
					return
				}
				heartbeat, _ := json.Marshal(time.Now().Unix())
				_, _ = w.Write(heartbeat)
				_, _ = w.Write([]byte("}\n\n"))
				flusher.Flush()
			}
		}
	}
}
