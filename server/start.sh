#!/bin/bash

# Start the server with environment checking
echo "Starting GigCampus server..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found"
  exit 1
fi

# Start the server
npm run dev