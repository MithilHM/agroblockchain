#!/usr/bin/env python3
"""
ASGI proxy to Node.js backend for compatibility with supervisor
"""

import asyncio
import subprocess
import threading
import time
import signal
import sys
import os
from typing import Dict, Any

# Change to backend directory
os.chdir('/app/backend')

# Global variable to track Node.js process
node_process = None

def start_node_server():
    """Start the Node.js server in a separate process"""
    global node_process
    try:
        print("🚀 Starting Node.js backend server...")
        node_process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        # Read output line by line
        while True:
            output = node_process.stdout.readline()
            if output == '' and node_process.poll() is not None:
                break
            if output:
                print(f"[NODE] {output.strip()}")
                
    except Exception as e:
        print(f"❌ Error starting Node.js server: {e}")

def stop_node_server():
    """Stop the Node.js server"""
    global node_process
    if node_process:
        print("🛑 Stopping Node.js server...")
        node_process.terminate()
        node_process.wait()

# Start Node.js server in background thread
node_thread = threading.Thread(target=start_node_server, daemon=True)
node_thread.start()

# Wait a moment for the server to start
time.sleep(3)

# Simple ASGI app that returns status
async def app(scope: Dict[str, Any], receive, send):
    """Simple ASGI app that indicates Node.js backend is running"""
    
    if scope['type'] == 'http':
        if scope['path'] == '/':
            await send({
                'type': 'http.response.start',
                'status': 200,
                'headers': [(b'content-type', b'application/json')],
            })
            await send({
                'type': 'http.response.body',
                'body': b'{"status": "ok", "message": "Node.js backend is running on port 8001"}',
            })
        else:
            await send({
                'type': 'http.response.start',
                'status': 404,
                'headers': [(b'content-type', b'application/json')],
            })
            await send({
                'type': 'http.response.body',
                'body': b'{"error": "Not found", "message": "Access Node.js API on port 8001"}',
            })
    else:
        # Handle other protocols
        pass

# Handle shutdown
def signal_handler(signum, frame):
    print(f"📡 Received signal {signum}, shutting down...")
    stop_node_server()
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)