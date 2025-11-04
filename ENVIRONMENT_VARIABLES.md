# Docker Environment Variables Guide

This document explains the environment variables used in the Docker deployment.

## Backend Environment (.env.staging)

The backend uses the `.env.staging` file for production configuration. This file is loaded via the `ENV_FILE` environment variable.

### Required Variables

#### Database
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```
Your MongoDB connection string. Get this from MongoDB Atlas.

#### Security
```env
JWT_SECRET=your-super-secret-long-random-string-here
```
Used for JWT token signing. Generate a long random string.

#### Server Configuration
```env
PORT=9000
NODE_ENV=production
```

#### URLs
```env
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```
Update these with your actual domain. For multiple origins (e.g., staging + production):
```env
CORS_ORIGIN=https://yourdomain.com,https://staging.yourdomain.com
```

#### Firebase Configuration
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```
Get these from Firebase Console → Project Settings → Service Accounts → Generate New Private Key

**Important**: The private key must be properly escaped with `\n` for newlines.

#### PhonePe Payment Gateway
```env
PHONEPE_ENV=production
PHONEPE_CLIENT_ID=your-phonepe-client-id
PHONEPE_CLIENT_SECRET=your-phonepe-client-secret
PHONEPE_CLIENT_VERSION=v1
PHONEPE_KEY_INDEX=1
PHONEPE_CALLBACK_USERNAME=webhook-username
PHONEPE_CALLBACK_PASSWORD=webhook-password
PHONEPE_WEBHOOK_URL=https://yourdomain.com/api/phonepe/webhook
```
Get these credentials from PhonePe merchant dashboard.

### Optional Variables

```env
DEV_ALLOW_PRODUCT_WRITE=false
```
Set to `true` only in development to allow product modifications.

## Frontend Environment (.env.production)

The frontend uses environment variables that are embedded at build time.

### Firebase Configuration

```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Get these values from Firebase Console → Project Settings → General → Your apps

### API URL

```env
VITE_API_BASE_URL=
```
Leave empty (blank) for production - the frontend will use relative paths which nginx will proxy to the backend.

For development or if hosting frontend and backend on different domains:
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Environment Files

- `.env.development` - Local development
- `.env.staging` - Staging environment (used by Docker staging build)
- `.env.production` - Production environment (used by Docker production build)

**Note**: Frontend environment variables are **embedded at build time** and are **public** (visible in browser). They are safe to commit to git.

## Docker Compose Environment Variables

Set in `docker-compose.yml`:

```yaml
environment:
  - ENV_FILE=.env.staging    # Which .env file to load
  - NODE_ENV=production      # Node environment
```

## Changing Environment Variables

### For Backend

1. Edit the `.env.staging` file:
```bash
nano backend/.env.staging
```

2. Restart the container:
```bash
./deploy.sh restart
```

### For Frontend

Frontend variables are embedded at build time, so you need to rebuild:

1. Edit `.env.production` if needed
```bash
nano frontend/.env.production
```

2. Rebuild and deploy:
```bash
./deploy.sh deploy
```

## Security Best Practices

1. **Never commit** `.env.staging` or `.env.prod` to git
2. **Use strong secrets** for JWT_SECRET (at least 32 characters)
3. **Rotate secrets** regularly
4. **Limit CORS_ORIGIN** to only trusted domains
5. **Use HTTPS** in production (update FRONTEND_URL and BACKEND_URL)
6. **Whitelist IPs** in MongoDB Atlas for production database
7. **Store backups** of .env files securely (encrypted)

## Verifying Configuration

### Check backend environment
```bash
curl http://localhost:9000/env
```

### Check if environment file is loaded
```bash
docker-compose exec app sh -c 'echo "ENV_FILE=$ENV_FILE"'
```

### Check backend logs
```bash
docker-compose logs app | grep -E "ENV_FILE|NODE_ENV|CORS"
```

## Environment Files Structure

```
backend/
├── .env.example        # Example template (committed to git)
├── .env.staging        # Staging configuration (NOT in git)
├── .env.prod          # Production configuration (NOT in git)
└── .env.local         # Local development (NOT in git)

frontend/
├── .env.production    # Production build variables (can be in git)
└── .env.development   # Development variables (can be in git)
```

## Troubleshooting

### Backend can't connect to MongoDB
- Verify `MONGO_URI` is correct
- Check if VPS IP is whitelisted in MongoDB Atlas
- Test connection: `docker-compose exec app sh -c 'node -e "console.log(process.env.MONGO_URI)"'`

### CORS errors
- Verify `CORS_ORIGIN` includes your domain
- Check HTTPS vs HTTP (must match)
- Check for trailing slashes (should not have)

### Firebase authentication not working
- Verify all three Firebase variables are set correctly
- Check if private key has proper `\n` escaping
- Verify project ID matches your Firebase project

### Environment changes not taking effect
- Restart container: `./deploy.sh restart`
- For frontend changes, rebuild: `./deploy.sh deploy`
- Check logs: `./deploy.sh logs`

## Example Production .env.staging

```env
# Server
PORT=9000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://prod_user:SecureP@ss123@cluster0.mongodb.net/shanthi_gold_prod?retryWrites=true&w=majority

# Security
JWT_SECRET=8f7e6d5c4b3a2g1h9i0j7k6l5m4n3o2p1q9r8s7t6u5v4w3x2y1z

# URLs
FRONTEND_URL=https://shanthigold.com
BACKEND_URL=https://shanthigold.com
CORS_ORIGIN=https://shanthigold.com,https://www.shanthigold.com

# Firebase
FIREBASE_PROJECT_ID=shanthi-online-gold
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc@shanthi-online-gold.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFA...\n-----END PRIVATE KEY-----\n"

# PhonePe
PHONEPE_ENV=production
PHONEPE_CLIENT_ID=MERCHANTUAT
PHONEPE_CLIENT_SECRET=xyz123abc456
PHONEPE_CLIENT_VERSION=v1
PHONEPE_KEY_INDEX=1
PHONEPE_CALLBACK_USERNAME=phonepe_webhook
PHONEPE_CALLBACK_PASSWORD=WebH00k@123!
PHONEPE_WEBHOOK_URL=https://shanthigold.com/api/phonepe/webhook
```

**Note**: The above is an example. Replace all values with your actual credentials.
