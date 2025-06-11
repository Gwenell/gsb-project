#!/bin/bash

# Set environment variables
export NODE_ENV=production
export PORT=8097
export WDS_SOCKET_PORT=0  # Disable WebSocket connections for hot reloading

# Navigate to project directory
cd /var/www/gsb-project

# For development server
# npm run start

# For production (using serve package)
serve -s build -l $PORT 