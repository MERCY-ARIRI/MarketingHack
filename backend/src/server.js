import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import twilio from 'twilio'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

// Lightweight debug to confirm env vars are visible (without printing secrets)
const sidPreview = process.env.TWILIO_ACCOUNT_SID
  ? process.env.TWILIO_ACCOUNT_SID.slice(0, 4)
  : null
console.log('[Twilio env check]', {
  hasSid: !!process.env.TWILIO_ACCOUNT_SID,
  sidStartsWith: sidPreview,
  hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
  hasFrom: !!process.env.TWILIO_WHATSAPP_FROM,
})

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' })
})

app.post('/api/send-test', async (req, res) => {
  const { to, body } = req.body || {}

  if (!to || !body) {
    return res.status(400).json({ error: 'Missing `to` or `body` in request' })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !from) {
    return res.status(500).json({
      error:
        'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in backend/.env',
    })
  }

  try {
    const client = twilio(accountSid, authToken)

    const message = await client.messages.create({
      from, // e.g. 'whatsapp:+14155238886'
      to, // e.g. 'whatsapp:+2547xxxxxxx'
      body,
    })

    return res.json({
      ok: true,
      sid: message.sid,
      status: message.status,
    })
  } catch (err) {
    console.error('Error sending WhatsApp via Twilio:', err?.message || err)
    return res.status(500).json({
      error: 'Failed to send WhatsApp via Twilio',
      details: err?.message,
    })
  }
})

app.post('/api/send-sms', async (req, res) => {
  const { to, body } = req.body || {}

  if (!to || !body) {
    return res.status(400).json({ error: 'Missing `to` or `body` in request' })
  }

  // Mock SMS send for now
  console.log('[MOCK SMS]', { to, body })
  return res.json({
    ok: true,
    sid: 'mock-sms-sid-' + Date.now(),
    status: 'mocked',
    note:
      'This is a mock SMS send. When ready, we can plug this into Twilio SMS using the same credentials.',
  })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})


