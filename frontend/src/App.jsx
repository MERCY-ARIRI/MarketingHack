import { useState, useEffect, useCallback } from 'react'
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
  const [templateList, setTemplateList] = useState(templates)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    category: 'Marketing',
    content: '',
    language: 'en',
    approvalStatus: 'Pending',
    variables: []
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

  // Template handlers
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id === selectedTemplate?.id ? null : template)
    setEditingTemplate(null)
  }

  const handleTemplateEdit = (template, e) => {
    e.stopPropagation()
    setEditingTemplate(template.id)
    setTemplateFormData({
      name: template.name,
      category: template.category,
      content: template.content,
      language: template.language,
      approvalStatus: template.approvalStatus,
      variables: template.variables || []
    })
    setSelectedTemplate(template)
  }

  const handleTemplateSave = (e) => {
    e.preventDefault()
    if (!editingTemplate) return

    setTemplateList(prev => prev.map(t => 
      t.id === editingTemplate 
        ? { 
            ...t, 
            ...templateFormData,
            variables: extractVariables(templateFormData.content)
          }
        : t
    ))
    setEditingTemplate(null)
    setTemplateFormData({
      name: '',
      category: 'Marketing',
      content: '',
      language: 'en',
      approvalStatus: 'Pending',
      variables: []
    })
  }

  const handleTemplateCancel = () => {
    setEditingTemplate(null)
    setTemplateFormData({
      name: '',
      category: 'Marketing',
      content: '',
      language: 'en',
      approvalStatus: 'Pending',
      variables: []
    })
  }

  const extractVariables = (content) => {
    const matches = content.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
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
            className={selectedTab === 'content' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSelectedTab('content')}
          >
            Content Generator
          </button>
          <button
            className={selectedTab === 'ideas' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSelectedTab('ideas')}
          >
            Campaign Ideas
          </button>
          <button
            className={selectedTab === 'social' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSelectedTab('social')}
          >
            Social Scheduler
          </button>
          <button
            className={selectedTab === 'sms' ? 'nav-item active' : 'nav-item'}
            onClick={() => setSelectedTab('sms')}
          >
            Mass SMS
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

                {selectedTemplate && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(30, 64, 175, 0.3)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.5)' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Selected Template</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5f5' }}>
                      {templateList.find(t => t.id === selectedTemplate.id)?.name || 'No template selected'}
                    </p>
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Template List ({templateList.filter(t => 
                  (templateCategoryFilter === 'All' || t.category === templateCategoryFilter) &&
                  (templateStatusFilter === 'All' || t.approvalStatus === templateStatusFilter)
                ).length})</h3>
                {templateList
                  .filter(t => 
                    (templateCategoryFilter === 'All' || t.category === templateCategoryFilter) &&
                    (templateStatusFilter === 'All' || t.approvalStatus === templateStatusFilter)
                  )
                  .length === 0 ? (
                  <p className="empty">No templates found matching the selected filters.</p>
                ) : (
                  <ul className="campaign-list">
                    {templateList
                      .filter(t => 
                        (templateCategoryFilter === 'All' || t.category === templateCategoryFilter) &&
                        (templateStatusFilter === 'All' || t.approvalStatus === templateStatusFilter)
                      )
                      .map((template) => (
                        <li 
                          key={template.id} 
                          className="campaign-item"
                          onClick={() => handleTemplateSelect(template)}
                          style={{
                            cursor: 'pointer',
                            borderColor: selectedTemplate?.id === template.id 
                              ? 'rgba(59, 130, 246, 0.8)' 
                              : undefined,
                            background: selectedTemplate?.id === template.id
                              ? 'rgba(30, 64, 175, 0.3)'
                              : undefined,
                            borderWidth: selectedTemplate?.id === template.id ? '2px' : '1px',
                          }}
                        >
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
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={(e) => handleTemplateEdit(template, e)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.7rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              title="Edit template"
                            >
                              ✏️ Edit
                            </button>
                            <span className={`status status-${template.approvalStatus.toLowerCase()}`}>
                              {template.approvalStatus}
                            </span>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            {editingTemplate && selectedTemplate && (
              <div className="panel" style={{ marginTop: '1rem' }}>
                <h3>Edit Template</h3>
                <form onSubmit={handleTemplateSave} className="form">
                  <label>
                    Template Name
                    <input
                      type="text"
                      value={templateFormData.name}
                      onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Welcome New Customer"
                      required
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <label>
                      Category
                      <select
                        value={templateFormData.category}
                        onChange={(e) => setTemplateFormData(prev => ({ ...prev, category: e.target.value }))}
                        style={{
                          padding: '0.45rem 0.6rem',
                          borderRadius: '0.65rem',
                          border: '1px solid rgba(55, 65, 81, 0.8)',
                          background: 'rgba(15, 23, 42, 0.9)',
                          color: '#e5e7eb',
                          cursor: 'pointer',
                        }}
                      >
                        {categories.filter(c => c !== 'All').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Approval Status
                      <select
                        value={templateFormData.approvalStatus}
                        onChange={(e) => setTemplateFormData(prev => ({ ...prev, approvalStatus: e.target.value }))}
                        style={{
                          padding: '0.45rem 0.6rem',
                          borderRadius: '0.65rem',
                          border: '1px solid rgba(55, 65, 81, 0.8)',
                          background: 'rgba(15, 23, 42, 0.9)',
                          color: '#e5e7eb',
                          cursor: 'pointer',
                        }}
                      >
                        {approvalStatuses.filter(s => s !== 'All').map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label>
                    Template Content
                    <textarea
                      rows="6"
                      value={templateFormData.content}
                      onChange={(e) => {
                        const newContent = e.target.value
                        setTemplateFormData(prev => ({
                          ...prev,
                          content: newContent,
                          variables: extractVariables(newContent)
                        }))
                      }}
                      placeholder="Enter template content. Use {{variable_name}} for variables."
                      required
                    />
                    <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      Detected variables: {templateFormData.variables.length > 0 
                        ? templateFormData.variables.map(v => `{{${v}}}`).join(', ')
                        : 'None'}
                    </p>
                  </label>

                  <label>
                    Language
                    <select
                      value={templateFormData.language}
                      onChange={(e) => setTemplateFormData(prev => ({ ...prev, language: e.target.value }))}
                      style={{
                        padding: '0.45rem 0.6rem',
                        borderRadius: '0.65rem',
                        border: '1px solid rgba(55, 65, 81, 0.8)',
                        background: 'rgba(15, 23, 42, 0.9)',
                        color: '#e5e7eb',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="fr">French (fr)</option>
                      <option value="de">German (de)</option>
                      <option value="pt">Portuguese (pt)</option>
                    </select>
                  </label>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="primary-btn">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleTemplateCancel}
                      style={{
                        padding: '0.55rem 1.3rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(148, 163, 184, 0.6)',
                        background: 'rgba(30, 64, 175, 0.25)',
                        color: '#e5e7eb',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

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

        {selectedTab === 'content' && (
          <section>
            <header className="section-header">
              <div>
                <h2>Content Generator</h2>
                <p>Generate marketing posters, captions, and creative content using AI.</p>
              </div>
            </header>
            <ContentGenerator />
          </section>
        )}

        {selectedTab === 'ideas' && (
          <section>
            <header className="section-header">
              <div>
                <h2>Campaign Ideas</h2>
                <p>Get AI-powered suggestions for your next marketing campaign.</p>
              </div>
            </header>
            <CampaignIdeas />
          </section>
        )}

        {selectedTab === 'social' && (
          <section>
            <header className="section-header">
              <div>
                <h2>Social Media Scheduler</h2>
                <p>Schedule posts across Instagram, Facebook, and TikTok.</p>
              </div>
              <button
                className="primary-btn"
                onClick={() => {
                  const form = document.getElementById('social-form')
                  if (form) form.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                New Post
              </button>
            </header>
            <SocialScheduler />
          </section>
        )}

        {selectedTab === 'sms' && (
          <section>
            <header className="section-header">
              <div>
                <h2>Mass SMS Campaigns</h2>
                <p>Send bulk SMS messages to your contact list.</p>
              </div>
              <button
                className="primary-btn"
                onClick={() => {
                  const form = document.getElementById('sms-form')
                  if (form) form.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                New Campaign
              </button>
            </header>
            <MassSmsCampaigns />
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

function ContentGenerator() {
  const [contentType, setContentType] = useState('caption')
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('professional')
  const [generatedContent, setGeneratedContent] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setGeneratedContent(null)

    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, prompt, tone }),
      })
      
      // Check if response is JSON
      const responseContentType = res.headers.get('content-type')
      if (!responseContentType || !responseContentType.includes('application/json')) {
        await res.text() // Consume the response to avoid memory leaks
        throw new Error(`Backend returned HTML instead of JSON. Is the backend server running on port 4000?`)
      }
      
      const data = await res.json()
      if (res.ok) {
        setGeneratedContent(data)
      } else {
        throw new Error(data.error || 'Failed to generate content')
      }
    } catch (err) {
      setGeneratedContent({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="two-column">
      <div className="panel">
        <h3>Generate Content</h3>
        <form onSubmit={handleGenerate} className="form">
          <label>
            Content Type
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(55,65,81,0.6)',
                background: 'rgba(17,24,39,0.8)',
                color: '#f3f4f6',
                cursor: 'pointer',
              }}
            >
              <option value="caption">Social Media Caption</option>
              <option value="poster">Poster Text</option>
              <option value="ad">Advertisement Copy</option>
              <option value="email">Email Subject Line</option>
            </select>
          </label>

          <label>
            Tone
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(55,65,81,0.6)',
                background: 'rgba(17,24,39,0.8)',
                color: '#f3f4f6',
                cursor: 'pointer',
              }}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
              <option value="humorous">Humorous</option>
            </select>
          </label>

          <label>
            What do you want to promote?
            <textarea
              rows="4"
              placeholder="e.g. A new product launch, a special discount, an event..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Content'}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Generated Content</h3>
        {loading ? (
          <p className="empty">Generating your content...</p>
        ) : generatedContent?.error ? (
          <p className="empty" style={{ color: '#fecaca' }}>
            Error: {generatedContent.error}
          </p>
        ) : generatedContent ? (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Your {contentType}:</h4>
              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(55,65,81,0.6)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                }}
              >
                {generatedContent.content}
              </div>
            </div>
            {generatedContent.variations && generatedContent.variations.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Variations:</h4>
                {generatedContent.variations.map((variation, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      background: 'rgba(15, 23, 42, 0.4)',
                      borderRadius: '6px',
                      border: '1px solid rgba(55,65,81,0.4)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {variation}
                  </div>
                ))}
              </div>
            )}
            <button
              className="primary-btn"
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={() => {
                navigator.clipboard.writeText(generatedContent.content)
                alert('Copied to clipboard!')
              }}
            >
              Copy to Clipboard
            </button>
          </div>
        ) : (
          <p className="empty">Fill out the form and click "Generate Content" to get started.</p>
        )}
      </div>
    </div>
  )
}

function CampaignIdeas() {
  const [businessType, setBusinessType] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [budget, setBudget] = useState('low')
  const [ideas, setIdeas] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGetIdeas = async (e) => {
    e.preventDefault()
    if (!businessType.trim()) return

    setLoading(true)
    setIdeas(null)

    try {
      const res = await fetch('/api/campaign-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType, targetAudience, budget }),
      })
      
      // Check if response is JSON
      const responseContentType = res.headers.get('content-type')
      if (!responseContentType || !responseContentType.includes('application/json')) {
        await res.text() // Consume the response to avoid memory leaks
        throw new Error(`Backend returned HTML instead of JSON. Is the backend server running on port 4000?`)
      }
      
      const data = await res.json()
      if (res.ok) {
        setIdeas(data)
      } else {
        throw new Error(data.error || 'Failed to get campaign ideas')
      }
    } catch (err) {
      setIdeas({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="two-column">
      <div className="panel">
        <h3>Get Campaign Ideas</h3>
        <form onSubmit={handleGetIdeas} className="form">
          <label>
            Business Type
            <input
              type="text"
              placeholder="e.g. Restaurant, E-commerce, Fitness Center..."
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              required
            />
          </label>

          <label>
            Target Audience (optional)
            <input
              type="text"
              placeholder="e.g. Young professionals, Parents, Students..."
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </label>

          <label>
            Budget Level
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(55,65,81,0.6)',
                background: 'rgba(17,24,39,0.8)',
                color: '#f3f4f6',
                cursor: 'pointer',
              }}
            >
              <option value="low">Low Budget</option>
              <option value="medium">Medium Budget</option>
              <option value="high">High Budget</option>
            </select>
          </label>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Generating Ideas...' : 'Get Campaign Ideas'}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>Suggested Campaigns</h3>
        {loading ? (
          <p className="empty">Generating campaign ideas...</p>
        ) : ideas?.error ? (
          <p className="empty" style={{ color: '#fecaca' }}>
            Error: {ideas.error}
          </p>
        ) : ideas?.campaigns ? (
          <ul className="campaign-list">
            {ideas.campaigns.map((campaign, idx) => (
              <li key={idx} className="campaign-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ width: '100%' }}>
                  <div className="campaign-name">{campaign.title}</div>
                  <div className="campaign-meta">
                    <span>Budget: {campaign.budget}</span>
                    <span>• Duration: {campaign.duration}</span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#cbd5f5' }}>
                    {campaign.description}
                  </div>
                  {campaign.tactics && campaign.tactics.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Tactics:</strong>
                      <ul style={{ marginTop: '0.25rem', paddingLeft: '1.25rem', fontSize: '0.75rem' }}>
                        {campaign.tactics.map((tactic, tIdx) => (
                          <li key={tIdx} style={{ marginBottom: '0.2rem' }}>
                            {tactic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Fill out the form to get AI-powered campaign suggestions.</p>
        )}
      </div>
    </div>
  )
}

function SocialScheduler() {
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [newPost, setNewPost] = useState({
    content: '',
    platforms: [],
    scheduledTime: '',
    imageUrl: '',
  })

  const handleSchedule = async (e) => {
    e.preventDefault()
    if (!newPost.content || newPost.platforms.length === 0 || !newPost.scheduledTime) return

    try {
      const res = await fetch('/api/schedule-social-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      })
      
      // Check if response is JSON
      const responseContentType = res.headers.get('content-type')
      if (!responseContentType || !responseContentType.includes('application/json')) {
        await res.text() // Consume the response to avoid memory leaks
        throw new Error(`Backend returned HTML instead of JSON. Is the backend server running on port 4000?`)
      }
      
      const data = await res.json()
      if (res.ok) {
        setScheduledPosts((prev) => [data.post, ...prev])
        setNewPost({ content: '', platforms: [], scheduledTime: '', imageUrl: '' })
      } else {
        alert(data.error || 'Failed to schedule post')
      }
    } catch (err) {
      alert('Error scheduling post: ' + err.message)
    }
  }

  useEffect(() => {
    const loadScheduledPosts = async () => {
      try {
        const res = await fetch('/api/scheduled-posts')
        
        // Check if response is JSON
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Backend returned HTML instead of JSON. Is the backend server running?')
          return
        }
        
        const data = await res.json()
        if (res.ok) {
          setScheduledPosts(data.posts || [])
        }
      } catch (err) {
        console.error('Error loading scheduled posts:', err)
      }
    }
    loadScheduledPosts()
  }, [])

  return (
    <div className="two-column">
      <div className="panel">
        <h3>Scheduled Posts ({scheduledPosts.length})</h3>
        {scheduledPosts.length === 0 ? (
          <p className="empty">No scheduled posts yet. Create one on the right.</p>
        ) : (
          <ul className="campaign-list">
            {scheduledPosts.map((post) => (
              <li key={post.id} className="campaign-item">
                <div style={{ flex: 1 }}>
                  <div className="campaign-name">{post.content.substring(0, 50)}...</div>
                  <div className="campaign-meta">
                    <span>{post.platforms.join(', ')}</span>
                    <span>• {new Date(post.scheduledTime).toLocaleString()}</span>
                  </div>
                </div>
                <span className={`status status-${post.status?.toLowerCase() || 'scheduled'}`}>
                  {post.status || 'Scheduled'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel" id="social-form">
        <h3>Schedule New Post</h3>
        <form onSubmit={handleSchedule} className="form">
          <label>
            Content
            <textarea
              rows="4"
              placeholder="Write your post content..."
              value={newPost.content}
              onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
              required
            />
          </label>

          <label>
            Platforms
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {['Instagram', 'Facebook', 'TikTok'].map((platform) => (
                <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newPost.platforms.includes(platform)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewPost((prev) => ({ ...prev, platforms: [...prev.platforms, platform] }))
                      } else {
                        setNewPost((prev) => ({ ...prev, platforms: prev.platforms.filter((p) => p !== platform) }))
                      }
                    }}
                  />
                  <span>{platform}</span>
                </label>
              ))}
            </div>
          </label>

          <label>
            Scheduled Time
            <input
              type="datetime-local"
              value={newPost.scheduledTime}
              onChange={(e) => setNewPost((prev) => ({ ...prev, scheduledTime: e.target.value }))}
              required
            />
          </label>

          <label>
            Image URL (optional)
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={newPost.imageUrl}
              onChange={(e) => setNewPost((prev) => ({ ...prev, imageUrl: e.target.value }))}
            />
          </label>

          <button type="submit" className="primary-btn">
            Schedule Post
          </button>
          <p className="helper-footnote">
            Note: This is a mock implementation. Real scheduling requires API integrations with Instagram, Facebook, and TikTok.
          </p>
        </form>
      </div>
    </div>
  )
}

function MassSmsCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    audience: 'all',
    scheduledTime: '',
    manualPhoneNumbers: '',
  })
  const [loading, setLoading] = useState(false)

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/sms-campaigns')
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Backend returned HTML instead of JSON. Is the backend server running?')
        return
      }
      
      const data = await res.json()
      if (res.ok) {
        setCampaigns(data.campaigns || [])
      }
    } catch (err) {
      console.error('Error loading SMS campaigns:', err)
    }
  }, [])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    if (!newCampaign.name || !newCampaign.message) return
    
    // Validate manual phone numbers if audience is manual
    if (newCampaign.audience === 'manual') {
      if (!newCampaign.manualPhoneNumbers || !newCampaign.manualPhoneNumbers.trim()) {
        alert('Please enter at least one phone number')
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/sms-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      })
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(`Backend returned HTML instead of JSON. Is the backend server running on port 4000? Response: ${text.substring(0, 200)}`)
      }
      
      const data = await res.json()
      if (res.ok) {
        console.log('[Frontend] Campaign created successfully:', data.campaign)
        if (data.campaign.audience === 'manual') {
          console.log('[Frontend] Manual campaign with', data.campaign.manualPhoneCount || data.campaign.totalCount, 'phone numbers')
        }
        setCampaigns((prev) => [data.campaign, ...prev])
        setNewCampaign({ name: '', message: '', audience: 'all', scheduledTime: '', manualPhoneNumbers: '' })
        alert(`Campaign "${data.campaign.name}" created successfully! ${data.campaign.audience === 'manual' ? `${data.campaign.manualPhoneCount || data.campaign.totalCount} phone number(s) added.` : `${data.campaign.totalCount} contact(s) selected.`}`)
      } else {
        alert(data.error || 'Failed to create campaign')
      }
    } catch (err) {
      alert('Error creating campaign: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendNow = async (campaignId) => {
    if (!confirm('Are you sure you want to send this campaign now? This will send SMS to all selected contacts.')) {
      return
    }

    try {
      const res = await fetch(`/api/sms-campaigns/${campaignId}/send`, {
        method: 'POST',
      })
      
      // Check if response is JSON
      const responseContentType = res.headers.get('content-type')
      if (!responseContentType || !responseContentType.includes('application/json')) {
        await res.text() // Consume the response to avoid memory leaks
        throw new Error(`Backend returned HTML instead of JSON. Is the backend server running on port 4000?`)
      }
      
      const data = await res.json()
      if (res.ok) {
        alert(`Campaign sent! ${data.sent} messages sent, ${data.failed} failed.`)
        loadCampaigns()
      } else {
        alert(data.error || 'Failed to send campaign')
      }
    } catch (err) {
      alert('Error sending campaign: ' + err.message)
    }
  }

  return (
    <div className="two-column">
      <div className="panel">
        <h3>SMS Campaigns ({campaigns.length})</h3>
        {campaigns.length === 0 ? (
          <p className="empty">No SMS campaigns yet. Create one on the right.</p>
        ) : (
          <ul className="campaign-list">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="campaign-item">
                <div style={{ flex: 1 }}>
                  <div className="campaign-name">{campaign.name}</div>
                  <div className="campaign-meta">
                    <span>Audience: {campaign.audience === 'manual' ? 'Manual Numbers' : campaign.audience === 'opted-in' ? 'Opted In Only' : 'All Contacts'}</span>
                    {campaign.audience === 'manual' && (
                      <span>• {campaign.manualPhoneCount || campaign.totalCount || 0} number(s)</span>
                    )}
                    {campaign.scheduledTime && (
                      <span>• Scheduled: {new Date(campaign.scheduledTime).toLocaleString()}</span>
                    )}
                    {campaign.sentCount !== undefined && (
                      <span>• Sent: {campaign.sentCount}/{campaign.totalCount}</span>
                    )}
                    {campaign.totalCount !== undefined && campaign.audience !== 'manual' && (
                      <span>• {campaign.totalCount} contact(s)</span>
                    )}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    {campaign.message.substring(0, 100)}...
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`status status-${campaign.status?.toLowerCase() || 'draft'}`}>
                    {campaign.status || 'Draft'}
                  </span>
                  {campaign.status !== 'sent' && (
                    <button
                      onClick={() => handleSendNow(campaign.id)}
                      className="primary-btn"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Send Now
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel" id="sms-form">
        <h3>Create SMS Campaign</h3>
        <form onSubmit={handleCreateCampaign} className="form">
          <label>
            Campaign Name
            <input
              type="text"
              placeholder="e.g. Black Friday Sale"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>

          <label>
            Message
            <textarea
              rows="4"
              placeholder="Your SMS message (160 characters recommended for single SMS)..."
              value={newCampaign.message}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, message: e.target.value }))}
              required
            />
            <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              {newCampaign.message.length} characters
            </span>
          </label>

          <label>
            Audience
            <select
              value={newCampaign.audience}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, audience: e.target.value }))}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(55,65,81,0.6)',
                background: 'rgba(17,24,39,0.8)',
                color: '#f3f4f6',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Contacts</option>
              <option value="opted-in">Opted In Only</option>
              <option value="manual">Manual Phone Numbers</option>
            </select>
          </label>

          {newCampaign.audience === 'manual' && (
            <label>
              Phone Numbers
              <textarea
                rows="6"
                placeholder="Enter phone numbers (one per line or comma-separated)&#10;Example:&#10;+254712345678&#10;+254798765432&#10;+2348123456789"
                value={newCampaign.manualPhoneNumbers}
                onChange={(e) => setNewCampaign((prev) => ({ ...prev, manualPhoneNumbers: e.target.value }))}
                required={newCampaign.audience === 'manual'}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem', display: 'block' }}>
                {newCampaign.manualPhoneNumbers
                  ? `${newCampaign.manualPhoneNumbers
                      .split(/[,\n]/)
                      .filter((n) => n.trim())
                      .length} phone number(s) detected - ready to create campaign`
                  : 'Enter phone numbers with country code (e.g., +254712345678)'}
              </span>
              {newCampaign.manualPhoneNumbers && (
                <div style={{ fontSize: '0.7rem', color: '#60a5fa', marginTop: '0.25rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px' }}>
                  <strong>Format:</strong> Enter numbers one per line or separated by commas. Examples:
                  <br />• +254712345678
                  <br />• +254798765432, +2348123456789
                  <br />• 0712345678 (will be converted to +254712345678)
                </div>
              )}
            </label>
          )}

          <label>
            Schedule (optional - leave empty to send immediately)
            <input
              type="datetime-local"
              value={newCampaign.scheduledTime}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, scheduledTime: e.target.value }))}
            />
          </label>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
          <p className="helper-footnote">
            <strong>Important:</strong> Only send SMS to contacts who have opted in. Respect opt-out requests immediately.
          </p>
        </form>
      </div>
    </div>
  )
}

export default App
