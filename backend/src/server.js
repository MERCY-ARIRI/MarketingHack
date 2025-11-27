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
let scheduledPosts = []
let smsCampaigns = []

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
    console.log('[Africa\'s Talking] Client initialized successfully', {
      username: atUsername,
      hasApiKey: !!atApiKey,
      apiKeyLength: atApiKey?.length || 0,
      senderId: atSenderId || 'not set',
    })
  } catch (err) {
    console.error('[Africa\'s Talking] Failed to initialize:', err.message)
  }
} else {
  console.log('[Africa\'s Talking] Credentials not configured. Set AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY in backend/.env', {
    hasUsername: !!atUsername,
    hasApiKey: !!atApiKey,
  })
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

    console.log('[Africa\'s Talking] Sending SMS:', {
      to: recipients,
      messageLength: body.length,
      hasSenderId: !!atSenderId,
      senderId: atSenderId,
    })

    const response = await sms.send(options)

    // Log full response for debugging
    console.log('[Africa\'s Talking] Full response:', JSON.stringify(response, null, 2))

    // Africa's Talking response structure
    const messageData = response.SMSMessageData
    
    if (!messageData || !messageData.Recipients || messageData.Recipients.length === 0) {
      console.error('[Africa\'s Talking] Unexpected response structure:', response)
      return res.status(500).json({
        error: 'Unexpected response from Africa\'s Talking',
        response: response,
      })
    }

    const recipient = messageData.Recipients[0]
    const statusCode = recipient.statusCode
    const status = recipient.status

    // Check if message was actually sent successfully
    if (statusCode !== 101 || status !== 'Success') {
      console.warn('[Africa\'s Talking] Message not sent successfully:', {
        statusCode,
        status,
        message: messageData.Message,
        recipient,
      })
    }

    return res.json({
      ok: true,
      messageId: recipient.messageId || 'unknown',
      status: status,
      statusCode: statusCode,
      cost: recipient.cost || '0',
      provider: 'Africa\'s Talking',
      fullResponse: messageData.Message,
      rawResponse: response, // Include full response for debugging
    })
  } catch (err) {
    console.error('[Africa\'s Talking] Error sending SMS:', {
      message: err?.message,
      stack: err?.stack,
      error: err,
    })
    return res.status(500).json({
      error: 'Failed to send SMS via Africa\'s Talking',
      details: err?.message || err?.toString(),
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
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

// Content Generation API
app.post('/api/generate-content', async (req, res) => {
  const { contentType, prompt, tone } = req.body

  if (!contentType || !prompt) {
    return res.status(400).json({ error: 'Missing contentType or prompt' })
  }

  try {
    // Mock AI content generation (in production, use OpenAI API or similar)
    const content = generateMockContent(contentType, prompt, tone)
    const variations = [
      generateMockContent(contentType, prompt, tone),
      generateMockContent(contentType, prompt, tone),
    ]

    return res.json({
      ok: true,
      content,
      variations,
      contentType,
      tone,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate content', details: err.message })
  }
})

function generateMockContent(contentType, prompt, tone) {
  const tones = {
    professional: 'professional and polished',
    casual: 'casual and approachable',
    friendly: 'warm and friendly',
    urgent: 'urgent and action-oriented',
    humorous: 'fun and lighthearted',
  }

  const templates = {
    caption: `🎯 ${prompt}\n\n✨ Don't miss out! ${tone === 'urgent' ? 'Limited time offer!' : 'Check it out today!'}\n\n#marketing #business`,
    poster: `${prompt.toUpperCase()}\n\n${tone === 'urgent' ? 'ACT NOW!' : 'Learn More Today'}\n\nContact us for details`,
    ad: `Introducing: ${prompt}\n\n${tone === 'professional' ? 'Experience the difference.' : 'You won\'t want to miss this!'}\n\nGet started now!`,
    email: `${prompt} - ${tone === 'urgent' ? 'Action Required' : 'Important Update'}`,
  }

  return templates[contentType] || `Content about: ${prompt} (${tones[tone] || 'professional'} tone)`
}

// Campaign Ideas API
app.post('/api/campaign-ideas', async (req, res) => {
  const { businessType, targetAudience, budget } = req.body

  if (!businessType) {
    return res.status(400).json({ error: 'Missing businessType' })
  }

  try {
    // Mock AI campaign ideas (in production, use OpenAI API)
    const campaigns = generateMockCampaignIdeas(businessType, targetAudience, budget)

    return res.json({
      ok: true,
      campaigns,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate campaign ideas', details: err.message })
  }
})

function generateMockCampaignIdeas(businessType, targetAudience, budget) {
  const budgetLevels = {
    low: { range: '$50-$200', duration: '1-2 weeks' },
    medium: { range: '$200-$1000', duration: '2-4 weeks' },
    high: { range: '$1000+', duration: '1-3 months' },
  }

  const budgetInfo = budgetLevels[budget] || budgetLevels.low

  return [
    {
      title: `Social Media Blitz for ${businessType}`,
      description: `Launch a comprehensive social media campaign targeting ${targetAudience || 'your audience'} with engaging content and strategic posting.`,
      budget: budgetInfo.range,
      duration: budgetInfo.duration,
      tactics: [
        'Daily posts across Instagram, Facebook, and TikTok',
        'User-generated content campaign',
        'Influencer partnerships',
        'Paid social media ads',
      ],
    },
    {
      title: `Email Marketing Campaign`,
      description: `Build and nurture your customer base with a series of targeted email campaigns.`,
      budget: budgetInfo.range,
      duration: budgetInfo.duration,
      tactics: [
        'Welcome email series',
        'Newsletter with valuable content',
        'Promotional campaigns',
        'Customer retention emails',
      ],
    },
    {
      title: `Referral Program`,
      description: `Encourage existing customers to refer new customers with an attractive incentive program.`,
      budget: budgetInfo.range,
      duration: budgetInfo.duration,
      tactics: [
        'Referral discount codes',
        'Reward system for referrers',
        'Social sharing incentives',
        'Tracking and analytics',
      ],
    },
    {
      title: `Content Marketing Strategy`,
      description: `Establish your ${businessType} as an authority in your industry through valuable content.`,
      budget: budgetInfo.range,
      duration: budgetInfo.duration,
      tactics: [
        'Blog posts and articles',
        'Video content creation',
        'Infographics and visual content',
        'SEO optimization',
      ],
    },
  ]
}

// Social Media Scheduler API
app.post('/api/schedule-social-post', (req, res) => {
  const { content, platforms, scheduledTime, imageUrl } = req.body

  if (!content || !platforms || platforms.length === 0 || !scheduledTime) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const post = {
    id: Date.now(),
    content,
    platforms,
    scheduledTime,
    imageUrl: imageUrl || '',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  }

  scheduledPosts.push(post)

  return res.json({ ok: true, post })
})

app.get('/api/scheduled-posts', (req, res) => {
  return res.json({ ok: true, posts: scheduledPosts })
})

// Mass SMS Campaigns API
// Helper function to parse and normalize phone numbers
function parsePhoneNumbers(input) {
  if (!input || !input.trim()) {
    console.log('[parsePhoneNumbers] Empty input')
    return []
  }
  
  console.log('[parsePhoneNumbers] Input:', input.substring(0, 100))
  
  // Split by comma or newline
  const numbers = input
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
  
  console.log('[parsePhoneNumbers] After split and filter:', numbers.length, 'numbers found')
  
  // Normalize phone numbers (ensure they start with +)
  const normalized = numbers.map((phone) => {
    let normalized = phone.trim()
    // Remove spaces, dashes, parentheses
    normalized = normalized.replace(/[\s\-\(\)]/g, '')
    // If it doesn't start with +, try to add it
    if (!normalized.startsWith('+')) {
      // If it starts with 0, remove it and add country code (default to +254 for Kenya)
      if (normalized.startsWith('0')) {
        normalized = '+254' + normalized.substring(1)
      } else {
        // Assume it's missing the +, add it
        normalized = '+' + normalized
      }
    }
    return normalized
  })
  
  console.log('[parsePhoneNumbers] Normalized numbers:', normalized.slice(0, 5))
  return normalized
}

app.post('/api/sms-campaigns', (req, res) => {
  const { name, message, audience, scheduledTime, manualPhoneNumbers } = req.body

  if (!name || !message) {
    return res.status(400).json({ error: 'Missing name or message' })
  }

  let targetContacts = []
  let manualPhones = []
  let totalCount = 0

  if (audience === 'manual') {
    // Parse manual phone numbers
    console.log('[SMS Campaign Create] Manual audience selected, phone numbers:', manualPhoneNumbers?.substring(0, 100))
    
    if (!manualPhoneNumbers || !manualPhoneNumbers.trim()) {
      console.error('[SMS Campaign Create] No manual phone numbers provided')
      return res.status(400).json({ error: 'Please provide at least one phone number for manual audience' })
    }
    
    manualPhones = parsePhoneNumbers(manualPhoneNumbers)
    console.log('[SMS Campaign Create] Parsed phone numbers:', manualPhones.length, 'numbers')
    
    if (manualPhones.length === 0) {
      console.error('[SMS Campaign Create] No valid phone numbers after parsing')
      return res.status(400).json({ 
        error: 'No valid phone numbers found. Please enter phone numbers with country code (e.g., +254712345678). Make sure numbers are separated by commas or new lines.' 
      })
    }
    
    totalCount = manualPhones.length
    console.log('[SMS Campaign Create] Total count set to:', totalCount)
  } else {
    // Filter contacts based on audience
    targetContacts = contacts
    if (audience === 'opted-in') {
      targetContacts = contacts.filter((c) => c.optInStatus === 'opted-in')
    }
    totalCount = targetContacts.length
  }

  const campaign = {
    id: Date.now(),
    name,
    message,
    audience,
    scheduledTime: scheduledTime || null,
    status: scheduledTime ? 'scheduled' : 'draft',
    totalCount,
    sentCount: 0,
    failedCount: 0,
    createdAt: new Date().toISOString(),
  }

  // Store manual phone numbers if audience is manual
  if (audience === 'manual') {
    campaign.manualPhoneNumbers = manualPhones
    campaign.manualPhoneCount = manualPhones.length
    console.log(`[SMS Campaign Create] Created manual campaign with ${manualPhones.length} phone numbers:`, {
      campaignId: campaign.id,
      campaignName: campaign.name,
      phoneNumbers: manualPhones.slice(0, 3), // Log first 3 for debugging
    })
  }

  smsCampaigns.push(campaign)

  console.log('[SMS Campaign Create] Campaign created:', {
    id: campaign.id,
    name: campaign.name,
    audience: campaign.audience,
    totalCount: campaign.totalCount,
    hasManualPhoneNumbers: !!campaign.manualPhoneNumbers,
  })

  return res.json({ ok: true, campaign })
})

app.get('/api/sms-campaigns', (req, res) => {
  // Log campaigns for debugging
  console.log('[SMS Campaigns GET] Returning campaigns:', smsCampaigns.map(c => ({
    id: c.id,
    name: c.name,
    audience: c.audience,
    hasManualPhoneNumbers: !!c.manualPhoneNumbers,
    manualPhoneNumbersCount: c.manualPhoneNumbers?.length || 0,
  })))
  return res.json({ ok: true, campaigns: smsCampaigns })
})

app.post('/api/sms-campaigns/:id/send', async (req, res) => {
  const { id } = req.params
  const campaign = smsCampaigns.find((c) => c.id === parseInt(id))

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' })
  }

  if (!africastalkingClient) {
    return res.status(500).json({
      error: 'Africa\'s Talking not configured. Cannot send SMS.',
    })
  }

  console.log('[SMS Campaign Send] Campaign details:', {
    id: campaign.id,
    name: campaign.name,
    audience: campaign.audience,
    audienceType: typeof campaign.audience,
    hasManualPhoneNumbers: !!campaign.manualPhoneNumbers,
    manualPhoneNumbersCount: campaign.manualPhoneNumbers?.length || 0,
    totalCount: campaign.totalCount,
    campaignKeys: Object.keys(campaign),
  })

  // Get recipients based on audience type
  let recipients = []
  
  // Check if this is a manual campaign (case-insensitive check for safety)
  const isManualCampaign = campaign.audience === 'manual' || campaign.audience?.toLowerCase() === 'manual'
  
  if (isManualCampaign) {
    // Use manual phone numbers
    if (!campaign.manualPhoneNumbers || !Array.isArray(campaign.manualPhoneNumbers) || campaign.manualPhoneNumbers.length === 0) {
      console.error('[SMS Campaign] Manual campaign missing phone numbers:', {
        campaignId: campaign.id,
        campaignName: campaign.name,
        audience: campaign.audience,
        hasManualPhoneNumbers: !!campaign.manualPhoneNumbers,
        isArray: Array.isArray(campaign.manualPhoneNumbers),
        manualPhoneNumbersLength: campaign.manualPhoneNumbers?.length || 0,
        manualPhoneNumbersType: typeof campaign.manualPhoneNumbers,
        campaignObject: JSON.stringify(campaign, null, 2),
      })
      return res.status(400).json({ 
        error: 'No phone numbers found for this manual campaign. The phone numbers may not have been saved. Please recreate the campaign with phone numbers.' 
      })
    }
    recipients = campaign.manualPhoneNumbers
    console.log(`[SMS Campaign] Using ${recipients.length} manual phone numbers for campaign ${campaign.id}:`, recipients.slice(0, 3))
  } else {
    // Filter contacts based on audience
    let targetContacts = contacts
    if (campaign.audience === 'opted-in' || campaign.audience?.toLowerCase() === 'opted-in') {
      targetContacts = contacts.filter((c) => c.optInStatus === 'opted-in')
    }

    if (targetContacts.length === 0) {
      console.error('[SMS Campaign] No contacts found:', {
        audience: campaign.audience,
        totalContacts: contacts.length,
        optedInContacts: contacts.filter((c) => c.optInStatus === 'opted-in').length,
      })
      return res.status(400).json({ 
        error: `No contacts found for this campaign. Audience: ${campaign.audience}, Total contacts: ${contacts.length}` 
      })
    }
    
    recipients = targetContacts.map((c) => c.phone)
    console.log(`[SMS Campaign] Using ${recipients.length} contacts from ${campaign.audience} audience`)
  }
  
  if (recipients.length === 0) {
    return res.status(400).json({ error: 'No recipients found for this campaign' })
  }

  let sent = 0
  let failed = 0

  try {
    // Send SMS to all recipients (in batches for production)
    const sms = africastalkingClient.SMS

    // Split into batches of 100 (Africa's Talking limit)
    const batchSize = 100
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      try {
        const options = {
          to: batch,
          message: campaign.message,
        }

        if (atSenderId) {
          options.from = atSenderId
        }

        const response = await sms.send(options)
        const messageData = response.SMSMessageData

        if (messageData && messageData.Recipients) {
          messageData.Recipients.forEach((recipient) => {
            if (recipient.statusCode === 101 && recipient.status === 'Success') {
              sent++
            } else {
              failed++
            }
          })
        } else {
          failed += batch.length
        }
      } catch (batchErr) {
        console.error('Error sending batch:', batchErr)
        failed += batch.length
      }
    }

    campaign.status = 'sent'
    campaign.sentCount = sent
    campaign.failedCount = failed
    campaign.sentAt = new Date().toISOString()

    return res.json({
      ok: true,
      sent,
      failed,
      total: targetContacts.length,
    })
  } catch (err) {
    console.error('Error sending SMS campaign:', err)
    return res.status(500).json({
      error: 'Failed to send SMS campaign',
      details: err.message,
    })
  }
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})


