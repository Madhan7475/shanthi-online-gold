# Firebase Environment Configuration Guide

## Overview

The application now uses environment variables for Firebase configuration instead of hardcoded values. This allows you to use different Firebase projects for development, staging, and production environments.

## Environment Files

### Frontend Environment Files

The frontend has three environment files, each used for different build modes:

1. **`.env.development`** - Used during local development (`npm run dev`)
2. **`.env.staging`** - Used for staging builds (`npm run build:staging`)
3. **`.env.production`** - Used for production builds (`npm run build:production`)

### Backend Environment Files

The backend uses:

1. **`.env.local`** - Local development
2. **`.env.staging`** - Staging environment
3. **`.env.prod`** - Production environment

## Frontend Environment Variables

Each frontend `.env` file contains:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:9000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Getting Firebase Configuration Values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one for staging/production)
3. Click on the gear icon (⚙️) → Project Settings
4. Scroll down to "Your apps" section
5. Select your web app or create a new one
6. Copy the configuration values to your `.env` file

## Recommended Setup

### Option 1: Single Firebase Project (Simpler)

Use the same Firebase project for all environments:

- **Development**: `.env.development` → Same Firebase project
- **Staging**: `.env.staging` → Same Firebase project
- **Production**: `.env.production` → Same Firebase project

**Pros**: Simpler, single project to manage
**Cons**: All environments share the same users and data

### Option 2: Separate Firebase Projects (Recommended for Production)

Create separate Firebase projects for each environment:

- **Development**: `.env.development` → `shanthi-gold-dev` project
- **Staging**: `.env.staging` → `shanthi-gold-staging` project
- **Production**: `.env.production` → `shanthi-gold-prod` project

**Pros**: Complete isolation, safer testing
**Cons**: More projects to manage

## Current Configuration

Currently, all environment files use the same Firebase project:
- Project ID: `shanthi-online-gold`

You can update these values to use different projects if needed.

## Build Commands

### Frontend

```bash
# Development (uses .env.development)
npm run dev

# Build for staging (uses .env.staging)
npm run build:staging

# Build for production (uses .env.production)
npm run build:production

# Default build (uses .env.production)
npm run build
```

### Backend

```bash
# Development (uses .env.local)
npm run dev

# Staging (uses .env.staging)
npm run start:staging

# Production (uses .env.prod)
npm start
```

## Docker Deployment

### Staging Deployment

Uses `Dockerfile` (default) and `docker-compose.yml`:

```bash
# Build and deploy staging
./deploy.sh deploy

# Or manually
docker-compose build
docker-compose up -d
```

This will:
- Build frontend with `.env.staging`
- Run backend with `.env.staging`

### Production Deployment

Uses `Dockerfile.production` and `docker-compose.production.yml`:

```bash
# Build and deploy production
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

This will:
- Build frontend with `.env.production`
- Run backend with `.env.prod`

## File Structure

```
frontend/
├── .env.example          # Template file (committed to git)
├── .env.development      # Local dev config (can be in git)
├── .env.staging          # Staging config (can be in git if not sensitive)
├── .env.production       # Production config (can be in git if not sensitive)
└── src/
    └── firebase/
        ├── firebaseConfig.js  # Uses import.meta.env variables
        └── index.js           # Uses import.meta.env variables

backend/
├── .env.example          # Template file (committed to git)
├── .env.local            # Local dev (NOT in git)
├── .env.staging          # Staging (NOT in git)
└── .env.prod             # Production (NOT in git)
```

## Important Notes

### Build-Time vs Runtime

**Frontend variables** (VITE_*):
- ⚠️ **Embedded at build time** - changing these requires rebuilding
- Not secret - they're visible in the browser
- Safe to commit to git (they're public in the built JavaScript)

**Backend variables**:
- 🔒 **Loaded at runtime** - can be changed without rebuilding
- Should be kept secret
- **Never commit to git**

### Vite Environment Variable Rules

1. Only variables prefixed with `VITE_` are exposed to the frontend
2. They are replaced at build time (not runtime)
3. Available via `import.meta.env.VITE_VARIABLE_NAME`
4. Different `.env` files are used based on the `mode`:
   - `npm run dev` → `.env.development`
   - `npm run build` → `.env.production`
   - `npm run build --mode staging` → `.env.staging`

## Updating Firebase Configuration

### For Development

1. Edit `frontend/.env.development`
2. Update the Firebase values
3. Restart dev server: `npm run dev`

### For Staging

1. Edit `frontend/.env.staging`
2. Update the Firebase values
3. Rebuild: `npm run build:staging`
4. Redeploy: `./deploy.sh deploy`

### For Production

1. Edit `frontend/.env.production`
2. Update the Firebase values
3. Rebuild: `npm run build:production`
4. Redeploy: `docker-compose -f docker-compose.production.yml up -d --build`

## Verification

### Check Frontend Configuration

After building, you can verify the configuration is loaded:

1. Open browser console
2. If there are missing variables, you'll see an error:
   ```
   ❌ Missing Firebase configuration: ['apiKey', 'projectId']
   ```

### Check Backend Configuration

```bash
# View backend environment
curl http://localhost:9000/env
```

## Migration from Hardcoded Values

The old files had hardcoded Firebase values:

```javascript
// ❌ Old way (hardcoded)
const firebaseConfig = {
  apiKey: "AIzaSyBRynwv8B-go_6k_x9kiaH_eua-DwSJbHM",
  authDomain: "shanthi-online-gold.firebaseapp.com",
  // ...
};
```

New files use environment variables:

```javascript
// ✅ New way (environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ...
};
```

## Troubleshooting

### "Missing Firebase configuration" Error

**Cause**: Environment variables not set or not prefixed with `VITE_`

**Solution**:
1. Check that your `.env` file has all required variables
2. Ensure all variables start with `VITE_`
3. Restart dev server or rebuild

### Firebase Initializes with Wrong Project

**Cause**: Using wrong `.env` file or cached build

**Solution**:
1. Verify you're using the correct build command
2. Clear build cache: `rm -rf dist`
3. Rebuild with correct mode

### Environment Variables Not Updating

**Cause**: Frontend env vars are embedded at build time

**Solution**:
1. For development: Restart dev server
2. For production/staging: Rebuild the application

### Can't Find .env File

**Cause**: File not created yet

**Solution**:
```bash
cd frontend
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production
# Edit each file with appropriate values
```

## Security Best Practices

1. ✅ **Frontend Firebase config is public** - This is normal and expected
2. ✅ **Backend .env files should be private** - Never commit to git
3. ✅ **Use Firebase Security Rules** - Control data access properly
4. ✅ **Enable App Check** - Verify requests come from your app (optional)
5. ✅ **Separate projects** - Use different Firebase projects for staging/production
6. ✅ **Monitor usage** - Check Firebase console for suspicious activity

## Summary

| Environment | Frontend Env File | Backend Env File | Docker File | Build Command |
|-------------|------------------|------------------|-------------|---------------|
| Development | `.env.development` | `.env.local` | N/A | `npm run dev` |
| Staging | `.env.staging` | `.env.staging` | `Dockerfile` | `npm run build:staging` |
| Production | `.env.production` | `.env.prod` | `Dockerfile.production` | `npm run build:production` |

---

**Next Steps**:
1. Review and update `.env.staging` with your staging Firebase project values
2. Create `.env.production` with your production Firebase project values
3. Test locally with different environment files
4. Deploy to staging to verify configuration
