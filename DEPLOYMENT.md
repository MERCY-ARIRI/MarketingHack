# Deployment Guide for Render

## Quick Setup

### 1. Backend Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo: `MERCY-ARIRI/MarketingHack`
4. Configure:
   - **Name**: `marketinghack-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `4000`

5. Add Environment Variables:
   - `TWILIO_ACCOUNT_SID` = (your Twilio Account SID)
   - `TWILIO_AUTH_TOKEN` = (your Twilio Auth Token)
   - `TWILIO_WHATSAPP_FROM` = `whatsapp:+14155238886` (or your sandbox number)
   - `NODE_ENV` = `production`
   - `PORT` = `4000`

6. Click **"Create Web Service"**

### 2. Frontend Service

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repo
3. Configure:
   - **Name**: `marketinghack-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Add Environment Variable:
   - `VITE_API_URL` = `https://marketinghack-backend.onrender.com` (use your actual backend URL)

5. Click **"Create Static Site"**

### 3. Update Frontend API Calls (Optional)

If your frontend and backend are on different domains, you may need to update fetch calls to use the full backend URL. The `api.js` helper is already created for this purpose.

## Troubleshooting

- **"Could not read package.json"**: Make sure Root Directory is set to `backend` or `frontend`, not the project root.
- **CORS errors**: Make sure your backend has CORS enabled (already configured in `server.js`).
- **Environment variables not working**: Make sure they're set in Render dashboard, not in `.env` files (which aren't deployed).



