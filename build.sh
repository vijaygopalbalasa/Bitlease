#!/bin/bash
set -e

echo "Building BitLease Frontend..."
echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

echo "Changing to frontend directory..."
cd frontend
echo "Frontend directory contents:"
ls -la

echo "Installing dependencies..."
npm install

echo "Building Next.js application..."
npm run build

echo "Verifying build output..."
ls -la .next

echo "Frontend build completed successfully!"