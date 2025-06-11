#!/bin/bash

# Set environment variables
export NODE_ENV=production
export PORT=8097

# Navigate to project directory
cd /var/www/gsb-project

# For development server
# npm run start

# For production (using serve package)
/usr/bin/npx serve -s build -l 8097 