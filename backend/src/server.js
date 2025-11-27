import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import twilio from 'twilio'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import africastalking from 'africastalking'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

// In-memory contact storage (in production, use a database)
let contacts = []

// Load contacts from file if it exists (persistence)
const contactsFile = path.join(__dirname, '../data/contacts.json')
try {
  if (fs.existsSync(contactsFile)) {
    const data = fs.readFileSync(contactsFile, 'utf8')
    contacts = JSON.parse(data)
    console.log(`Loaded ${contacts.length} contacts from storage`)
  }
} catch (err) {
  console.log('No existing contacts file, starting fresh')
}

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Save contacts to file
function saveContacts() {
  try {
    fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2))
  } catch (err) {
    console.error('Error saving contacts:', err)
  }
}

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

// Initialize Africa's Talking SMS client
let africastalkingClient = null
const atUsername = process.env.AFRICASTALKING_USERNAME
const atApiKey = process.env.AFRICASTALKING_API_KEY
const atSenderId = process.env.AFRICASTALKING_SENDER_ID

if (atUsername && atApiKey) {
  try {
    africastalkingClient = africastalking({
      username: atUsername,
      apiKey: atApiKey,
    })
    console.log('[Africa\'s Talking] Client initialized successfully')
  } catch (err) {
    console.error('[Africa\'s Talking] Failed to initialize:', err.message)
  }
} else {
  console.log('[Africa\'s Talking] Credentials not configured. Set AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY in backend/.env')
}

app.use(cors())
app.use(express.json())

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const upload = multer({ dest: uploadsDir })

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

  if (!africastalkingClient) {
    return res.status(500).json({
      error:
        'Africa\'s Talking credentials not configured. Set AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY, and optionally AFRICASTALKING_SENDER_ID in backend/.env',
    })
  }

  try {
    const sms = africastalkingClient.SMS
    const recipients = [to] // Africa's Talking expects an array of recipients
    
    // Prepare options for sending SMS
    const options = {
      to: recipients,
      message: body,
    }

    // Add sender ID if configured (optional but recommended)
    if (atSenderId) {
      options.from = atSenderId
    }

    const response = await sms.send(options)

    // Africa's Talking response structure
    const messageData = response.SMSMessageData
    
    return res.json({
      ok: true,
      messageId: messageData?.Recipients?.[0]?.messageId || 'unknown',
      status: messageData?.Recipients?.[0]?.status || 'sent',
      statusCode: messageData?.Recipients?.[0]?.statusCode || '101',
      cost: messageData?.Recipients?.[0]?.cost || '0',
      provider: 'Africa\'s Talking',
    })
  } catch (err) {
    console.error('Error sending SMS via Africa\'s Talking:', err?.message || err)
    return res.status(500).json({
      error: 'Failed to send SMS via Africa\'s Talking',
      details: err?.message || err?.toString(),
    })
  }
})

// Contact management endpoints
app.get('/api/contacts', (req, res) => {
  const { search, optInStatus } = req.query
  let filteredContacts = [...contacts]

  // Filter by search term (name, phone, email)
  if (search) {
    const searchLower = search.toLowerCase()
    filteredContacts = filteredContacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(searchLower)
    )
  }

  // Filter by opt-in status
  if (optInStatus) {
    filteredContacts = filteredContacts.filter((c) => c.optInStatus === optInStatus)
  }

  return res.json({
    ok: true,
    contacts: filteredContacts,
    total: filteredContacts.length,
  })
})

app.post('/api/contacts/import', upload.single('csv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' })
  }

  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8')
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no valid rows' })
    }

    // Process and validate contacts
    const imported = []
    const errors = []

    records.forEach((row, index) => {
      // Expected CSV columns: name, phone, email (optional), optInStatus (optional)
      const name = row.name || row.Name || row.NAME || ''
      const phone = row.phone || row.Phone || row.PHONE || row.phoneNumber || row['phone number'] || ''
      const email = row.email || row.Email || row.EMAIL || ''
      const optInStatus = row.optInStatus || row['opt-in'] || row['opt in'] || row.optIn || 'unknown'

      if (!name || !phone) {
        errors.push(`Row ${index + 2}: Missing name or phone number`)
        return
      }

      // Normalize phone number (ensure it starts with +)
      let normalizedPhone = phone.trim()
      if (!normalizedPhone.startsWith('+')) {
        // If it doesn't start with +, try to add country code
        // For now, we'll just add + if it's missing
        normalizedPhone = '+' + normalizedPhone.replace(/^\+/, '')
      }

      // Check for duplicates
      const existing = contacts.find((c) => c.phone === normalizedPhone)
      if (existing) {
        // Update existing contact
        existing.name = name
        existing.email = email || existing.email
        if (optInStatus && optInStatus !== 'unknown') {
          existing.optInStatus = optInStatus.toLowerCase()
        }
        imported.push({ ...existing, updated: true })
      } else {
        // Create new contact
        const contact = {
          id: Date.now() + index,
          name,
          phone: normalizedPhone,
          email: email || '',
          optInStatus: optInStatus.toLowerCase() || 'unknown',
          createdAt: new Date().toISOString(),
        }
        contacts.push(contact)
        imported.push({ ...contact, updated: false })
      }
    })

    // Save to file
    saveContacts()

    // Clean up uploaded file
    fs.unlinkSync(req.file.path)

    return res.json({
      ok: true,
      imported: imported.length,
      updated: imported.filter((c) => c.updated).length,
      created: imported.filter((c) => !c.updated).length,
      errors: errors.length > 0 ? errors : undefined,
      contacts: imported,
    })
  } catch (err) {
    console.error('Error importing CSV:', err)
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    return res.status(500).json({
      error: 'Failed to import CSV',
      details: err.message,
    })
  }
})

app.put('/api/contacts/:id/opt-in', (req, res) => {
  const { id } = req.params
  const contact = contacts.find((c) => c.id === parseInt(id))

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' })
  }

  contact.optInStatus = 'opted-in'
  contact.optInDate = new Date().toISOString()
  saveContacts()

  return res.json({ ok: true, contact })
})

app.put('/api/contacts/:id/opt-out', (req, res) => {
  const { id } = req.params
  const contact = contacts.find((c) => c.id === parseInt(id))

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' })
  }

  contact.optInStatus = 'opted-out'
  contact.optOutDate = new Date().toISOString()
  saveContacts()

  return res.json({ ok: true, contact })
})

app.delete('/api/contacts/:id', (req, res) => {
  const { id } = req.params
  const index = contacts.findIndex((c) => c.id === parseInt(id))

  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' })
  }

  contacts.splice(index, 1)
  saveContacts()

  return res.json({ ok: true, message: 'Contact deleted' })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})


