// Predefined WhatsApp message templates
export const templates = [
  // Marketing Templates
  {
    id: 1,
    name: 'Welcome New Customer',
    category: 'Marketing',
    content: 'Hi {{name}}, welcome to {{business_name}}! We\'re excited to have you. Use code WELCOME10 for 10% off your first order.',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-15',
    variables: ['name', 'business_name']
  },
  {
    id: 2,
    name: 'Special Promotion',
    category: 'Marketing',
    content: 'Hey {{name}}! 🎉 Special deal just for you: {{promo_description}}. Valid until {{expiry_date}}. Shop now!',
    approvalStatus: 'Pending',
    language: 'en',
    createdAt: '2024-01-20',
    variables: ['name', 'promo_description', 'expiry_date']
  },
  {
    id: 3,
    name: 'Product Launch',
    category: 'Marketing',
    content: 'Hello {{name}}, we\'re thrilled to announce our new {{product_name}}! Be among the first to try it. Pre-order now at {{link}}.',
    approvalStatus: 'Rejected',
    language: 'en',
    createdAt: '2024-01-18',
    variables: ['name', 'product_name', 'link'],
    rejectionReason: 'Template contains promotional content without proper opt-in verification'
  },
  {
    id: 4,
    name: 'Customer Feedback Request',
    category: 'Marketing',
    content: 'Hi {{name}}, thank you for your recent purchase! We\'d love to hear your feedback. Please rate us: {{rating_link}}',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-12',
    variables: ['name', 'rating_link']
  },
  
  // Utility Templates
  {
    id: 5,
    name: 'Order Confirmation',
    category: 'Utility',
    content: 'Your order #{{order_id}} has been confirmed. Expected delivery: {{delivery_date}}. Track your order: {{tracking_link}}',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-10',
    variables: ['order_id', 'delivery_date', 'tracking_link']
  },
  {
    id: 6,
    name: 'Shipping Update',
    category: 'Utility',
    content: 'Hi {{name}}, your order #{{order_id}} is on its way! Estimated delivery: {{delivery_date}}. Track: {{tracking_number}}',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-08',
    variables: ['name', 'order_id', 'delivery_date', 'tracking_number']
  },
  {
    id: 7,
    name: 'Appointment Reminder',
    category: 'Utility',
    content: 'Reminder: You have an appointment on {{date}} at {{time}}. Please confirm your attendance by replying YES or NO.',
    approvalStatus: 'Pending',
    language: 'en',
    createdAt: '2024-01-22',
    variables: ['date', 'time']
  },
  {
    id: 8,
    name: 'Payment Received',
    category: 'Utility',
    content: 'Payment of {{amount}} for order #{{order_id}} has been received. Thank you!',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-05',
    variables: ['amount', 'order_id']
  },
  {
    id: 9,
    name: 'Account Balance Update',
    category: 'Utility',
    content: 'Your account balance for {{account_name}} has been updated. Current balance: {{balance}}. Transaction: {{transaction_type}}',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-03',
    variables: ['account_name', 'balance', 'transaction_type']
  },
  
  // Authentication Templates
  {
    id: 10,
    name: 'OTP Verification',
    category: 'Authentication',
    content: 'Your verification code is {{otp_code}}. This code will expire in {{expiry_minutes}} minutes. Do not share this code with anyone.',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-01',
    variables: ['otp_code', 'expiry_minutes']
  },
  {
    id: 11,
    name: 'Password Reset',
    category: 'Authentication',
    content: 'You requested a password reset. Click here to reset: {{reset_link}}. This link expires in {{expiry_hours}} hours.',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-02',
    variables: ['reset_link', 'expiry_hours']
  },
  {
    id: 12,
    name: 'Login Alert',
    category: 'Authentication',
    content: 'New login detected on {{device}} from {{location}} at {{time}}. If this wasn\'t you, please secure your account immediately.',
    approvalStatus: 'Pending',
    language: 'en',
    createdAt: '2024-01-25',
    variables: ['device', 'location', 'time']
  },
  {
    id: 13,
    name: 'Account Verification',
    category: 'Authentication',
    content: 'Please verify your account by clicking this link: {{verification_link}}. Verification expires in {{expiry_hours}} hours.',
    approvalStatus: 'Approved',
    language: 'en',
    createdAt: '2024-01-04',
    variables: ['verification_link', 'expiry_hours']
  }
]

// Template categories
export const categories = ['All', 'Marketing', 'Utility', 'Authentication']

// Approval statuses
export const approvalStatuses = ['All', 'Approved', 'Pending', 'Rejected']

