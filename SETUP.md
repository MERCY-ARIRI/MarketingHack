# Setup Instructions

## Prerequisites
- Node.js installed
- Twilio account (for WhatsApp functionality)
- Africa's Talking account (for SMS functionality)

## Installation Steps

### 1. Install Dependencies
Dependencies have been installed. If you need to reinstall:
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure Backend Environment Variables

Create a `.env` file in the `backend` directory with the following:

```env
# Twilio (for WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Africa's Talking (for SMS)
AFRICASTALKING_USERNAME=your_username_here
AFRICASTALKING_API_KEY=your_api_key_here
AFRICASTALKING_SENDER_ID=your_sender_id_here

# Server
PORT=4000
```

**To get Twilio credentials:**
1. Sign up at https://www.twilio.com/
2. Go to Twilio Console: https://console.twilio.com/
3. Get your Account SID and Auth Token from the dashboard
4. For WhatsApp testing, use the Twilio Sandbox number (format: `whatsapp:+14155238886`)

**To get Africa's Talking credentials:**
1. Sign up at https://africastalking.com/
2. Log in to your dashboard and create a new application
3. Get your Username and API Key from the application settings
4. (Optional) Request a Sender ID from the SMS section in your dashboard
   - Sender ID: An alphanumeric identifier that brands your messages
   - For testing, you can use the sandbox environment (username: `sandbox`)
5. For production, you'll need to request a Sender ID or Shortcode from Africa's Talking

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns)
The backend will be available at `http://localhost:4000`

## Notes

- The frontend uses Vite's proxy to forward `/api/*` requests to the backend
- WhatsApp functionality requires Twilio sandbox setup or approved WhatsApp Business API
- SMS sending uses Africa's Talking API (configured via environment variables)
- For testing SMS, use Africa's Talking sandbox environment (username: `sandbox`)
- Phone numbers should include country code (e.g., +2547XXXXXXXXX for Kenya, +2348XXXXXXXXX for Nigeria)

