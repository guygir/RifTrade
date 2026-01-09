# Supabase Email Verification Disable

To make signup less personal (no email verification required):

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/xwjkuxwyfkxbfqwrwpbv
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, find **"Enable email confirmations"**
4. **Turn it OFF** (disable email confirmations)
5. Save changes

This allows users to sign up with any email format (even fake ones) without needing to verify their email address.

**Note**: Supabase still requires an email field for authentication, but:
- Users can use any email format (e.g., `username@example.com` or even `test@test.com`)
- No email verification is sent
- No email validation beyond basic format check
- Users can sign in immediately after signup

The app UI has been updated to reflect this - it shows "any email format accepted" and removes the email verification message.

