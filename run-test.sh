#!/bin/bash

# Test script to run championship computation
# Make sure you have configured your .env file first

echo "🚀 Starting championship computation..."
echo "📁 Current directory: $(pwd)"
echo "🔧 Checking environment..."

if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "💡 Please copy .env.example to .env and configure it"
    exit 1
fi

if [ ! -f "build/src/main.js" ]; then
    echo "📦 Building project first..."
    npm run build
fi

echo "▶️  Running championship computation for week 12..."
echo "   - No weekly summary"
echo "   - Upload to Firebase with AI summaries"
echo "   - Using environment variables from .env"

npm start -- --weekName=12 --uploadToFirebase

echo "✅ Computation complete!"