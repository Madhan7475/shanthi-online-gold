# Shanthi Online Gold

A comprehensive e-commerce platform for gold and jewelry, built with React (Vite) frontend and Node.js/Express backend.

## 📚 Documentation

### Deployment Options

Choose the deployment method that fits your needs:

1. **🐳 Docker + VPS (Recommended)** → See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Complete guide for deploying with Docker on your own VPS
   - Includes nginx reverse proxy and SSL setup
   - Single comprehensive guide with all steps

2. **☁️ Cloud Hosting (Render + Vercel)** → See [DEPLOYMENT.md](./DEPLOYMENT.md)
   - Backend on Render, Frontend on Vercel
   - No server management required

3. **🔧 Development Tunnel (Testing)** → See below
   - Temporarily expose local dev to the internet
   - NOT for production use

---

## 🚀 Development - Public URL (Temporary Tunnel)

This method temporarily exposes your local dev servers to the internet using a reverse tunnel. It is NOT a permanent deployment.

## Quick Start (every time you log in)

Open three terminals and run:

1) Backend (Terminal A)
```
cd /Users/kpb/Documents/shanthi-online-gold/backend
node server.js
```

2) Frontend (Terminal B)
```
cd /Users/kpb/Documents/shanthi-online-gold/frontend
npm run dev -- --host
```

3) Public URL for the site (Terminal C)
```
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:5173 nokey@localhost.run
```

- After a successful connection, you will see a line like:
  ```
  25ee56ed09d42c.lhr.life tunneled with tls termination, https://25ee56ed09d42c.lhr.life
  ```
- The public URL to share is the HTTPS link it prints, for example:
  ```
  https://25ee56ed09d42c.lhr.life
  ```

Keep all three terminals running. If any of them stop (or the machine sleeps), the public link stops working.

## How the URL looks

- The public URL is generated each time you start the tunnel.
- It will look like this:
  ```
  https://<random-subdomain>.lhr.life
  ```
  Example:
  ```
  https://25ee56ed09d42c.lhr.life
  ```
- This subdomain changes every time you start a new tunnel.

## How traffic flows

- Frontend dev server runs on localhost:5173 (Vite).
- Backend API runs on localhost:9000 (Express).
- The Vite dev server proxies API and uploads to the backend, so you do NOT need a separate backend tunnel.
  - Proxy rules (already configured):
    - `/api`  -> http://localhost:9000
    - `/uploads` -> http://localhost:9000

By default, the frontend uses relative `/api` so all requests go through the Vite proxy and reach your backend.

## Optional: Expose the backend directly

Only needed if you want to share raw API or uploaded images without the frontend proxy.

4) Backend tunnel (Terminal D, optional)
```
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:9000 nokey@localhost.run
```

If you use a backend tunnel and want the frontend to call it directly, set:
```
# Replace BACKEND_URL with the printed backend tunnel, e.g. https://abcd1234.lhr.life
# Then restart the frontend (Ctrl+C then npm run dev -- --host)
VITE_API_BASE_URL=BACKEND_URL
```
If you leave `VITE_API_BASE_URL` empty, the frontend will continue to work via the Vite proxy.

## After reboot / login

Repeat the same three steps:
1) Start backend
2) Start frontend
3) Start the frontend tunnel and copy the new `https://<random>.lhr.life` URL

If you had set `VITE_API_BASE_URL` to point to a backend tunnel, update it to the new backend tunnel URL and restart the frontend server.

## Google sign-in on the tunnel

- Firebase Authentication requires the site domain to be listed in “Authorized domains”.
- The tunnel domain changes each run, so Google sign-in does NOT work unless you add the current tunnel domain in Firebase Console:
  - Firebase Console → Authentication → Settings → Authorized domains → Add the current `*.lhr.life` subdomain.
- Alternatives:
  - Use `http://localhost:5173` for testing (already authorized by Firebase).
  - Deploy to a stable domain (Vercel/Netlify) and authorize it once.

## OTP notes

- OTP sessions are stored in-memory on the backend. Restarting the backend clears OTP sessions.
- Verify your OTP within 5 minutes (TTL) and avoid restarting the backend between send-otp and verify-otp.
- For production, use persistent storage (Redis or Mongo TTL) for OTP sessions.

## Troubleshooting

- “Blocked request. This host is not allowed.”  
  The Vite config has `server.host = true` and `server.allowedHosts = true` already. If you ever see the error again, make sure the frontend dev server restarted and is running.

- Frontend can’t reach API  
  - Ensure Terminal A (backend) and Terminal B (frontend) are running.
  - If you set `VITE_API_BASE_URL` to a backend tunnel, update it to the current tunnel and restart the frontend.
  - Otherwise leave `VITE_API_BASE_URL` empty to use the proxy.

- Images don’t load  
  - The Vite proxy forwards `/uploads` to the backend. Ensure backend is running.
  - If you’re using a direct backend tunnel, ensure `VITE_API_BASE_URL` points to that tunnel.

- Public URL doesn’t work  
  - Ensure the SSH tunnel terminal (Terminal C) is still connected.
  - Keep your machine awake and online.

## Command summary

Backend
```
cd /Users/kpb/Documents/shanthi-online-gold/backend
node server.js
```

Frontend
```
cd /Users/kpb/Documents/shanthi-online-gold/frontend
npm run dev -- --host
```

Public URL (frontend)
```
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:5173 nokey@localhost.run
```

(Optional) Public URL (backend)
```
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -R 80:localhost:9000 nokey@localhost.run
```

## Production suggestion

For an always-on site, deploy:
- Frontend: Vercel/Netlify
- Backend: Render/Railway/Fly.io
- Add the stable frontend domain to Firebase Authorized domains.
- Move OTP session storage to Redis or Mongo TTL.
