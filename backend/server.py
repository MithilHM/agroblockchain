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
import httpx
from typing import Dict, Any

# Change to backend directory
os.chdir('/app/backend')

# Global variable to track Node.js process
node_process = None
NODE_PORT = 8002

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
time.sleep(5)

# ASGI app that proxies to Node.js backend
async def app(scope: Dict[str, Any], receive, send):
    """ASGI app that proxies requests to Node.js backend"""
    
    if scope['type'] == 'http':
        try:
            # Construct the target URL
            path = scope.get('path', '/')
            query_string = scope.get('query_string', b'').decode()
            if query_string:
                url = f"http://localhost:{NODE_PORT}{path}?{query_string}"
            else:
                url = f"http://localhost:{NODE_PORT}{path}"
            
            # Get headers
            headers = {}
            for name, value in scope.get('headers', []):
                headers[name.decode()] = value.decode()
            
            # Get method
            method = scope.get('method', 'GET')
            
            # Get body if present
            body = b''
            if method in ['POST', 'PUT', 'PATCH']:
                message = await receive()
                if message.get('type') == 'http.request' and message.get('body'):
                    body = message['body']
            
            # Make request to Node.js backend
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    content=body,
                    timeout=30.0
                )
                
                # Send response
                await send({
                    'type': 'http.response.start',
                    'status': response.status_code,
                    'headers': [(key.encode(), value.encode()) for key, value in response.headers.items()],
                })
                await send({
                    'type': 'http.response.body',
                    'body': response.content,
                })
                
        except Exception as e:
            print(f"❌ Proxy error: {e}")
            await send({
                'type': 'http.response.start',
                'status': 502,
                'headers': [(b'content-type', b'application/json')],
            })
            await send({
                'type': 'http.response.body',
                'body': f'{{"error": "Bad Gateway", "message": "Node.js backend unavailable: {str(e)}"}}'.encode(),
            })

# Handle shutdown
def signal_handler(signum, frame):
    print(f"📡 Received signal {signum}, shutting down...")
    stop_node_server()
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)