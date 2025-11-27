# CSV Contact Import Guide

## CSV Format

Your CSV file should have the following columns:

- **name** (required): Contact's full name
- **phone** (required): Phone number with country code (e.g., `+2348123456789`)
- **email** (optional): Email address
- **optInStatus** (optional): One of `opted-in`, `opted-out`, or `unknown`

### Example CSV

```csv
name,phone,email,optInStatus
John Doe,+2348123456789,john.doe@example.com,opted-in
Jane Smith,+2348123456790,jane.smith@example.com,opted-in
Bob Johnson,+2348123456791,bob.johnson@example.com,unknown
Alice Williams,+2348123456792,alice.williams@example.com,opted-out
```

## How to Import

1. Go to the **Contacts** tab in the application
2. Click **Choose File** and select your CSV file
3. Click **Import CSV**
4. The system will:
   - Parse your CSV file
   - Validate phone numbers (adds `+` prefix if missing)
   - Check for duplicates (updates existing contacts)
   - Store contacts with opt-in status

## Features

- **Automatic phone normalization**: Phone numbers are normalized to include country code prefix
- **Duplicate detection**: If a contact with the same phone number exists, it will be updated instead of creating a duplicate
- **Search**: Search contacts by name, phone, or email
- **Filter**: Filter contacts by opt-in status (opted-in, opted-out, unknown, or all)
- **Status management**: Click ✓ to mark as opted-in, ✗ to mark as opted-out
- **Delete**: Remove contacts you no longer need

## Important Notes

- Phone numbers should include country code (e.g., `+234` for Nigeria, `+1` for US)
- Always respect opt-in/opt-out status - never send messages to users who have opted out
- Contacts are stored in `backend/data/contacts.json` for persistence
- The sample CSV file (`sample-contacts.csv`) is provided for testing

