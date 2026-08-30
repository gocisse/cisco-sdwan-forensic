package utils

import (
	"sync"
	"time"
)

// CacheEntry holds cached data with expiration time.
type CacheEntry[T any] struct {
	Data      T
	ExpiresAt time.Time
}

// TTLCache is a simple thread-safe cache with time-to-live expiration.
type TTLCache[T any] struct {
	mu    sync.RWMutex
	entry *CacheEntry[T]
	ttl   time.Duration
}

// NewTTLCache creates a new TTL cache with the specified duration.
func NewTTLCache[T any](ttl time.Duration) *TTLCache[T] {
	return &TTLCache[T]{ttl: ttl}
}

// Get returns the cached value if it exists and hasn't expired.
func (c *TTLCache[T]) Get() (T, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if c.entry == nil || time.Now().After(c.entry.ExpiresAt) {
		var zero T
		return zero, false
	}
	return c.entry.Data, true
}

// Set stores a value in the cache with the configured TTL.
func (c *TTLCache[T]) Set(data T) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entry = &CacheEntry[T]{
		Data:      data,
		ExpiresAt: time.Now().Add(c.ttl),
	}
}

// Invalidate clears the cache.
func (c *TTLCache[T]) Invalidate() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entry = nil
}

// IsExpired returns true if the cache is empty or expired.
func (c *TTLCache[T]) IsExpired() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.entry == nil || time.Now().After(c.entry.ExpiresAt)
}

// MapCache is a thread-safe cache for key-value pairs with TTL.
type MapCache[K comparable, V any] struct {
	mu      sync.RWMutex
	entries map[K]*CacheEntry[V]
	ttl     time.Duration
}

// NewMapCache creates a new map-based TTL cache.
func NewMapCache[K comparable, V any](ttl time.Duration) *MapCache[K, V] {
	return &MapCache[K, V]{
		entries: make(map[K]*CacheEntry[V]),
		ttl:     ttl,
	}
}

// Get returns the cached value for a key if it exists and hasn't expired.
func (c *MapCache[K, V]) Get(key K) (V, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.entries[key]
	if !exists || time.Now().After(entry.ExpiresAt) {
		var zero V
		return zero, false
	}
	return entry.Data, true
}

// Set stores a value for a key with the configured TTL.
func (c *MapCache[K, V]) Set(key K, data V) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[key] = &CacheEntry[V]{
		Data:      data,
		ExpiresAt: time.Now().Add(c.ttl),
	}
}

// Delete removes a key from the cache.
func (c *MapCache[K, V]) Delete(key K) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.entries, key)
}

// Clear removes all entries from the cache.
func (c *MapCache[K, V]) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries = make(map[K]*CacheEntry[V])
}

// Cleanup removes expired entries from the cache.
// Call this periodically to prevent memory leaks.
func (c *MapCache[K, V]) Cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, entry := range c.entries {
		if now.After(entry.ExpiresAt) {
			delete(c.entries, key)
		}
	}
}
