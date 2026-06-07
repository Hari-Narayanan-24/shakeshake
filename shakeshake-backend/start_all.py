"""
Start all ShakeShake backend services at once.

Usage:
    python start_all.py

The launcher starts each FastAPI service from its own directory, checks the
health endpoint, and keeps enough logs to explain startup failures.
"""

from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "logs"
HOST = "0.0.0.0"
LOCAL_HEALTH_HOST = "localhost"
STARTUP_TIMEOUT_SECONDS = float(os.environ.get("SHAKESHAKE_STARTUP_TIMEOUT", "20"))

SERVICES = [
    {"name": "auth", "dir": "auth", "port": 23000, "health": "/auth/health"},
    {"name": "onboarding", "dir": "onboarding", "port": 23001, "health": "/onboarding/health"},
    {"name": "profile", "dir": "profile", "port": 23002, "health": "/profile/health"},
    {"name": "match", "dir": "match", "port": 23003, "health": "/match/health"},
    {"name": "gateway", "dir": "gateway", "port": 23010, "health": "/gateway/health"},
]


@dataclass
class ManagedService:
    name: str
    port: int
    proc: subprocess.Popen | None
    reused_existing: bool
    log_path: Path | None = None


def service_url(service: dict) -> str:
    return f"http://{LOCAL_HEALTH_HOST}:{service['port']}"


def health_url(service: dict) -> str:
    return f"{service_url(service)}{service['health']}"


def check_health(service: dict, timeout: float = 0.75) -> tuple[bool, str]:
    request = urllib.request.Request(health_url(service), headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            data = json.loads(body)
    except (OSError, TimeoutError, urllib.error.URLError, json.JSONDecodeError) as exc:
        return False, str(exc)

    if data.get("status") != "ok":
        return False, f"health returned {data!r}"
    if data.get("service") != service["name"]:
        return False, f"port is serving {data.get('service')!r}, expected {service['name']!r}"
    return True, "ok"


def is_port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.35):
            return True
    except OSError:
        return False


def start_service(service: dict) -> ManagedService:
    service_dir = BASE_DIR / service["dir"]
    log_path = LOG_DIR / f"{service['name']}.log"
    LOG_DIR.mkdir(exist_ok=True)

    env = os.environ.copy()
    env.setdefault("PYTHONUTF8", "1")
    env.setdefault("PYTHONIOENCODING", "utf-8")

    command = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        HOST,
        "--port",
        str(service["port"]),
    ]

    with log_path.open("a", encoding="utf-8", buffering=1) as log_file:
        log_file.write(f"\n--- {time.strftime('%Y-%m-%d %H:%M:%S')} starting {service['name']} ---\n")
        proc = subprocess.Popen(
            command,
            cwd=str(service_dir),
            stdout=log_file,
            stderr=subprocess.STDOUT,
            env=env,
            text=True,
        )

    return ManagedService(
        name=service["name"],
        port=service["port"],
        proc=proc,
        reused_existing=False,
        log_path=log_path,
    )


def tail_log(path: Path | None, line_count: int = 40) -> str:
    if not path or not path.exists():
        return "No log file was written."
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(lines[-line_count:]) if lines else "Log file is empty."


def stop_started_services(services: list[ManagedService]) -> None:
    started = [service for service in services if service.proc and service.proc.poll() is None]
    if not started:
        return

    print("\n[*] Stopping services started by this launcher ...")
    for service in started:
        service.proc.terminate()

    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if all(service.proc.poll() is not None for service in started if service.proc):
            break
        time.sleep(0.2)

    for service in started:
        if service.proc and service.proc.poll() is None:
            service.proc.kill()


def wait_for_startup(services: list[ManagedService]) -> tuple[list[ManagedService], list[ManagedService], dict[str, str]]:
    pending = {service.name for service in services}
    crashed: list[ManagedService] = []
    last_errors: dict[str, str] = {}
    service_by_name = {service["name"]: service for service in SERVICES}
    managed_by_name = {service.name: service for service in services}
    deadline = time.monotonic() + STARTUP_TIMEOUT_SECONDS

    while pending and time.monotonic() < deadline:
        for name in list(pending):
            managed = managed_by_name[name]
            definition = service_by_name[name]

            if managed.proc and managed.proc.poll() is not None:
                crashed.append(managed)
                last_errors[name] = f"process exited with code {managed.proc.returncode}"
                pending.remove(name)
                continue

            ok, message = check_health(definition)
            if ok:
                print(f"[+] {name} ready at {service_url(definition)}")
                pending.remove(name)
            else:
                last_errors[name] = message

        if pending:
            time.sleep(0.5)

    timed_out = [managed_by_name[name] for name in pending]
    return crashed, timed_out, last_errors


def print_failure_details(
    crashed: list[ManagedService],
    timed_out: list[ManagedService],
    last_errors: dict[str, str],
) -> None:
    if crashed:
        print("[!] The following services crashed during startup:")
        for service in crashed:
            code = service.proc.returncode if service.proc else "unknown"
            print(f"    {service.name} (exit code {code})")
            print(f"\n--- Last log lines for {service.name} ---")
            print(tail_log(service.log_path))

    if timed_out:
        print("[!] The following services did not become healthy in time:")
        for service in timed_out:
            print(f"    {service.name}: {last_errors.get(service.name, 'no health response')}")
            print(f"\n--- Last log lines for {service.name} ---")
            print(tail_log(service.log_path))


def print_service_summary(services: list[ManagedService]) -> None:
    print("\n[+] All services running. Press Ctrl+C to stop.\n")
    print("    Auth        -> http://localhost:23000")
    print("    Onboarding  -> http://localhost:23001")
    print("    Profile     -> http://localhost:23002")
    print("    Match/Chat  -> http://localhost:23003")
    print("    Gateway     -> http://localhost:23010")
    print("    Ollama      -> http://localhost:23003/ollama/*\n")

    if any(service.reused_existing for service in services):
        print("[i] Some services were already running, so Ctrl+C will leave those existing processes alone.")


def monitor_services(services: list[ManagedService]) -> int:
    definitions = {service["name"]: service for service in SERVICES}

    while True:
        for service in services:
            if service.proc and service.proc.poll() is not None:
                print(f"[!] {service.name} stopped unexpectedly with exit code {service.proc.returncode}.")
                print(f"\n--- Last log lines for {service.name} ---")
                print(tail_log(service.log_path))
                stop_started_services(services)
                return service.proc.returncode or 1

            if service.reused_existing:
                ok, message = check_health(definitions[service.name], timeout=0.5)
                if not ok:
                    print(f"[!] Existing {service.name} service stopped responding: {message}")
                    stop_started_services(services)
                    return 1

        time.sleep(1.0)


def main() -> int:
    managed_services: list[ManagedService] = []

    for service in SERVICES:
        print(f"[*] Starting {service['name']} on port {service['port']} ...")

        healthy, _ = check_health(service)
        if healthy:
            print(f"[=] {service['name']} is already running; reusing it.")
            managed_services.append(
                ManagedService(
                    name=service["name"],
                    port=service["port"],
                    proc=None,
                    reused_existing=True,
                )
            )
            continue

        if is_port_open(service["port"]):
            print(
                f"[!] Port {service['port']} is already in use, but it is not the "
                f"{service['name']} service."
            )
            print(f"    Health check failed at {health_url(service)}")
            stop_started_services(managed_services)
            return 1

        try:
            managed = start_service(service)
        except Exception as exc:
            print(f"[!] Failed to start {service['name']}: {exc}")
            stop_started_services(managed_services)
            return 1

        managed_services.append(managed)
        print(f"[+] {service['name']} started (PID {managed.proc.pid})")

    print("\n[*] Waiting for services to initialise ...")
    crashed, timed_out, last_errors = wait_for_startup(managed_services)
    if crashed or timed_out:
        print_failure_details(crashed, timed_out, last_errors)
        stop_started_services(managed_services)
        return 1

    print_service_summary(managed_services)

    try:
        return monitor_services(managed_services)
    except KeyboardInterrupt:
        print("\n[*] Shutting down ...")
        stop_started_services(managed_services)
        print("[+] Done.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
