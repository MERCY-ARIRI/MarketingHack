# SMS Troubleshooting Guide

## It's NOT a Mock - This is Real Africa's Talking Integration

The SMS endpoint is fully integrated with Africa's Talking API. If you're not receiving messages, here are the most common issues:

## 1. Check Your Backend Console Logs

When you send an SMS, check your backend terminal for:
- `[Africa's Talking] Client initialized successfully` - confirms credentials are loaded
- `[Africa's Talking] Sending SMS:` - shows the request being sent
- `[Africa's Talking] Full response:` - shows the API response

## 2. Verify Your Credentials

Make sure in `backend/.env`:
```env
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_SENDER_ID=your_sender_id
```

**Important:** 
- If using **sandbox mode** (username: `sandbox`), SMS messages are **NOT delivered to real phones** - they're only for API testing
- For **real SMS delivery**, you need a **live/production account** with Africa's Talking

## 3. Check Your Account Status

- **Account Balance**: Make sure you have credits in your Africa's Talking account
- **Account Status**: Verify your account is active and approved
- **Sender ID Approval**: If using a custom Sender ID, it must be approved by Africa's Talking

## 4. Verify Phone Number Format

Phone numbers must be in international format:
- ✅ Correct: `+254712345678` (Kenya)
- ✅ Correct: `+2348123456789` (Nigeria)
- ❌ Wrong: `0712345678` (missing country code)
- ❌ Wrong: `254712345678` (missing + sign)

## 5. Check the API Response

After sending, check the response in:
- **Frontend**: The success/error message shows status details
- **Backend Console**: Full API response is logged

Look for:
- `statusCode: 101` = Success
- `status: "Success"` = Message accepted
- Other status codes indicate issues (check Africa's Talking documentation)

## 6. Test Steps

1. **Restart your backend server** to ensure credentials are loaded:
   ```bash
   cd backend
   npm run dev
   ```

2. **Check initialization message** - You should see:
   ```
   [Africa's Talking] Client initialized successfully
   ```

3. **Send a test SMS** from the Settings tab

4. **Check backend console** for detailed logs

5. **Check the response** in the frontend - it will show the status code and message

## 7. Common Issues

### Issue: "Credentials not configured"
**Solution**: Make sure your `.env` file is in the `backend/` directory and has the correct variable names

### Issue: Status code is not 101
**Solution**: Check the error message in the response. Common causes:
- Invalid phone number format
- Insufficient account balance
- Sender ID not approved
- Account not activated

### Issue: Using Sandbox Mode
**Solution**: Sandbox mode (`username: sandbox`) does NOT send real SMS. You need a production account.

## 8. Get Help

If still not working:
1. Check Africa's Talking dashboard for account status
2. Review the full API response in backend console
3. Contact Africa's Talking support with your account details

