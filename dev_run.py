import sys
import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ReloadHandler(FileSystemEventHandler):
    def __init__(self):
        self.process = None
        self.start_app()

    def start_app(self):
        if self.process:
            self.process.terminate()
            self.process.wait()

        self.process = subprocess.Popen([sys.executable, "main.py"])

    def on_modified(self, event):
        if event.src_path.endswith(('.py', '.html', '.css', '.js')):
            print(f"Változás észlelve: {event.src_path}. Újraindítás...")
            self.start_app()

if __name__ == "__main__":
    handler = ReloadHandler()
    observer = Observer()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        if handler.process:
            handler.process.terminate()
    observer.join()
