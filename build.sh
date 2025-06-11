#!/bin/bash

# Navigate to project directory
cd /var/www/gsb-project

# Install dependencies
npm install

# Build for production
npm run build

# Ensure permissions are correct
sudo chown -R www-data:www-data /var/www/gsb-project

echo "React build completed successfully!" 