import multiprocessing
import os
import tempfile
import signal
import resource
import sys
import atexit
import gc
import psutil
import time

# Force CPU usage
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TORCH_DEVICE"] = "cpu"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["MPS_AVAILABLE"] = "0"  # Disable Metal Performance Shaders

# Use single worker with higher request limits
workers = 1
max_requests = 100  # Increased from 5
max_requests_jitter = 10  # Increased from 2

# Worker class
worker_class = 'uvicorn.workers.UvicornWorker'

# Bind address
bind = '0.0.0.0:8000'

# Timeout configuration
timeout = 300  # Increased timeout
graceful_timeout = 60  # Increased graceful timeout
keepalive = 5

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'debug'

# Process naming
proc_name = 'lexify-backend'

# Worker configuration
worker_tmp_dir = tempfile.gettempdir()

# Resource limits
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

def set_file_limits():
    """Set higher limit for number of open files"""
    try:
        resource.setrlimit(resource.RLIMIT_NOFILE, (4096, 4096))
    except:
        pass

def force_kill_process(pid):
    """Force kill a process"""
    try:
        os.kill(pid, signal.SIGKILL)
    except:
        pass

def cleanup_resources():
    """Clean up any remaining resources"""
    try:
        # Force garbage collection
        gc.collect()
        
        # Clean up any remaining processes
        current_process = psutil.Process()
        
        # Kill child processes
        children = current_process.children(recursive=True)
        for child in children:
            try:
                child.terminate()
                child.wait(timeout=3)
            except:
                force_kill_process(child.pid)
                
        # Clean up port 8000
        for conn in psutil.net_connections():
            if conn.laddr.port == 8000:
                try:
                    process = psutil.Process(conn.pid)
                    process.terminate()
                except:
                    pass
                    
        # Sleep briefly to allow resources to be released
        time.sleep(0.1)
                    
    except Exception as e:
        print(f"Error in cleanup: {e}")

def on_starting(server):
    """Initialize server-wide resources"""
    server.log.info("Initializing server resources")
    set_file_limits()
    cleanup_resources()
    
    # Register cleanup on exit
    atexit.register(cleanup_resources)
    
    def handle_signal(signo, frame):
        cleanup_resources()
        time.sleep(0.5)  # Give time for cleanup
        sys.exit(0)
    
    # Set up signal handlers
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGABRT, handle_signal)

def post_worker_init(worker):
    """Initialize worker-specific resources"""
    worker.log.info(f"Initializing worker {worker.pid}")
    cleanup_resources()
    set_file_limits()

def pre_request(worker, req):
    """Clean up before each request"""
    gc.collect()  # Light cleanup before request

def post_request(worker, req, environ, resp):
    """Clean up after each request"""
    gc.collect()  # Light cleanup after request

def worker_int(worker):
    """Handle worker interruption cleanly"""
    worker.log.info("worker received INT or QUIT signal")
    cleanup_resources()
    time.sleep(0.5)  # Give time for cleanup
    sys.exit(0)

def worker_abort(worker):
    """Handle worker abort cleanly"""
    worker.log.info("worker received SIGABRT signal")
    cleanup_resources()
    time.sleep(0.5)  # Give time for cleanup
    sys.exit(1)

def worker_exit(server, worker):
    """Cleanup worker resources"""
    worker.log.info("Worker exiting, cleaning up resources")
    cleanup_resources()
    time.sleep(0.5)  # Give time for cleanup 