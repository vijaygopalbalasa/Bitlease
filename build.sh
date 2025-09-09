#!/bin/bash
set -e

echo "Building BitLease Frontend..."
cd frontend
npm ci
npm run build
echo "Frontend build completed successfully!"