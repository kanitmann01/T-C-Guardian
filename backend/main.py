from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from collections import defaultdict

from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.api.main import api_router
from firebase_config import init_firebase

# Initialize logging
setup_logging()

# Initialize Firebase
init_firebase()

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    debug=settings.debug
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting Logic (In-Memory)
request_counts = defaultdict(list)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware."""
    client_ip = request.client.host
    now = time.time()
    
    # Filter out old requests
    request_counts[client_ip] = [
        t for t in request_counts[client_ip]
        if now - t < settings.rate_limit_duration
    ]
    
    if len(request_counts[client_ip]) >= settings.rate_limit_requests:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Too many requests."}
        )
    
    request_counts[client_ip].append(now)
    response = await call_next(request)
    return response


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "T&C Guardian API is running. Stay safe out there."}


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


# Include API router
app.include_router(api_router, prefix="/api")

# Also include routes at root level for backward compatibility
app.include_router(api_router)
