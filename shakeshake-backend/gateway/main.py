"""
ShakeShake API Gateway
Port: 23010

Mobile clients can call this single port. The gateway forwards requests to the
local backend microservices on 23000-23003.
"""

from __future__ import annotations

import os
import time
import logging

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware


logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("gateway")

app = FastAPI(title="ShakeShake API Gateway", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICE_URLS = {
    "auth": os.environ.get("AUTH_SERVICE_URL", "http://127.0.0.1:23000"),
    "onboarding": os.environ.get("ONBOARDING_SERVICE_URL", "http://127.0.0.1:23001"),
    "profile": os.environ.get("PROFILE_SERVICE_URL", "http://127.0.0.1:23002"),
    "match": os.environ.get("MATCH_SERVICE_URL", "http://127.0.0.1:23003"),
}

ROUTE_PREFIXES = (
    ("auth", "auth"),
    ("settings", "auth"),
    ("onboarding", "onboarding"),
    ("profile", "profile"),
    ("match", "match"),
    ("chat", "match"),
    ("ollama", "match"),
)

HOP_BY_HOP_HEADERS = {
    "connection",
    "content-encoding",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.info("%s %s -> %s (%.0fms)", request.method, request.url.path, response.status_code, duration_ms)
    return response


@app.get("/gateway/health")
@app.get("/health")
def health():
    return {"status": "ok", "service": "gateway", "version": "1.0.0"}


def resolve_service(path: str) -> str | None:
    first_segment = path.strip("/").split("/", 1)[0]
    for prefix, service in ROUTE_PREFIXES:
        if first_segment == prefix:
            return service
    return None


def proxy_headers(request: Request) -> dict[str, str]:
    return {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS and key.lower() != "host"
    }


def filtered_response_headers(response: httpx.Response) -> dict[str, str]:
    return {
        key: value
        for key, value in response.headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(path: str, request: Request):
    service = resolve_service(path)
    if not service:
        raise HTTPException(status_code=404, detail=f"No gateway route for /{path}")

    target_url = f"{SERVICE_URLS[service].rstrip('/')}/{path}"
    if request.url.query:
        target_url = f"{target_url}?{request.url.query}"

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
            upstream = await client.request(
                request.method,
                target_url,
                content=await request.body(),
                headers=proxy_headers(request),
            )
    except httpx.RequestError as exc:
        logger.error("upstream %s unavailable: %s", service, exc)
        raise HTTPException(status_code=502, detail=f"{service} service unavailable") from exc

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=filtered_response_headers(upstream),
        media_type=upstream.headers.get("content-type"),
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=23010, reload=True)
