import { useState } from 'react'
import './App.css'

function App() {
  const [selectedTab, setSelectedTab] = useState('campaigns')
  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      name: 'Welcome New Customers',
      status: 'Scheduled',
      audience: 'New leads (last 7 days)',
      sendTime: 'Tomorrow 10:00',
    },
  ])
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    template: '',
    audience: '',
    sendTime: '',
  })

  const handleCreateCampaign = (e) => {
    e.preventDefault()
    if (!newCampaign.name || !newCampaign.template) return

    setCampaigns((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newCampaign,
        status: 'Draft',
      },
    ])
    setNewCampaign({
      name: '',
      template: '',
      audience: '',
      sendTime: '',
    })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-pill">WA</span>
          <div>
            <h1>SME Auto Marketer</h1>
            <p>Simple WhatsApp campaigns for small businesses</p>
          </div>
        </div>

        <nav className="nav">
          <button
            className={selectedTab === 'campaigns' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSelectedTab('campaigns')}
          >
            Campaigns
          </button>
          <button
            className={selectedTab === 'templates' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSelectedTab('templates')}
          >
            Templates
          </button>
          <button
            className={selectedTab === 'contacts' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSelectedTab('contacts')}
          >
            Contacts
          </button>
          <button
            className={selectedTab === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSelectedTab('settings')}
          >
            Settings
          </button>
        </nav>

        <div className="helper-card">
          <h2>How this will work</h2>
          <ul>
            <li>Connect your WhatsApp Business account (via Meta Cloud API).</li>
            <li>Create approved message templates.</li>
            <li>Upload or sync your SME contact list.</li>
            <li>Schedule broadcasts and automation journeys.</li>
          </ul>
          <p className="helper-footnote">
            This demo only mocks the flow. Real sending requires WhatsApp Business
            approval and a backend service.
          </p>
        </div>
      </aside>

      <main className="main">
        {selectedTab === 'campaigns' && (
          <section>
            <header className="section-header">
              <div>
                <h2>Campaigns</h2>
                <p>Plan one-to-many WhatsApp broadcasts and automation flows.</p>
              </div>
              <button
                className="primary-btn"
                onClick={() => {
                  const form = document.getElementById('campaign-form')
                  if (form) form.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                New campaign
              </button>
            </header>

            <div className="two-column">
              <div className="panel">
                <h3>Upcoming & recent campaigns</h3>
                {campaigns.length === 0 ? (
                  <p className="empty">No campaigns yet. Start by creating one on the right.</p>
                ) : (
                  <ul className="campaign-list">
                    {campaigns.map((c) => (
                      <li key={c.id} className="campaign-item">
                        <div>
                          <div className="campaign-name">{c.name}</div>
                          <div className="campaign-meta">
                            <span>{c.audience || 'No audience set'}</span>
                            {c.sendTime && <span>• {c.sendTime}</span>}
                          </div>
                        </div>
                        <span className={`status status-${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="panel" id="campaign-form">
                <h3>Create a campaign (mock)</h3>
                <form onSubmit={handleCreateCampaign} className="form">
                  <label>
                    Name
                    <input
                      type="text"
                      placeholder="e.g. Black Friday promo"
                      value={newCampaign.name}
                      onChange={(e) =>
                        setNewCampaign((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </label>

                  <label>
                    WhatsApp message template
                    <textarea
                      rows="4"
                      placeholder="Hi {{name}}, we’re running a promo just for you..."
                      value={newCampaign.template}
                      onChange={(e) =>
                        setNewCampaign((prev) => ({ ...prev, template: e.target.value }))
                      }
                    />
                  </label>

                  <label>
                    Audience segment
                    <input
                      type="text"
                      placeholder="All customers / New leads / VIP list..."
                      value={newCampaign.audience}
                      onChange={(e) =>
                        setNewCampaign((prev) => ({ ...prev, audience: e.target.value }))
                      }
                    />
                  </label>

                  <label>
                    Schedule (optional)
                    <input
                      type="text"
                      placeholder="e.g. 2025-11-30 10:00"
                      value={newCampaign.sendTime}
                      onChange={(e) =>
                        setNewCampaign((prev) => ({ ...prev, sendTime: e.target.value }))
                      }
                    />
                  </label>

                  <button type="submit" className="primary-btn">
                    Save mock campaign
                  </button>
                  <p className="helper-footnote">
                    In a real app, this would call your backend, which would talk to the
                    WhatsApp Cloud API and queue messages.
                  </p>
                </form>
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'templates' && (
          <section>
            <header className="section-header">
              <div>
                <h2>Templates</h2>
                <p>
                  Define and manage the WhatsApp message templates that will be submitted
                  for approval in Meta Business Manager.
                </p>
              </div>
            </header>
            <div className="panel">
              <p>
                Here you’ll list templates, categories (e.g. Marketing, Utility,
                Authentication), and their approval status.
              </p>
              <p className="helper-footnote">
                WhatsApp requires templates for most business-initiated messages. The
                backend should sync template status from the Cloud API.
              </p>
            </div>
          </section>
        )}

        {selectedTab === 'contacts' && (
          <section>
            <header className="section-header">
              <div>
                <h2>Contacts</h2>
                <p>Manage SME customers and segments with opt-in tracking.</p>
              </div>
            </header>
            <div className="panel">
              <p>
                You’ll typically import contacts from a CSV or your CRM, store phone
                numbers with country codes, and track opt-in / opt-out status.
              </p>
              <p className="helper-footnote">
                Never send marketing messages to users without explicit consent. Violating
                this can get your WhatsApp Business account blocked.
              </p>
            </div>
          </section>
        )}

        {selectedTab === 'settings' && (
          <section>
            <header className="section-header">
              <div>
                <h2>Settings & API</h2>
                <p>Test mock WhatsApp and SMS sends (no real messages yet).</p>
              </div>
            </header>
            <div className="panel">
              <TestTwilioForm />
              <hr style={{ borderColor: 'rgba(55,65,81,0.6)', margin: '1rem 0' }} />
              <TestSmsForm />
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function TestTwilioForm() {
  const [to, setTo] = useState('whatsapp:+2348XXXXXXXXX')
  const [body, setBody] = useState('Hi from your SME auto-marketer prototype 👋')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, body }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to send WhatsApp')
      }
      setStatus({
        type: 'success',
        message: `Sent via Twilio! SID: ${data.sid}`,
      })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="form">
      <p className="helper-footnote">
        Configure Twilio sandbox in your Twilio Console. Use the sandbox WhatsApp number
        as the sender and your personal WhatsApp as the recipient.
      </p>

      <label>
        To (WhatsApp)
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="whatsapp:+2348XXXXXXXXX"
        />
      </label>

      <label>
        Message
        <textarea
          rows="3"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <button className="primary-btn" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Send test WhatsApp'}
      </button>

      {status && (
        <p
          className="helper-footnote"
          style={{ color: status.type === 'success' ? '#bbf7d0' : '#fecaca' }}
        >
          {status.message}
        </p>
      )}
    </form>
  )
}

function TestSmsForm() {
  const [to, setTo] = useState('+2348XXXXXXXXX')
  const [body, setBody] = useState('Hi from your SME auto-marketer (SMS mock) 📲')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)

    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, body }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send SMS')
      }
      setStatus({
        type: 'success',
        message: `Mock SMS would be sent to ${to}`,
      })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="form">
      <h3>Test SMS (mock)</h3>
      <label>
        To (phone)
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="+2348XXXXXXXXX"
        />
      </label>

      <label>
        Message
        <textarea
          rows="3"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <button className="primary-btn" type="submit" disabled={loading}>
        {loading ? 'Sending SMS…' : 'Send test SMS (mock)'}
      </button>

      {status && (
        <p
          className="helper-footnote"
          style={{ color: status.type === 'success' ? '#bbf7d0' : '#fecaca' }}
        >
          {status.message}
        </p>
      )}
    </form>
  )
}

export default App
