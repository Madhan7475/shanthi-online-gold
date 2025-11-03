# 🚀 Complete Deployment Guide - Shanthi Online Gold

This guide covers everything from building Docker containers to deploying on your VPS with SSL certificates.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Docker Build & Test](#docker-build--test)
5. [VPS Deployment](#vps-deployment)
6. [SSL Configuration](#ssl-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Prerequisites

### Required Software
- **Docker** and **Docker Compose** installed
- **Node.js** 18+ (for local development)
- **VPS** with Ubuntu/Debian (for deployment)
- **Domain names** configured in DNS

### Domain Configuration
Your application uses two domains:
- **Frontend:** `sog.staging.kwiqwork.in`
- **Backend API:** `sog.staging.api.kwiqwork.in`

### DNS Setup
Create A records pointing to your VPS IP:
```
sog.staging.kwiqwork.in        → Your VPS IP
sog.staging.api.kwiqwork.in    → Your VPS IP
```

Verify DNS propagation:
```bash
nslookup sog.staging.kwiqwork.in
nslookup sog.staging.api.kwiqwork.in
```

---

## Environment Configuration

### Frontend Environment Variables

The frontend uses different `.env` files for each environment:

**`.env.development`** (local development)
```bash
VITE_API_BASE_URL=http://localhost:9000
VITE_FIREBASE_API_KEY=your-dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**`.env.staging`** (staging/UAT environment)
```bash
VITE_API_BASE_URL=https://sog.staging.api.kwiqwork.in
VITE_FIREBASE_API_KEY=AIzaSyBe3UPSf8M37-mIWDDyEMW1Q77_iOAwHU4
VITE_FIREBASE_AUTH_DOMAIN=shanthi-online-gold-uat.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shanthi-online-gold-uat
VITE_FIREBASE_STORAGE_BUCKET=shanthi-online-gold-uat.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=515126722988
VITE_FIREBASE_APP_ID=1:515126722988:web:8c88c18c0831d96690ba09
VITE_FIREBASE_MEASUREMENT_ID=G-5Y2G683X4H
```

**`.env.production`** (production environment)
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_FIREBASE_API_KEY=your-prod-api-key
# ... other production Firebase config
```

### Backend Environment Variables

**`backend/.env.staging`** (create this file)
```bash
# Server Configuration
PORT=9000
NODE_ENV=production
FRONTEND_URL=https://sog.staging.kwiqwork.in

# MongoDB
MONGODB_URI=your-mongodb-atlas-connection-string

# Firebase Admin SDK
FIREBASE_PROJECT_ID=shanthi-online-gold-uat
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@shanthi-online-gold-uat.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# PhonePe Payment Gateway
PHONEPE_MERCHANT_ID=your-merchant-id
PHONEPE_SALT_KEY=your-salt-key
PHONEPE_SALT_INDEX=1
PHONEPE_HOST_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
PHONEPE_REDIRECT_URL=https://sog.staging.kwiqwork.in/payment-success
PHONEPE_CALLBACK_URL=https://sog.staging.api.kwiqwork.in/api/phonepe/callback

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gold Price API (optional)
GOLD_PRICE_API_KEY=your-api-key-if-using
```

**`backend/.env.production`** (for production deployment)
```bash
# Same structure as staging but with production values
PORT=9000
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
# ... production values
```

---

## Local Development

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Start Backend

```bash
cd backend
npm start
# Backend runs on http://localhost:9000
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:9000/api/health

---

## Docker Build & Test

### 1. Project Structure

```
shanthi-online-gold/
├── Dockerfile              # Main Dockerfile for staging
├── Dockerfile.production   # Production Dockerfile
├── docker-compose.yml      # Staging docker compose
├── docker-compose.production.yml  # Production docker compose
├── docker-entrypoint.sh    # Container startup script
├── nginx.conf              # Nginx configuration for VPS
├── frontend/
│   ├── .env.staging
│   ├── .env.production
│   └── .env.development
└── backend/
    ├── .env.staging
    └── .env.production
```

### 2. Build Docker Image

```bash
# Build for staging
docker-compose build

# Or build for production
docker-compose -f docker-compose.production.yml build
```

### 3. Run Docker Container Locally

```bash
# Start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check running containers
docker ps
```

### 4. Test Docker Deployment

```bash
# Frontend (served on port 3000)
curl http://localhost:3000

# Backend API (served on port 9000)
curl http://localhost:9000/api/health

# Stop containers
docker-compose down
```

### 5. Environment-Specific Builds

The Dockerfile uses build modes:

```bash
# Staging build (default)
npm run build:staging  # Uses .env.staging

# Production build
npm run build:production  # Uses .env.production
```

---

## VPS Deployment

### Step 1: Prepare Your VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot (for SSL)
sudo apt install certbot python3-certbot-nginx -y
```

### Step 2: Copy Project to VPS

```bash
# From your local machine
# Option 1: Using git
ssh user@vps-ip
git clone https://github.com/Madhan7475/shanthi-online-gold.git
cd shanthi-online-gold
git checkout uat

# Option 2: Using SCP
scp -r shanthi-online-gold user@vps-ip:~/

# Copy environment files (DO NOT commit these to git)
scp backend/.env.staging user@vps-ip:~/shanthi-online-gold/backend/
```

### Step 3: Build & Run Docker on VPS

```bash
# On your VPS
cd ~/shanthi-online-gold

# Build the Docker image
docker-compose build

# Start the containers
docker-compose up -d

# Verify containers are running
docker ps

# Check logs
docker-compose logs -f
```

You should see:
- Frontend running on port 3000
- Backend running on port 9000

### Step 4: Configure Nginx

```bash
# Copy nginx config to sites-available
sudo cp nginx.conf /etc/nginx/sites-available/sog

# Create symlink to sites-enabled
sudo ln -s /etc/nginx/sites-available/sog /etc/nginx/sites-enabled/

# Remove default config
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Enable nginx on boot
sudo systemctl enable nginx
```

### Step 5: Test HTTP Access

```bash
# Test from VPS
curl -I http://sog.staging.kwiqwork.in
curl http://sog.staging.api.kwiqwork.in/api/health

# Test from browser
http://sog.staging.kwiqwork.in
http://sog.staging.api.kwiqwork.in/api/health
```

If both work, proceed to SSL setup!

---

## SSL Configuration

### Step 1: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22    # SSH - IMPORTANT!
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
sudo ufw status
```

### Step 2: Install SSL Certificates

```bash
# Install certificate for frontend domain
sudo certbot --nginx -d sog.staging.kwiqwork.in

# Install certificate for backend domain
sudo certbot --nginx -d sog.staging.api.kwiqwork.in
```

**During certbot setup:**
1. Enter your email address
2. Agree to Terms of Service (Y)
3. Choose whether to share email (optional)
4. **Choose option 2: Redirect HTTP to HTTPS**

Certbot will automatically:
- Obtain SSL certificates
- Update nginx configuration
- Set up auto-renewal

### Step 3: Verify SSL Installation

```bash
# Check certificates
sudo certbot certificates

# Test HTTPS access
curl -I https://sog.staging.kwiqwork.in
curl https://sog.staging.api.kwiqwork.in/api/health

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 4: Verify Auto-Renewal

```bash
# Check certbot timer
sudo systemctl status certbot.timer

# Certificates auto-renew every 60 days
```

### 🎉 Deployment Complete!

Your application is now live at:
- **Frontend:** https://sog.staging.kwiqwork.in
- **Backend API:** https://sog.staging.api.kwiqwork.in

---

## Troubleshooting

### Issue: "502 Bad Gateway"

**Cause:** Docker containers not running or ports not accessible

**Solution:**
```bash
# Check Docker containers
docker ps

# If not running, start them
docker-compose up -d

# Check logs
docker-compose logs -f

# Test ports locally
curl http://localhost:3000
curl http://localhost:9000/api/health
```

### Issue: DNS Not Resolving

**Cause:** DNS records not configured or not propagated

**Solution:**
```bash
# Check DNS
nslookup sog.staging.kwiqwork.in
dig sog.staging.kwiqwork.in

# Wait for DNS propagation (5-30 minutes usually)
# Verify A records in your DNS provider
```

### Issue: Certbot Fails

**Cause:** Port 80 not accessible or domain not resolving

**Solution:**
```bash
# Ensure nginx is running
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Ensure DNS is resolving
nslookup sog.staging.kwiqwork.in

# Check nginx is listening on port 80
sudo netstat -tlnp | grep :80
```

### Issue: Frontend Shows Firebase Error

**Cause:** Environment variables not embedded in build

**Solution:**
```bash
# Ensure .env.staging exists in frontend directory
ls frontend/.env.staging

# Rebuild Docker image (environment variables are embedded at build time)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Images Not Loading

**Cause:** Public folder not included in Docker build

**Solution:**
```bash
# Verify .dockerignore doesn't exclude frontend/public
cat .dockerignore | grep "frontend/public"

# If excluded, comment it out and rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Mixed Content Warnings (HTTP on HTTPS page)

**Cause:** API URL in frontend .env uses HTTP instead of HTTPS

**Solution:**
```bash
# Check frontend/.env.staging
cat frontend/.env.staging | grep VITE_API_BASE_URL

# Should be: VITE_API_BASE_URL=https://sog.staging.api.kwiqwork.in
# If wrong, fix it and rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Issue: "ERR_REQUIRE_ESM" for uuid package

**Cause:** uuid package version incompatibility

**Solution:**
Already fixed! The code now uses Node.js built-in `crypto.randomUUID()` instead of the uuid package.

---

## Maintenance

### View Logs

```bash
# Nginx logs
sudo tail -f /var/log/nginx/sog-frontend-error.log
sudo tail -f /var/log/nginx/sog-backend-error.log

# Docker logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# System logs
journalctl -u nginx -f
```

### Update Application

```bash
# Pull latest code
cd ~/shanthi-online-gold
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Restart Services

```bash
# Restart Docker containers
docker-compose restart

# Restart nginx
sudo systemctl restart nginx

# Reload nginx (after config changes)
sudo nginx -t && sudo systemctl reload nginx
```

### Check SSL Certificate Expiry

```bash
# View certificates and expiry dates
sudo certbot certificates

# Manual renewal (usually not needed)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Backup

```bash
# Backup MongoDB (if self-hosted)
mongodump --uri="your-mongodb-uri" --out=/backup/mongodb-$(date +%Y%m%d)

# Backup Docker volumes
docker-compose down
tar -czf backup-$(date +%Y%m%d).tar.gz ~/shanthi-online-gold
docker-compose up -d

# Backup environment files (keep secure!)
tar -czf env-backup-$(date +%Y%m%d).tar.gz backend/.env.* frontend/.env.*
```

### Monitor Resources

```bash
# System resources
htop
df -h
free -h

# Docker resources
docker stats

# Nginx connections
sudo netstat -an | grep :80 | wc -l
sudo netstat -an | grep :443 | wc -l
```

### Security Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Check for vulnerable packages
npm audit
cd backend && npm audit
cd ../frontend && npm audit
```

---

## Quick Command Reference

```bash
# Docker Commands
docker-compose up -d              # Start containers
docker-compose down               # Stop containers
docker-compose logs -f            # View logs
docker-compose restart            # Restart containers
docker-compose build --no-cache   # Rebuild from scratch
docker ps                         # List running containers
docker stats                      # Resource usage

# Nginx Commands
sudo nginx -t                     # Test configuration
sudo systemctl reload nginx       # Reload configuration
sudo systemctl restart nginx      # Restart nginx
sudo systemctl status nginx       # Check status

# SSL Commands
sudo certbot certificates         # List certificates
sudo certbot renew               # Renew certificates
sudo certbot renew --dry-run     # Test renewal

# Logs
sudo tail -f /var/log/nginx/sog-*-error.log
docker-compose logs -f backend
docker-compose logs -f frontend

# System
sudo systemctl status nginx
sudo systemctl status docker
df -h
htop
```

---

## Deployment Checklist

- [ ] DNS A records configured for both domains
- [ ] `.env.staging` files created for frontend and backend
- [ ] Docker and Docker Compose installed on VPS
- [ ] Nginx installed on VPS
- [ ] Certbot installed on VPS
- [ ] Project code copied to VPS
- [ ] Docker image built successfully
- [ ] Docker containers running (ports 3000 & 9000)
- [ ] Nginx configured and running
- [ ] HTTP access working for both domains
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] SSL certificates installed
- [ ] HTTPS access working with lock icon
- [ ] HTTP redirects to HTTPS
- [ ] Auto-renewal configured
- [ ] Application functionality tested
- [ ] Logs verified for errors

---

## Support

If you encounter issues:

1. **Check logs first:**
   - Nginx: `sudo tail -100 /var/log/nginx/sog-*-error.log`
   - Docker: `docker-compose logs --tail=100`

2. **Verify all services running:**
   - Docker: `docker ps`
   - Nginx: `sudo systemctl status nginx`

3. **Test connectivity:**
   - `curl http://localhost:3000`
   - `curl http://localhost:9000/api/health`

4. **Review this guide** for specific error messages

---

**🎉 Your application is now deployed with Docker, Nginx, and SSL!**
