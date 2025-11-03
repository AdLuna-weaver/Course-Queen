# Authentication Guide

## Overview

The Course Planner application uses Supabase Auth with email/password authentication. This guide covers how to use the authentication system and how it's implemented.

---

## User Guide

### Creating an Account

1. Visit [http://localhost:3000/signup](http://localhost:3000/signup)
2. Fill in the form:
   - **Full Name**: Your display name (minimum 2 characters)
   - **Email**: A valid email address
   - **Password**: At least 6 characters
   - **Confirm Password**: Must match your password
3. Click **Sign Up**
4. You'll be automatically signed in and redirected to `/courses`

**Note:** Depending on your Supabase settings, you may need to confirm your email before logging in.

### Signing In

1. Visit [http://localhost:3000/login](http://localhost:3000/login)
2. Enter your email and password
3. Click **Sign In**
4. You'll be redirected to `/courses`

### Signing Out

1. Click your avatar/initial in the top right corner of the dashboard
2. Click **Sign out**
3. You'll be redirected to the login page

### Protected Routes

The following routes require authentication:
- `/courses` - Course management
- `/resources` - Resource library
- `/settings` - Account settings

If you try to access these while logged out, you'll be redirected to `/login` with a return URL parameter.

---

## Developer Guide

### Architecture

```
┌─────────────────┐
│   Client Page   │
│  (Login/Signup) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Server Actions  │
│  (actions.ts)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Auth   │
│   (SSR Client)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Middleware    │
│ (Session Check) │
└─────────────────┘
```

### Files Overview

#### 1. Server Actions (`src/app/(auth)/actions.ts`)

Server-side authentication operations:

```typescript
// Sign in a user
export async function login(formData: FormData): Promise<AuthResponse>

// Create a new user
export async function signup(formData: FormData): Promise<AuthResponse>

// Sign out the current user
export async function logout(): Promise<void>

// Get the current user
export async function getUser(): Promise<User | null>

// Get the current session
export async function getSession(): Promise<Session | null>
```

**Usage Example:**

```typescript
'use server';

import { login, getUser } from '@/app/(auth)/actions';

// In a server component
const user = await getUser();
if (!user) {
  redirect('/login');
}

// In a form action
async function handleLogin(formData: FormData) {
  const result = await login(formData);
  if (result.error) {
    console.error(result.error);
  }
}
```

#### 2. Middleware (`middleware.ts`)

Protects routes and manages sessions:

```typescript
// Protected routes
const protectedRoutes = ['/courses', '/resources', '/settings'];

// Auth routes
const authRoutes = ['/login', '/signup'];

// Redirects:
// - Unauthenticated users → /login
// - Authenticated users at /login or /signup → /courses
```

**How it works:**
1. Updates session on every request
2. Checks if route requires authentication
3. Redirects unauthenticated users to login
4. Redirects authenticated users away from auth pages

#### 3. Login Page (`src/app/(auth)/login/page.tsx`)

Client component with form validation:

**Features:**
- Email format validation
- Password length validation (min 6 chars)
- Loading states
- Error display
- Link to signup

**Validation Rules:**
```typescript
{
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: minimum 6 characters
}
```

#### 4. Signup Page (`src/app/(auth)/signup/page.tsx`)

Client component with extended validation:

**Features:**
- Full name validation (min 2 chars)
- Email format validation
- Password length validation (min 6 chars)
- Password confirmation matching
- Loading states
- Error display
- Link to login

**Validation Rules:**
```typescript
{
  fullName: minimum 2 characters,
  email: valid email format,
  password: minimum 6 characters,
  confirmPassword: must match password
}
```

#### 5. User Navigation (`src/components/auth/UserNav.tsx`)

Displays user info and logout option:

**Props:**
```typescript
interface UserNavProps {
  user: User; // Supabase User object
}
```

**Features:**
- Shows user's initial in avatar
- Dropdown with full name and email
- Logout button
- Loading state during logout

#### 6. Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

Server component that protects dashboard:

```typescript
export default async function DashboardLayout({ children }) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      {/* Sidebar */}
      <aside>...</aside>

      {/* Header with UserNav */}
      <header>
        <UserNav user={user} />
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
```

---

## Supabase Configuration

### Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Email Confirmation

By default, Supabase may require email confirmation. To disable for development:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Confirmation**
4. Toggle **Enable email confirmations** OFF

**For production**, keep email confirmation enabled for security.

### Password Requirements

Default Supabase settings:
- Minimum 6 characters
- No special character requirements by default

To change password requirements:
1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Password Requirements**
4. Adjust as needed

---

## Security Best Practices

### ✅ Implemented

1. **Server-side Auth Operations**
   - All auth logic in server actions
   - No client-side auth secrets
   - Secure cookie handling

2. **Protected Routes**
   - Middleware checks on every request
   - Automatic redirects
   - Session refresh

3. **Input Validation**
   - Client-side validation for UX
   - Server-side validation by Supabase
   - Clear error messages

4. **Password Security**
   - Never stored in plain text
   - Hashed by Supabase
   - Minimum length enforced

### 🔒 Additional Recommendations

1. **Rate Limiting**
   ```typescript
   // Consider adding rate limiting to prevent brute force
   // Can be done via Supabase RLS or middleware
   ```

2. **Password Strength**
   ```typescript
   // Consider adding password strength indicator
   // Require special characters, numbers, etc.
   ```

3. **Multi-Factor Authentication**
   ```typescript
   // Supabase supports MFA
   // Can be added in future iterations
   ```

4. **Session Timeout**
   ```typescript
   // Configure session lifetime in Supabase
   // Default is 1 week
   ```

---

## Testing Authentication

### Manual Testing

1. **Test Signup Flow:**
   ```bash
   npm run dev
   # Visit http://localhost:3000/signup
   # Create account with valid credentials
   # Verify redirect to /courses
   ```

2. **Test Login Flow:**
   ```bash
   # Visit http://localhost:3000/login
   # Sign in with created account
   # Verify redirect to /courses
   ```

3. **Test Protected Routes:**
   ```bash
   # Sign out
   # Try to visit http://localhost:3000/courses
   # Verify redirect to /login
   ```

4. **Test Logout:**
   ```bash
   # Sign in
   # Click avatar → Sign out
   # Verify redirect to /login
   ```

### Validation Testing

Test invalid inputs:
- Invalid email format
- Short password (< 6 chars)
- Mismatched passwords
- Empty fields
- Very long inputs

Each should show appropriate error messages.

---

## Common Issues & Solutions

### Issue: "Invalid login credentials"

**Causes:**
- Wrong email or password
- Email not confirmed (if confirmation enabled)
- Account doesn't exist

**Solutions:**
1. Verify credentials
2. Check Supabase email confirmation settings
3. Create account if needed

### Issue: Redirected to login immediately after signup

**Cause:** Email confirmation is enabled

**Solution:**
- Check email for confirmation link
- Or disable email confirmation in Supabase dashboard

### Issue: Session lost after refresh

**Causes:**
- Cookies not being saved
- Browser blocking cookies
- Middleware not configured correctly

**Solutions:**
1. Check browser cookie settings
2. Verify middleware.ts is in root directory
3. Check cookie settings in Supabase client

### Issue: "Failed to fetch" error

**Causes:**
- Invalid Supabase URL or keys
- Network issues
- CORS issues

**Solutions:**
1. Verify environment variables
2. Check Supabase project status
3. Test Supabase connection in dashboard

---

## API Reference

### Server Actions

#### login(formData: FormData)

Signs in a user with email and password.

**Parameters:**
- `formData.email` - User's email
- `formData.password` - User's password

**Returns:**
```typescript
{
  error?: string; // Error message if login failed
}
```

**Redirects:** To `/courses` on success

---

#### signup(formData: FormData)

Creates a new user account.

**Parameters:**
- `formData.fullName` - User's display name
- `formData.email` - User's email
- `formData.password` - User's password

**Returns:**
```typescript
{
  error?: string; // Error message if signup failed
}
```

**Redirects:** To `/courses` on success

---

#### logout()

Signs out the current user.

**Returns:** `void`

**Redirects:** To `/login`

---

#### getUser()

Gets the currently authenticated user.

**Returns:**
```typescript
Promise<User | null>
```

---

#### getSession()

Gets the current session.

**Returns:**
```typescript
Promise<Session | null>
```

---

## Extending Authentication

### Adding OAuth Providers

Supabase supports multiple OAuth providers. To add (e.g., Google):

1. **Configure in Supabase:**
   - Go to Authentication → Providers
   - Enable Google
   - Add OAuth credentials

2. **Add to Login Page:**
   ```typescript
   import { createClient } from '@/lib/supabase/client';

   async function signInWithGoogle() {
     const supabase = createClient();
     await supabase.auth.signInWithOAuth({
       provider: 'google',
       options: {
         redirectTo: `${window.location.origin}/auth/callback`
       }
     });
   }
   ```

3. **Create Callback Route:**
   ```typescript
   // app/auth/callback/route.ts
   import { createClient } from '@/lib/supabase/server';
   import { NextResponse } from 'next/server';

   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url);
     const code = searchParams.get('code');

     if (code) {
       const supabase = await createClient();
       await supabase.auth.exchangeCodeForSession(code);
     }

     return NextResponse.redirect('/courses');
   }
   ```

### Adding Password Reset

1. **Create Reset Request Page:**
   ```typescript
   // app/(auth)/reset-password/page.tsx
   async function handleReset(formData: FormData) {
     const email = formData.get('email');
     const supabase = createClient();
     await supabase.auth.resetPasswordForEmail(email, {
       redirectTo: `${window.location.origin}/auth/update-password`
     });
   }
   ```

2. **Create Update Password Page:**
   ```typescript
   // app/auth/update-password/page.tsx
   async function handleUpdate(formData: FormData) {
     const password = formData.get('password');
     const supabase = createClient();
     await supabase.auth.updateUser({ password });
   }
   ```

---

## Next Steps

Now that authentication is complete, you can:

1. **Create User Profiles**
   - Add profile table
   - Store additional user data
   - Link to companies

2. **Add Role-Based Access**
   - Define user roles (admin, creator, reviewer)
   - Protect routes by role
   - Implement permission checks

3. **Build Course Management**
   - Create courses
   - Assign team members
   - Manage permissions

See the [QUICK_START.md](./QUICK_START.md) for the development roadmap.
