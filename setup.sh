#!/bin/bash

# Quick setup script for Spotify Bingo Creator

echo "🎵 Spotify Bingo Creator - Setup Script"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env created. Please fill in your Spotify credentials:"
    echo "   - SPOTIFY_CLIENT_ID"
    echo "   - SPOTIFY_CLIENT_SECRET"
    echo "   - SPOTIFY_REFRESH_TOKEN"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Ready to start development!"
echo ""
echo "Next steps:"
echo "1. Fill in your Spotify credentials in .env"
echo "2. Run: pnpm dev"
echo "3. Visit: http://localhost:5173"
echo ""
echo "📚 For setup instructions, see README.md"
echo "🔍 For quick reference, see QUICK_REFERENCE.md"
echo ""
