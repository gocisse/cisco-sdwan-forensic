package frontend

import (
	"embed"
	"io/fs"
)

//go:embed build/*
var buildFS embed.FS

// GetBuildFS returns the embedded frontend build filesystem.
// The returned fs.FS is rooted at the "build" directory.
func GetBuildFS() (fs.FS, error) {
	return fs.Sub(buildFS, "build")
}
