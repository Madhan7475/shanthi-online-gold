Deployment Guide: Backend on Render, Frontend on Vercel

Overview
- Backend: Node/Express + MongoDB running on Render using render.yaml (already in repo).
- Frontend: React (Vite) on Vercel.
- Secrets: Set as environment variables (never commit to git).
- File uploads: Persist on Render via a mounted disk at backend/uploads.

What you already provided (use these values, do NOT commit them)
- PORT=9000 (local dev only)
- MONGO_URI=... (MongoDB Atlas)
- JWT_SECRET=... (random string)
- FIREBASE_PROJECT_ID=...
- FIREBASE_CLIENT_EMAIL=...
- FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

Important note for FIREBASE_PRIVATE_KEY on Render:
- Paste as a single line with \n for newlines (no surrounding quotes).
- Example format (single line):
  -----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n

Repository structure
- backend/server.js loads backend/.env for local dev and reads environment variables on Render.
- render.yaml defines a Node web service in the backend directory and a persistent disk for uploads.
- frontend/.env contains VITE_API_BASE_URL= (to be set per environment).

1) Backend deployment on Render
A. Push to GitHub
- Ensure this repository is on GitHub with render.yaml at the repo root.

B. Create service from Blueprint
- In Render: New → Blueprint → select your GitHub repo.
- Render will detect render.yaml and create the service shanthi-backend.

C. Configure environment variables (Render → your service → Environment)
Set the following keys with your real values:
- MONGO_URI
- JWT_SECRET
- CORS_ORIGIN (recommended initial value): https://*.vercel.app,http://localhost:5173
  - After frontend deploy, add https://your-vercel-app.vercel.app
  - Add your custom domain if you use one.
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY (paste as single line with \n, no quotes)
- RAZORPAY_KEY_ID (optional if you use payments)
- RAZORPAY_KEY_SECRET (optional if you use payments)

D. Deploy
- Click Deploy / Apply changes. After success, note the backend base URL:
  - Example: https://shanthi-backend.onrender.com
- Sanity checks:
  - GET https://<render-url>/ should respond “Backend is running”.
  - GET https://<render-url>/api/products should return product data (if present).

2) Frontend deployment on Vercel
A. Create Vercel project
- Import the same GitHub repo.
- Set Root Directory: frontend
- Build Command: npm run build (default)
- Output Directory: dist (default)
- Framework: Vite (auto-detected)

B. Set Vercel environment variable
- VITE_API_BASE_URL = https://<your-render-backend-url>
  Example: https://shanthi-backend.onrender.com

C. Deploy and verify
- Visit the Vercel URL, e.g. https://<your-app>.vercel.app
- Test flows (login, products, carts, orders).

D. Update backend CORS when needed
- Add your Vercel production URL to CORS_ORIGIN if not already included.
- Include https://*.vercel.app to cover preview URLs.

3) Local development
A. Backend
- Create backend/.env (DO NOT COMMIT) using the values you provided:
  - PORT=9000
  - MONGO_URI=...
  - JWT_SECRET=...
  - CORS_ORIGIN=http://localhost:5173
  - FIREBASE_PROJECT_ID=...
  - FIREBASE_CLIENT_EMAIL=...
  - FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
- Run:
  - cd backend
  - npm install
  - npm run dev

B. Frontend
- Set frontend/.env:
  - VITE_API_BASE_URL=http://localhost:9000
- Run:
  - cd frontend
  - npm install
  - npm run dev

4) File uploads on Render
- render.yaml mounts a persistent disk at backend/uploads.
- server.js creates uploads directory if missing and serves it at /uploads.
- Verify uploaded files via https://<render-url>/uploads/<filename>.

5) Troubleshooting
- CORS errors:
  - Update CORS_ORIGIN in Render to include the exact domain you are calling from (production URL, preview URLs, and http://localhost:5173 for local).
  - You can use wildcard patterns like https://*.vercel.app (already supported by server code).
- Firebase Admin errors (“Missing Firebase env variables”):
  - Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY exist and that the private key is pasted as a single line with \n (no quotes on Render).
- 401 Unauthorized from backend:
  - Ensure frontend is attaching the Firebase ID token to Authorization header (handled by axiosInstance).
  - Confirm your Firebase web config in frontend/src/firebase/firebaseConfig.js is correct.
- MongoDB connection errors:
  - Verify MONGO_URI has correct user credentials and that Network Access in Atlas allows Render (0.0.0.0/0 or specific IP ranges).
- Razorpay:
  - Use live keys in production and ensure both keys are set on Render.

6) Final checklist
- Backend deployed on Render and / responds healthy.
- Env vars set on Render with correct values, especially FIREBASE_PRIVATE_KEY formatting.
- Frontend deployed on Vercel and VITE_API_BASE_URL points to Render.
- CORS_ORIGIN includes your Vercel domain(s) and localhost.
- Optional: custom domain added to Vercel (and added to CORS_ORIGIN).

This guide avoids storing secrets in the repository and uses environment variables for both local and production environments. With the provided values, you only need to paste them into backend/.env (local) and Render (production), set VITE_API_BASE_URL on Vercel, and deploy.
