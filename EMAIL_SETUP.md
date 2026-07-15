# Email Setup Guide - Password Reset Feature

## Steps to Enable Email Sending

### 1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Scroll down to "2-Step Verification"
   - Click "Enable" and follow the setup process

### 2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select:
     - **App**: Mail
     - **Device**: Windows Computer
   - Click "Generate"
   - Copy the 16-character password shown

### 3. **Add Credentials to .env File**
   - Open `.env` file in the project root
   - Update with your Gmail address and app password:
     ```
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
     ```

### 4. **Restart Backend Server**
   ```powershell
   npm run api
   ```
   
   You should see:
   ```
   ✅ Email service ready! Emails can be sent.
   ```

### 5. **Test Password Reset**
   - Navigate to `/forgot-password` in the app
   - Enter your email
   - Check your inbox for the reset link

---

## Troubleshooting

### "Email service not configured"
- Make sure 2-Factor Authentication is enabled on your Google Account
- Check that `.env` file has correct `EMAIL_USER` and `EMAIL_PASSWORD`
- Restart the backend server after updating `.env`

### "Invalid login" error
- Verify you used an App Password (not your regular Google password)
- App passwords are only available if 2-Factor Authentication is enabled
- Generate a new app password at https://myaccount.google.com/apppasswords

### Still not receiving emails?
- Check spam/junk folder
- Verify email address is entered correctly
- Check backend console for detailed error messages
- Make sure backend server is running: `npm run api`

---

## Email Features
✅ HTML formatted password reset email  
✅ Reset link with token (expires in 1 hour)  
✅ Professional branding  
✅ Error handling and logging
