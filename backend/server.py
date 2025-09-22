#!/usr/bin/env python3
"""
Compatibility wrapper to run Node.js backend through uvicorn
This allows the existing supervisor configuration to work
"""

import subprocess
import sys
import os
import signal
import time

# Change to backend directory
os.chdir('/app/backend')

# Start the Node.js server
node_process = None

def signal_handler(signum, frame):
    global node_process
    if node_process:
        print(f"Received signal {signum}, terminating Node.js process...")
        node_process.terminate()
        node_process.wait()
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

try:
    print("Starting Node.js backend server...")
    node_process = subprocess.Popen(
        ['npm', 'run', 'dev'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    # Stream output
    for line in iter(node_process.stdout.readline, ''):
        print(line.rstrip())
        
    node_process.wait()
    
except KeyboardInterrupt:
    signal_handler(signal.SIGINT, None)
except Exception as e:
    print(f"Error starting Node.js server: {e}")
    sys.exit(1)