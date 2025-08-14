#!/usr/bin/env python3
"""
One-click developer script to run both backend (FastAPI + Socket.IO) and frontend (Vite + React).

Features
- Ensures a Python virtualenv at ./.venv and installs backend dependencies
- Installs frontend node dependencies when needed
- Starts uvicorn (backend) and `npm run dev` (frontend) concurrently
- Streams logs from both processes and shuts them down cleanly on Ctrl+C
"""

from __future__ import annotations

import os
import sys
import shutil
import signal
import subprocess
import threading
from pathlib import Path
from typing import List, Optional


ROOT_DIR = Path(__file__).resolve().parent
VENV_DIR = ROOT_DIR / ".venv"
CLIENT_DIR = ROOT_DIR / "client"
SERVER_REQ = ROOT_DIR / "server" / "requirements.txt"


def print_info(message: str) -> None:
    print(f"[dev] {message}")


def run(cmd: List[str], cwd: Optional[Path] = None, env: Optional[dict] = None, check: bool = True) -> int:
    process = subprocess.run(cmd, cwd=str(cwd) if cwd else None, env=env, check=check)
    return process.returncode


def popen(cmd: List[str], cwd: Optional[Path] = None, env: Optional[dict] = None) -> subprocess.Popen:
    return subprocess.Popen(
        cmd,
        cwd=str(cwd) if cwd else None,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )


def stream_output(name: str, proc: subprocess.Popen) -> None:
    assert proc.stdout is not None
    for line in proc.stdout:
        print(f"[{name}] {line.rstrip()}")


def ensure_venv() -> Path:
    if not VENV_DIR.exists():
        print_info("Creating virtualenv...")
        run([sys.executable, "-m", "venv", str(VENV_DIR)])
    py = VENV_DIR / "bin" / "python"
    if not py.exists():
        # Fallback for Windows layout (not expected on macOS/Linux)
        py = VENV_DIR / "Scripts" / "python.exe"
    return py


def ensure_backend_deps(py_exe: Path) -> None:
    print_info(f"Using Python: {py_exe}")
    # Install requirements and extras we rely on
    args = [str(py_exe), "-m", "pip", "install", "-r", str(SERVER_REQ), "pydantic-settings", "python-multipart", "itsdangerous"]
    print_info("Installing backend dependencies (if needed)...")
    run(args)


def ensure_frontend_deps() -> None:
    if not shutil.which("npm"):
        raise RuntimeError("npm not found; please install Node.js")
    if not (CLIENT_DIR / "node_modules").exists():
        print_info("Installing frontend dependencies...")
        run(["npm", "i"], cwd=CLIENT_DIR)


def start_backend(py_exe: Path) -> subprocess.Popen:
    uvicorn = VENV_DIR / "bin" / "uvicorn"
    if not uvicorn.exists():
        # Install uvicorn if for any reason it's missing
        run([str(py_exe), "-m", "pip", "install", "uvicorn[standard]"])
    print_info("Starting backend on http://localhost:8000 ...")
    return popen([str(uvicorn), "server.app.main:get_app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--factory"], cwd=ROOT_DIR)


def start_frontend() -> subprocess.Popen:
    print_info("Starting frontend on http://localhost:5173 ...")
    return popen(["npm", "run", "dev", "--", "--host"], cwd=CLIENT_DIR)


def main() -> None:
    print_info(f"Root: {ROOT_DIR}")

    # Preconditions
    if not shutil.which("python3") and not shutil.which("python"):
        raise RuntimeError("Python not found")
    if not shutil.which("npm"):
        raise RuntimeError("npm not found")

    py_exe = ensure_venv()
    ensure_backend_deps(py_exe)
    ensure_frontend_deps()

    backend = start_backend(py_exe)
    frontend = start_frontend()

    threads: list[threading.Thread] = []
    for name, proc in ("backend", backend), ("frontend", frontend):
        t = threading.Thread(target=stream_output, args=(name, proc), daemon=True)
        t.start()
        threads.append(t)

    def shutdown(signum=None, frame=None):
        print_info("Shutting down...")
        for proc in (backend, frontend):
            if proc.poll() is None:
                try:
                    proc.terminate()
                except Exception:
                    pass
        for proc in (backend, frontend):
            try:
                proc.wait(timeout=10)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass
        sys.exit(0)

    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, shutdown)

    print_info("Both servers started. Press Ctrl+C to stop.")
    try:
        backend.wait()
        frontend.wait()
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()


