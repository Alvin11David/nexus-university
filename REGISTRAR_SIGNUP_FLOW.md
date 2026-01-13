# Registrar Sign-Up Flow Implementation

## Overview

A complete registrar sign-up flow has been implemented following the same pattern as the lecturer sign-up flow. Registrars can now sign up using an institutional email format and will be taken through a multi-step onboarding process.

## Key Features

### 1. Email Format Detection

- **Registrar Format**: `firstname.lastname@registrar.com`
- The system automatically detects when an email matches the registrar format and routes the user through the appropriate signup flow
- Pattern validation: `/^[a-z]+\.[a-z]+@registrar\.com$/i`

### 2. Sign-Up Flow Steps

The registrar sign-up process follows these sequential steps:

1. **Email Verification** (`signup-details`)

   - User enters their registrar email (firstname.lastname@registrar.com)
   - System detects the registrar format automatically
   - Shows helpful hint: "Registrar registration: Enter email in format firstname.lastname@registrar.com"

2. **Personal Details** (`registrar-personal-details`)

   - **First Name**: Input field for first name
   - **Last Name**: Input field for last name
   - **College/Department**: Field to specify college or department affiliation
   - **Email Address**: User's actual institutional email address (used for OTP verification)
   - Generates OTP and sends to the actual email address

3. **Email Verification** (`signup-otp`)

   - User receives 4-digit OTP code on their actual email address
   - Enter verification code in 4-digit input fields
   - Auto-focus to next field for smooth UX
   - Resend functionality available

4. **Password Setup** (`signup-password`)
   - Set a secure password (minimum 6 characters)
   - Password visibility toggle
   - Terms & conditions acknowledgment
   - Creates the account and redirects to registrar dashboard

### 3. UI/UX Features

- **Step Indicator**: Visual progress bar showing current step (Email → Details → Verify → Password)
- **Back Button**: Navigate back to previous steps
- **Form Validation**: All fields required before proceeding
- **Loading States**: Spinner feedback during operations
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: OTP and status notifications

## Technical Implementation

### Modified Files

#### 1. `src/pages/Auth.tsx`

**Changes:**

- Added `"registrar-personal-details"` to `AuthStep` type
- Added `isRegistrarSignup` state variable
- Added `handleRegistrarDetails()` function to process registrar personal details
- Updated `handleValidateStudent()` to detect registrar emails and route appropriately
- Updated `handleVerifyOtp()` to support registrar signup (uses actualEmail)
- Updated `handleCreateAccount()` to pass registrar role and redirect to `/registrar`
- Updated `resetToSignIn()` and `resetToSignUp()` to clear registrar flag
- Updated `renderStepIndicator()` to show correct steps for registrar flow
- Updated signup-details form to show registrar email format hint
- Added `registrar-personal-details` form case in `renderForm()`
- Updated back button logic to handle all signup steps correctly

#### 2. `src/pages/RegistrarDashboard.tsx` (NEW)

**Created new registrar dashboard with:**

- Responsive sidebar navigation
- Mobile-friendly hamburger menu
- Quick stats cards:
  - Total Students
  - Programs
  - Transcripts Issued
  - Pending Approvals
- Quick action buttons:
  - Manage Students
  - Transcripts Management
  - Reports
- Navigation items for future features:
  - Students management
  - Programs management
  - Transcripts
  - Reports
  - Settings

#### 3. `src/App.tsx`

**Changes:**

- Added `RegistrarRoute` component to protect registrar pages
- Imported `RegistrarDashboard` component
- Added `/registrar` route with proper access control
- Updated `LecturerRoute` to properly redirect registrars and non-lecturers
- Route logic ensures:
  - Lecturers → `/lecturer`
  - Registrars → `/registrar`
  - Students → `/dashboard`

## Sign-Up Flow Logic

```
1. User enters email (firstname.lastname@registrar.com)
   ↓
2. System detects registrar pattern
   ↓
3. Route to registrar-personal-details form
   ↓
4. User enters first name, last name, college/dept, real email
   ↓
5. OTP generated and sent to real email
   ↓
6. User verifies OTP code (4 digits)
   ↓
7. User sets password
   ↓
8. Account created with role: "registrar"
   ↓
9. Redirected to /registrar dashboard
```

## Database Integration

- Role assigned as `"registrar"` in user profiles
- Department field stored for college/department affiliation
- OTP verification uses actual email address
- Full name composed from firstName + lastName

## Security Features

- Email domain verification (registrar.com)
- OTP-based email verification
- Password requirements (minimum 6 characters)
- Role-based access control (RegistrarRoute)
- Protected routes prevent unauthorized access

## User Experience Enhancements

- Auto-detect registrar email format - no manual selection needed
- Clear visual feedback at each step
- Easy navigation with back buttons
- Responsive design for mobile and desktop
- Helpful hints and error messages
- Demo mode OTP display for testing

## Future Expansion

The registrar dashboard is ready to add additional features:

- Student record management
- Academic program administration
- Transcript generation and issuance
- Academic analytics and reports
- Enrollment verification
- Transcript requests management
- Academic calendar management

## Testing the Flow

1. Go to `/auth?mode=signup`
2. Enter email in format: `firstname.lastname@registrar.com`
3. Click "Verify & Continue"
4. Should automatically detect and route to personal details form
5. Fill in first name, last name, college/department, and real email
6. Copy OTP from toast notification
7. Enter 4-digit code
8. Set password
9. Should be redirected to `/registrar` dashboard

## Notes

- The registrar format is case-insensitive but displayed as lowercase
- College/Department field is flexible for various organizational structures
- System redirects between roles appropriately (can't access lecturer dashboard as registrar, etc.)
- Future iterations can add role-specific dashboard features
