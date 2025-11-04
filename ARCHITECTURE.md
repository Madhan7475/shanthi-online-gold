# Docker Deployment Architecture

## System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                         Internet                               │
│                    (Users / Mobile Apps)                       │
└──────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS/HTTP
                           ▼
                  ┌─────────────────┐
                  │  Domain Name     │
                  │  yourdomain.com  │
                  │  (DNS A Record)  │
                  └────────┬─────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                         VPS Server                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Nginx Reverse Proxy (Port 80/443)             │ │
│  │                                                             │ │
│  │  Location Routing:                                         │ │
│  │  • /              → http://localhost:80 (Frontend)         │ │
│  │  • /api/*         → http://localhost:9000 (Backend)        │ │
│  │  • /uploads/*     → http://localhost:9000 (Backend)        │ │
│  │  • /.well-known/* → http://localhost:80 (Deep Links)       │ │
│  │                                                             │ │
│  │  Features:                                                 │ │
│  │  • SSL/TLS Termination                                     │ │
│  │  • Static file caching                                     │ │
│  │  • Gzip compression                                        │ │
│  │  • Security headers                                        │ │
│  └──────────────┬──────────────────┬────────────────┬─────────┘ │
│                 │                   │                │           │
│                 ▼                   ▼                ▼           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Docker Container                             │  │
│  │  ┌────────────────────┐    ┌──────────────────────────┐ │  │
│  │  │   Nginx (Port 80)  │    │   Backend Service        │ │  │
│  │  │   Static Frontend  │    │   (Node.js:9000)         │ │  │
│  │  │                    │    │                          │ │  │
│  │  │  • React App       │    │  • Express Server        │ │  │
│  │  │  • Built with Vite │    │  • REST API Endpoints    │ │  │
│  │  │  • Static files    │    │  • Authentication        │ │  │
│  │  │  • SPA routing     │    │  • Business Logic        │ │  │
│  │  │  • .well-known/    │    │  • File uploads          │ │  │
│  │  └────────────────────┘    └──────────┬───────────────┘ │  │
│  │                                        │                  │  │
│  │                             ┌──────────▼─────────────┐   │  │
│  │                             │   Uploads Directory    │   │  │
│  │                             │  /app/backend/uploads  │   │  │
│  │                             │  (Volume mounted)      │   │  │
│  │                             └────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Port Mappings:                                                 │
│  • 80:80 (Frontend - nginx)                                     │
│  • 9000:9000 (Backend)                                          │
│                                                                 │
│  Volume Mounts:                                                 │
│  • ./backend/.env.staging → /app/backend/.env.staging (ro)      │
│  • ./backend/uploads → /app/backend/uploads                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │      External Services            │
              │                                   │
              │  ┌─────────────────────────────┐ │
              │  │   MongoDB Atlas             │ │
              │  │   • Database storage        │ │
              │  │   • Collections:            │ │
              │  │     - users                 │ │
              │  │     - products              │ │
              │  │     - orders                │ │
              │  │     - cart                  │ │
              │  │     - wishlist              │ │
              │  └─────────────────────────────┘ │
              │                                   │
              │  ┌─────────────────────────────┐ │
              │  │   Firebase                  │ │
              │  │   • Authentication          │ │
              │  │   • User management         │ │
              │  │   • Phone OTP               │ │
              │  └─────────────────────────────┘ │
              │                                   │
              │  ┌─────────────────────────────┐ │
              │  │   PhonePe                   │ │
              │  │   • Payment processing      │ │
              │  │   • Webhooks                │ │
              │  └─────────────────────────────┘ │
              │                                   │
              │  ┌─────────────────────────────┐ │
              │  │   GoldAPI                   │ │
              │  │   • Gold price updates      │ │
              │  │   • Market data             │ │
              │  └─────────────────────────────┘ │
              └───────────────────────────────────┘
```

## Data Flow

### 1. User Request Flow
```
User Browser
    ↓
https://yourdomain.com/products
    ↓
Nginx (SSL termination)
    ↓
Docker Container → Nginx (Port 80)
    ↓
Returns: index.html + JavaScript bundles
    ↓
User Browser (React renders)
```

### 2. API Request Flow
```
React App (fetch/axios)
    ↓
https://yourdomain.com/api/products
    ↓
Nginx reverse proxy
    ↓
Docker Container → Backend (Port 9000)
    ↓
Express.js → Route handler
    ↓
MongoDB Atlas
    ↓
Response ← Backend ← Nginx ← React App
```

### 3. Image Upload Flow
```
Admin uploads image
    ↓
POST /api/products/upload
    ↓
Nginx → Backend (multipart/form-data)
    ↓
Multer middleware
    ↓
Saved to: /app/backend/uploads/filename.jpg
    ↓
Database stores: /uploads/filename.jpg
    ↓
Frontend requests: https://yourdomain.com/uploads/filename.jpg
    ↓
Nginx → Backend → Serves file
```

### 4. Payment Flow
```
User initiates payment
    ↓
Frontend → POST /api/phonepe/initiate
    ↓
Backend → PhonePe API
    ↓
Redirect to PhonePe payment page
    ↓
User completes payment
    ↓
PhonePe → Webhook → https://yourdomain.com/api/phonepe/webhook
    ↓
Backend verifies signature
    ↓
Updates order status in MongoDB
    ↓
Redirect to success page
```

## Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Docker Container                          │
│                                                         │
│  Layer 1: Base Image (node:24-alpine)                  │
│  ├─ Node.js v24                                        │
│  ├─ npm                                                │
│  └─ Alpine Linux                                       │
│                                                         │
│  Layer 2: System Dependencies                          │
│  ├─ nginx (web server for frontend)                    │
│  ├─ curl (health checks)                               │
│  └─ Essential tools                                    │
│                                                         │
│  Layer 3: Application Code                             │
│  ├─ Backend (/app/backend/)                            │
│  │   ├─ server.js                                      │
│  │   ├─ routes/                                        │
│  │   ├─ models/                                        │
│  │   ├─ middleware/                                    │
│  │   ├─ services/                                      │
│  │   └─ node_modules/ (production only)                │
│  │                                                      │
│  └─ Frontend (/app/frontend/dist/)                     │
│      ├─ index.html                                     │
│      ├─ assets/                                        │
│      │   ├─ index-[hash].js                            │
│      │   ├─ index-[hash].css                           │
│      │   └─ images/                                    │
│      ├─ .well-known/                                   │
│      │   ├─ apple-app-site-association                 │
│      │   └─ assetlinks.json                            │
│      └─ [built static files]                           │
│                                                         │
│  Layer 4: Configuration                                │
│  ├─ /etc/nginx/http.d/default.conf (nginx config)      │
│  └─ /app/backend/.env.staging (mounted volume)         │
│                                                         │
│  Layer 5: Runtime Data                                 │
│  └─ /app/backend/uploads/ (mounted volume)             │
│                                                         │
└─────────────────────────────────────────────────────────┘

Exposed Ports:
• 80 (Frontend - nginx)
• 9000 (Backend - Node.js)

Volumes:
• backend/.env.staging (read-only)
• backend/uploads (read-write, persistent)

Health Check:
• curl http://localhost:9000/healthz
• Interval: 30s
• Timeout: 10s
```

## Build Process

```
┌──────────────────────────────────────────────────┐
│          Multi-Stage Docker Build                │
└──────────────────────────────────────────────────┘

Stage 1: Frontend Build
┌────────────────────────────┐
│ FROM node:24-alpine        │
│ WORKDIR /app/frontend      │
│ COPY package*.json ./      │
│ RUN npm install            │
│ COPY . .                   │
│ RUN npm run build          │
│ OUTPUT: /app/frontend/dist │
└────────────────────────────┘
            ↓
Stage 2: Backend Dependencies
┌────────────────────────────┐
│ FROM node:24-alpine        │
│ WORKDIR /app/backend       │
│ COPY package*.json ./      │
│ RUN npm install --production
│ OUTPUT: /app/backend/node_modules
└────────────────────────────┘
            ↓
Stage 3: Final Image
┌────────────────────────────────────┐
│ FROM node:24-alpine                │
│ RUN apk add nginx curl             │
│ COPY backend/ → /app/backend/      │
│ COPY --from=stage1 dist/           │
│      → /app/frontend/dist/         │
│ COPY --from=stage2 node_modules/   │
│      → /app/backend/node_modules/  │
│ EXPOSE 3000 9000                   │
│ ENTRYPOINT [docker-entrypoint.sh]  │
└────────────────────────────────────┘
```

## Startup Sequence

```
1. Docker Container Starts
        ↓
2. Start Nginx (Port 80)
   └─ Serves frontend static files from /app/frontend/dist
   └─ Serves .well-known files (deep linking)
   └─ Handles SPA routing
        ↓
3. Start Node.js Backend (Port 9000)
   └─ Load .env.staging
   └─ Connect to MongoDB
   └─ Initialize Firebase Admin
   └─ Start cron jobs (gold price updates)
   └─ Initialize notification services
   └─ Start Express server
        ↓
4. Health Check (after 40s)
   └─ curl http://localhost:9000/healthz
        ↓
5. Ready to Accept Traffic
```

## Network Flow

```
External Request → VPS Port 80/443
                    ↓
                Nginx (Reverse Proxy)
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
Docker Port 80          Docker Port 9000
(Frontend - Nginx)      (Backend - Node.js)
        ↓                       ↓
    Static Files            Express Routes
    .well-known/                ↓
        ↓                  ┌──────┴──────┐
    HTML/JS/CSS            ↓             ↓
                       MongoDB       Firebase
                       (Data)        (Auth)
```

## File System Structure in Container

```
/app/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.staging (mounted from host)
│   ├── node_modules/ (production only)
│   ├── config/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── uploads/ (mounted from host, persistent)
│       ├── product-images/
│       └── cache files
│
└── frontend/
    └── dist/ (built static files)
        ├── index.html
        ├── assets/
        │   ├── index-[hash].js
        │   ├── index-[hash].css
        │   └── images/
        ├── .well-known/
        │   ├── apple-app-site-association
        │   └── assetlinks.json
        └── favicon.ico

/etc/nginx/
└── http.d/
    └── default.conf (nginx config for frontend)

/var/log/nginx/
├── access.log
└── error.log
```

## Resource Usage

```
┌─────────────────────────────────────┐
│     Container Resource Limits       │
├─────────────────────────────────────┤
│ CPU: Shared (no limit)              │
│ Memory: 512MB-1GB (recommended)     │
│ Disk: ~500MB (image + uploads)      │
│ Network: Shared host network        │
└─────────────────────────────────────┘

Typical Usage:
├─ Nginx: ~10MB RAM
├─ Node.js Backend: ~200-400MB RAM
└─ Total: ~250-500MB RAM

Peak Usage (under load):
└─ Total: ~500MB-1GB RAM
```

## Security Layers

```
Layer 1: Network (Firewall)
    ├─ Only ports 22, 80, 443 open
    └─ UFW firewall enabled

Layer 2: Nginx
    ├─ SSL/TLS encryption
    ├─ Security headers
    └─ Rate limiting (optional)

Layer 3: Application
    ├─ CORS policy
    ├─ JWT authentication
    ├─ Firebase authentication
    └─ Input validation

Layer 4: Database
    ├─ IP whitelist (MongoDB Atlas)
    ├─ User authentication
    └─ Encrypted connection

Layer 5: Container
    ├─ Isolated environment
    ├─ Read-only env file
    └─ Non-root user (optional)
```
