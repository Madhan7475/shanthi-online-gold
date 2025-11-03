# Docker Deployment Guide

## Overview

This application uses a simplified Docker deployment where:
- **Frontend**: Served directly by Nginx on port 80 (inside container)
- **Backend**: Node.js API server on port 9000
- Both services run in a single container with nginx handling static files

## Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
│  ┌──────────────────────────────┐  │
│  │   Nginx (Port 80)            │  │
│  │   Serves: /app/frontend/dist │  │
│  │   - Static HTML/JS/CSS       │  │
│  │   - .well-known files        │  │
│  │   - SPA routing fallback     │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │   Node.js Backend (Port 9000)│  │
│  │   - API Endpoints            │  │
│  │   - File Uploads             │  │
│  │   - Business Logic           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Build & Run

### Staging Environment
```bash
# Build the image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Environment
```bash
# Build production image
docker build -f Dockerfile.production -t shanthi-online-gold:prod .

# Run production container
docker run -d \
  --name shanthi-online-gold-prod \
  -p 9000:9000 \
  -p 80:80 \
  -v $(pwd)/backend/.env.prod:/app/backend/.env.prod:ro \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  shanthi-online-gold:prod
```

## .well-known Files

The application serves deep linking files for mobile apps:
- `/.well-known/apple-app-site-association` - iOS Universal Links
- `/.well-known/assetlinks.json` - Android App Links

These files are:
1. Built from config files during `npm run build`
2. Placed in `/app/frontend/dist/.well-known/` 
3. Served by Nginx with `Content-Type: application/json`

## VPS Deployment with External Nginx

If you're using nginx on your VPS as a reverse proxy:

1. Use the provided `nginx.conf` as a template
2. Point the upstream to your Docker container ports
3. The .well-known files will be proxied correctly with proper headers

Example VPS nginx config:
```nginx
upstream frontend {
    server localhost:80;
}

upstream backend {
    server localhost:9000;
}

server {
    listen 80;
    server_name staging.sog.kwiqwork.in;
    
    # .well-known files (with exact match for priority)
    location = /.well-known/apple-app-site-association {
        proxy_pass http://frontend;
        add_header Content-Type "application/json" always;
    }
    
    location = /.well-known/assetlinks.json {
        proxy_pass http://frontend;
        add_header Content-Type "application/json" always;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        # ... other proxy headers
    }
}
```

## Troubleshooting

### .well-known files not loading
1. Check if files exist in container:
   ```bash
   docker exec -it shanthi-online-gold ls -la /app/frontend/dist/.well-known/
   ```

2. Test nginx directly:
   ```bash
   docker exec -it shanthi-online-gold curl http://localhost:80/.well-known/assetlinks.json
   ```

3. Check nginx error logs:
   ```bash
   docker exec -it shanthi-online-gold cat /var/log/nginx/error.log
   ```

### Backend not starting
```bash
# Check backend logs
docker exec -it shanthi-online-gold tail -f /app/backend/logs/error.log

# Check if backend is running
docker exec -it shanthi-online-gold curl http://localhost:9000/healthz
```

## File Structure in Container

```
/app/
├── backend/
│   ├── server.js
│   ├── node_modules/
│   ├── uploads/
│   └── .env.staging (mounted)
└── frontend/
    └── dist/
        ├── index.html
        ├── assets/
        └── .well-known/
            ├── apple-app-site-association
            └── assetlinks.json

/etc/nginx/
└── http.d/
    └── default.conf (from docker-nginx.conf)
```
