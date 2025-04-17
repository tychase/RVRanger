#!/bin/bash

# Start the main application in the background
npm run dev &

# Wait a moment for the main app to initialize
sleep 5

# Start the chat assistant
python3 start_assistant.py