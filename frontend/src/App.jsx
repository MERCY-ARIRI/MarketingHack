import { useState, useEffect } from 'react'
import './App.css'
import { templates, categories, approvalStatuses } from './templates/templates.js'

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
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsSearch, setContactsSearch] = useState('')
  const [contactsFilter, setContactsFilter] = useState('all')
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('All')
  const [templateStatusFilter, setTemplateStatusFilter] = useState('All')

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

  // Load contacts when Contacts tab is selected
  const loadContacts = async () => {
    setContactsLoading(true)
    try {
      const params = new URLSearchParams()
      if (contactsSearch) params.append('search', contactsSearch)
      if (contactsFilter !== 'all') params.append('optInStatus', contactsFilter)
      
      const res = await fetch(`/api/contacts?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setContacts(data.contacts || [])
      }
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setContactsLoading(false)
    }
  }

  // Load contacts when tab changes to contacts
  useEffect(() => {
    if (selectedTab === 'contacts') {
      loadContacts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab])

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
              <button className="primary-btn">
                Create Template
              </button>
            </header>

            <div className="two-column">
              <div className="panel">
                <h3>Filter Templates</h3>
                <div className="form" style={{ gap: '1rem' }}>
                  <label>
                    Category
                    <select
                      value={templateCategoryFilter}
                      onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(55,65,81,0.6)',
                        background: 'rgba(17,24,39,0.8)',
                        color: '#f3f4f6',
                        cursor: 'pointer',
                      }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Approval Status
                    <select
                      value={templateStatusFilter}
                      onChange={(e) => setTemplateStatusFilter(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(55,65,81,0.6)',
                        background: 'rgba(17,24,39,0.8)',
                        color: '#f3f4f6',
                        cursor: 'pointer',
                      }}
                    >
                      {approvalStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="panel">
                <h3>Template List ({templates.filter(t => 
                  (templateCategoryFilter === 'All' || t.category === templateCategoryFilter) &&
                  (templateStatusFilter === 'All' || t.approvalStatus === templateStatusFilter)
                ).length})</h3>
                {templates
                  .filter(t => 
                    (templateCategoryFilter === 'All' || t.category === templateCategoryFilter) &&
                    (templateStatusFilter === 'All' || t.approvalStatus === templateStatusFilter)
                  )
                  .length === 0 ? (
                  <p className="empty">No templates found matching the selected filters.</p>
                ) : (
                  <ul className="campaign-list">
                    {templates
                      .filter(t => 
                        (templateCategoryFilter === 'All' || t.category === templateCategoryFilter) &&
                        (templateStatusFilter === 'All' || t.approvalStatus === templateStatusFilter)
                      )
                      .map((template) => (
                        <li key={template.id} className="campaign-item">
                          <div style={{ flex: 1 }}>
                            <div className="campaign-name">{template.name}</div>
                            <div className="campaign-meta">
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                background: template.category === 'Marketing' 
                                  ? 'rgba(59, 130, 246, 0.2)' 
                                  : template.category === 'Utility'
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : 'rgba(168, 85, 247, 0.2)',
                                border: `1px solid ${
                                  template.category === 'Marketing' 
                                    ? 'rgba(59, 130, 246, 0.5)' 
                                    : template.category === 'Utility'
                                    ? 'rgba(34, 197, 94, 0.5)'
                                    : 'rgba(168, 85, 247, 0.5)'
                                }`,
                                fontSize: '0.7rem',
                              }}>
                                {template.category}
                              </span>
                              <span>• {template.language.toUpperCase()}</span>
                              {template.variables && template.variables.length > 0 && (
                                <span>• {template.variables.length} variable{template.variables.length > 1 ? 's' : ''}</span>
                              )}
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                              {template.content}
                            </div>
                            {template.rejectionReason && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#fca5a5' }}>
                                ⚠️ Rejection: {template.rejectionReason}
                              </div>
                            )}
                          </div>
                          <span className={`status status-${template.approvalStatus.toLowerCase()}`}>
                            {template.approvalStatus}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="panel" style={{ marginTop: '1rem' }}>
              <p className="helper-footnote">
                <strong>Note:</strong> WhatsApp requires templates for most business-initiated messages. 
                Templates must be approved by Meta before use. The backend should sync template status from the Cloud API.
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

            <div className="two-column">
              <div className="panel">
                <h3>Import Contacts from CSV</h3>
                <ContactImportForm onImport={loadContacts} />
                <p className="helper-footnote" style={{ marginTop: '1rem' }}>
                  CSV format: name, phone, email (optional), optInStatus (optional).
                  Phone numbers should include country code (e.g., +2348123456789).
                </p>
              </div>

              <div className="panel">
                <h3>Contact List ({contacts.length})</h3>
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactsSearch}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setContactsSearch(newValue)
                      // Debounce search - reload after user stops typing
                      clearTimeout(window.searchTimeout)
                      window.searchTimeout = setTimeout(() => {
                        // Use the latest values
                        const params = new URLSearchParams()
                        if (newValue) params.append('search', newValue)
                        if (contactsFilter !== 'all') params.append('optInStatus', contactsFilter)
                        
                        fetch(`/api/contacts?${params.toString()}`)
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.contacts) {
                              setContacts(data.contacts)
                            }
                          })
                          .catch((err) => console.error('Error loading contacts:', err))
                      }, 500)
                    }}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(55,65,81,0.6)',
                      background: 'rgba(17,24,39,0.8)',
                      color: '#f3f4f6',
                    }}
                  />
                  <select
                    value={contactsFilter}
                    onChange={(e) => {
                      setContactsFilter(e.target.value)
                      loadContacts()
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(55,65,81,0.6)',
                      background: 'rgba(17,24,39,0.8)',
                      color: '#f3f4f6',
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="opted-in">Opted In</option>
                    <option value="opted-out">Opted Out</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                {contactsLoading ? (
                  <p className="empty">Loading contacts...</p>
                ) : contacts.length === 0 ? (
                  <p className="empty">No contacts found. Import a CSV file to get started.</p>
                ) : (
                  <ContactList contacts={contacts} onUpdate={loadContacts} />
                )}
              </div>
            </div>

            <div className="panel" style={{ marginTop: '1rem' }}>
              <p className="helper-footnote">
                <strong>Important:</strong> Never send marketing messages to users without explicit consent. 
                Violating this can get your WhatsApp Business account blocked. Always track opt-in status 
                and respect opt-out requests immediately.
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
  const [to, setTo] = useState('whatsapp:+254714513047')
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
  const [to, setTo] = useState('+254714513047')
  const [body, setBody] = useState('Hi from your SME auto-marketer via Africa\'s Talking 📲')
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
        throw new Error(data.details || data.error || 'Failed to send SMS')
      }
      setStatus({
        type: 'success',
        message: `SMS sent via Africa's Talking! Message ID: ${data.messageId}, Status: ${data.status}`,
      })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="form">
      <h3>Test SMS (Africa's Talking)</h3>
      <p className="helper-footnote">
        Configure Africa's Talking credentials in backend/.env. Use sandbox mode for testing.
        Phone numbers should include country code (e.g., +2547XXXXXXXXX for Kenya).
      </p>
      <label>
        To (phone)
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="+2547XXXXXXXXX"
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
        {loading ? 'Sending SMS…' : 'Send test SMS'}
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

function ContactImportForm({ onImport }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setStatus(null)
    } else {
      setStatus({ type: 'error', message: 'Please select a CSV file' })
      setFile(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a CSV file' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const formData = new FormData()
      formData.append('csv', file)

      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import CSV')
      }

      setStatus({
        type: 'success',
        message: `Successfully imported ${data.imported} contacts (${data.created} new, ${data.updated} updated)`,
      })

      setFile(null)
      e.target.reset()

      // Reload contacts list
      if (onImport) {
        onImport()
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>
        CSV File
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
          style={{
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(55,65,81,0.6)',
            background: 'rgba(17,24,39,0.8)',
            color: '#f3f4f6',
            width: '100%',
          }}
        />
      </label>

      <button className="primary-btn" type="submit" disabled={loading || !file}>
        {loading ? 'Importing...' : 'Import CSV'}
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

function ContactList({ contacts, onUpdate }) {
  const handleOptIn = async (id) => {
    try {
      const res = await fetch(`/api/contacts/${id}/opt-in`, { method: 'PUT' })
      if (res.ok && onUpdate) {
        onUpdate()
      }
    } catch (err) {
      console.error('Error updating opt-in:', err)
    }
  }

  const handleOptOut = async (id) => {
    try {
      const res = await fetch(`/api/contacts/${id}/opt-out`, { method: 'PUT' })
      if (res.ok && onUpdate) {
        onUpdate()
      }
    } catch (err) {
      console.error('Error updating opt-out:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
      if (res.ok && onUpdate) {
        onUpdate()
      }
    } catch (err) {
      console.error('Error deleting contact:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'opted-in':
        return '#bbf7d0'
      case 'opted-out':
        return '#fecaca'
      default:
        return '#d1d5db'
    }
  }

  return (
    <ul className="campaign-list">
      {contacts.map((contact) => (
        <li key={contact.id} className="campaign-item">
          <div style={{ flex: 1 }}>
            <div className="campaign-name">{contact.name || 'Unnamed'}</div>
            <div className="campaign-meta">
              <span>{contact.phone}</span>
              {contact.email && <span>• {contact.email}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              className="status"
              style={{
                backgroundColor: getStatusColor(contact.optInStatus),
                color: '#111827',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                textTransform: 'capitalize',
              }}
            >
              {contact.optInStatus || 'unknown'}
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {contact.optInStatus !== 'opted-in' && (
                <button
                  onClick={() => handleOptIn(contact.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Mark as opted-in"
                >
                  ✓
                </button>
              )}
              {contact.optInStatus !== 'opted-out' && (
                <button
                  onClick={() => handleOptOut(contact.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title="Mark as opted-out"
                >
                  ✗
                </button>
              )}
              <button
                onClick={() => handleDelete(contact.id)}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title="Delete contact"
              >
                🗑
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default App
