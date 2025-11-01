#!/bin/sh
# Wrapper script for scheduled runs
# This script ensures proper environment setup before running the main application

set -e

echo "=========================================="
echo "🚀 Starting Top-6 scheduled run"
echo "📅 $(date)"
echo "=========================================="

# Change to app directory
cd /app

# Run the main application
exec node dist/main.js

