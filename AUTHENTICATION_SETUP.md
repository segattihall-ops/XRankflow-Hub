# Authentication Setup Guide

## Quick Start

### 1. Supabase Project Setup

Your app is configured to use Supabase for authentication. The credentials are already set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://njwqeulzythluenexdcw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_XbmJA9m7lSEywUBMbsQdSw_gsna1jqq
```

### 2. Create a Test User

To create a test user for login:

**Option A: Via Supabase Dashboard**
1. Go to https://app.supabase.com
2. Select your project (njwqeulzythluenexdcw)
3. Navigate to **Authentication > Users**
4. Click **Create a new user**
5. Enter:
   - Email: `admin@xrankflow.com`
   - Password: `142522` (or your preferred password)
6. Click **Create user**

**Option B: Via Supabase CLI** (if installed)
```bash
supabase auth users create --email admin@xrankflow.com --password 142522
```

### 3. Test the Login

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/login

3. Enter credentials:
   - Email: `admin@xrankflow.com`
   - Password: `142522`

4. Check the "Remember me" checkbox to save email for next time

### 4. Troubleshooting

**Error: "Invalid login credentials"**
- Verify the user exists in Supabase
- Check that the password is correct
- Ensure the email matches exactly

**Error: "XRANKFLOW Hub is temporarily unavailable"**
- Check that `.env.local` has the correct Supabase credentials
- Verify the Supabase project is accessible

**Session not persisting**
- Check browser console for errors
- Clear cookies and try again
- Verify the middleware is properly handling authentication

### 5. User Management

After logging in, users can:
- Use "Remember me" to save their email for next login
- Access the dashboard at `/` (redirects to `/hub-navigator`)
- Log out via the sidebar

### 6. Production Deployment

For production (Vercel):
1. Set environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. These will override the `.env.local` values

## Architecture

- **Client**: Uses `@supabase/supabase-js` for browser authentication
- **Server**: Uses `@supabase/ssr` in middleware for session management
- **Session**: Stored in cookies, synced via middleware
- **Protected pages**: Redirect to `/login` if not authenticated
