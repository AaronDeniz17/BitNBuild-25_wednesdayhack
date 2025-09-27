#!/bin/bash

# GigCampus Setup Script
# This script helps set up the development environment

echo "🚀 Setting up GigCampus MVP..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client
npm install

# Go back to root
cd ..

# Create environment files
echo "📝 Creating environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Created server/.env (please edit with your credentials)"
else
    echo "⚠️  server/.env already exists"
fi

# Client environment
if [ ! -f "client/.env.local" ]; then
    cp client/env.local.example client/.env.local
    echo "✅ Created client/.env.local (please edit with your credentials)"
else
    echo "⚠️  client/.env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up Firebase project (see README Step 2)"
echo "2. Set up Supabase project (see README Step 3)"
echo "3. Edit server/.env with your Firebase and Supabase credentials"
echo "4. Edit client/.env.local with your Firebase and Supabase credentials"
echo "5. Run 'npm run dev' to start the development servers"
echo ""
echo "📖 For detailed instructions, see the README.md file"
echo ""
echo "🔗 Useful links:"
echo "   Firebase Console: https://console.firebase.google.com"
echo "   Supabase Dashboard: https://supabase.com/dashboard"
echo ""
echo "Happy coding! 🚀"
