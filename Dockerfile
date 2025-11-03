# Multi-stage Dockerfile for Shanthi Online Gold
# This builds both frontend and backend in a single container

# Stage 1: Build Frontend
FROM node:24-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source and environment files
COPY frontend/ ./

# Build frontend for staging (uses .env.staging)
# For production, change to: RUN npm run build:production
RUN npm run build:staging

# Stage 2: Build Backend Dependencies
FROM node:24-alpine AS backend-deps

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm install --production

# Stage 3: Final Production Image
FROM node:24-alpine

# Install nginx and curl for serving frontend and health checks
RUN apk add --no-cache nginx curl

WORKDIR /app

# Copy backend application
COPY backend/ ./backend/

# Copy backend production dependencies from previous stage
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy nginx configuration
COPY docker-nginx.conf /etc/nginx/http.d/default.conf

# Create necessary directories
RUN mkdir -p /app/backend/uploads && \
    chmod 755 /app/backend/uploads && \
    mkdir -p /run/nginx && \
    chown -R nginx:nginx /app/frontend/dist

# Expose ports
# 9000 for backend API
# 80 for frontend (nginx, mapped to 3000 on host)
EXPOSE 9000 80

# Set working directory to backend
WORKDIR /app/backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:9000/healthz || exit 1

# Use the staging environment file by default
ENV ENV_FILE=.env.staging
ENV NODE_ENV=production

# Start both nginx and backend server
CMD nginx && ENV_FILE=$ENV_FILE node server.js
