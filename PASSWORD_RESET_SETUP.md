# Password Reset System - Complete Setup Guide

## ✅ What Has Been Implemented

### 1. **Frontend - Forgot Password Page** (`/forgot-password`)
   - Email input field with validation
   - Beautiful UI matching login page theme
   - Submitted  to backend API
   - Test mode detection and display

### 2. **Frontend - Test Mode Support**
   When Gmail isn't configured, users see:
   - ✅ Success confirmation
   - 🔗 Password reset link (displayed on page)
   - 📋 Copy button (copy link to clipboard)
   - 🔗 Direct link button (click to navigate to reset page)

### 3. **Backend - Password Reset Endpoint** (`POST /forgot-password`)
   - Accepts email address
   - Generates secure reset token
   - Creates reset link: `http://localhost:4200/reset-password?token=XXX&email=XXX`
   - Test Mode: Logs link to console and returns in response
   - Production Mode: Sends email via Gmail (when configured)

### 4. **Backend - Dual Mode Support**
   - **TEST MODE**: Currently active - logs reset links to console, displays on frontend
   - **PRODUCTION MODE**: Set EMAIL_USER and EMAIL_PASSWORD in `.env` for real Gmail emails

---

## 🧪 Test the Password Reset Flow (Right Now!)

### Quick Test in Browser:

1. **Go to forgot-password page:**
   - Navigate to: `http://localhost:4200/forgot-password`

2. **Enter any email:**
   - Example: `nagabhushanam2094@gmail.com`

3. **Click "Send Reset Link"**
   - In TEST MODE, you'll see:
     - ✅ Success message
     - Yellow info box showing "TEST MODE"
     - Reset link displayed in a code box
     - Buttons to "Copy Link" or "Go to Reset"

4. **Copy or click the reset link**
   - The link will look like: `http://localhost:4200/reset-password?token=abc123&email=...`

---

## 📧 Enable Real Gmail Emails (Optional - for Production)

### Step 1: Get Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable **2-Factor Authentication** (if not already enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Select **Mail** and **Windows Computer**
5. Click **Generate** → Copy the 16-character password

### Step 2: Update .env File
```
EMAIL_USER=nagabhushanam2094@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### Step 3: Restart Backend
```powershell
npm run api
```

You should see:
```
✅ Email service ready! Emails will be sent via Gmail.
```

### Step 4: Test Real Email Sending
- Go to `/forgot-password`
- Enter your email
- Check your inbox for the reset link!

---

## 📁 Related Files

### Frontend:
- [src/app/forgot-password/forgot-password.ts](../src/app/forgot-password/forgot-password.ts) - Component logic
- [src/app/forgot-password/forgot-password.html](../src/app/forgot-password/forgot-password.html) - Template with test mode UI
- [src/app/forgot-password/forgot-password.css](../src/app/forgot-password/forgot-password.css) - Styling
- [src/app/app.routes.ts](../src/app/app.routes.ts) - Routes (includes `/forgot-password`)

### Backend:
- [backend/server.js](../backend/server.js) - Express server with `/forgot-password` endpoint
- [.env](.env) - Configuration file (EMAIL_USER, EMAIL_PASSWORD)

### Packages:
- `nodemailer` - Email sending library
- `dotenv` - Environment variable management

---

## 🔄 User Flow

### Forgot Password Flow:
1. User navigates to `/forgot-password`
2. User enters email
3. User clicks "Send Reset Link"
4. Backend generates reset token and link
5. In TEST MODE: Link shown on page + logged to console
6. In PRODUCTION: Email sent to user's inbox
7. User clicks link → navigates to `/reset-password?token=XXX&email=XXX`
8. Reset password page loads (⚠️ TO BE CREATED)

---

## ⚠️ Next Steps (Not Yet Implemented)

The password reset page (`/reset-password`) still needs to be created:
- Form with new password + confirm password
- Password strength validation
- Backend endpoint to verify token and update password
- Success/error messages

Would you like me to implement the reset password page next?

---

## 🐛 Troubleshooting

### I don't see the test mode info
- Make sure backend is running: `npm run api`
- Check backend terminal for "TEST MODE" message
- Hard refresh browser: Ctrl+Shift+R

### I want real emails instead of test mode
- Update .env with Gmail credentials
- Restart backend server
- Verify Gmail 2-Factor Authentication is enabled

### The reset link doesn't work
- In TEST MODE, links are for testing only
- Copy the link and use it in the browser
- When production is set up, emails will contain clickable links
