#!/bin/bash
if ! netstat -tuln | grep -q ":8080 "; then
    echo "Starting Nginx..."
    nginx
else
    echo "Nginx already running on port 8080, starting API..."
fi
bun lint && bun run --watch src/index.ts