# QR Code Implementation Checklist

## ✅ Completed Tasks

### Configuration Files

- [x] Created `/src/lib/config.ts` with:
  - [x] `HOSTING_URL` constant set to `https://universityportal2026.web.app`
  - [x] `getResultsShareUrl()` function
  - [x] `getTimetableShareUrl()` function
  - [x] `getIdCardShareUrl()` function
  - [x] `getEnrollmentShareUrl()` function
  - [x] `getPRNShareUrl()` function
  - [x] `generateQRCodeDataUrl()` helper function

### Updated Source Files

#### 1. Results Page (`src/pages/Results.tsx`)

- [x] Imported `getResultsShareUrl` from config
- [x] Updated QR code generation to use the helper function
- [x] QR Code URL: `https://universityportal2026.web.app/results?student={uid}`
- [x] No compile errors

#### 2. Timetable Page (`src/pages/Timetable.tsx`)

- [x] Imported `getTimetableShareUrl` from config
- [x] Changed from dynamic `window.location.origin + "/timetable"`
- [x] Updated timetableUrl assignment to use helper function
- [x] QR Code URL: `https://universityportal2026.web.app/timetable`
- [x] No compile errors

#### 3. ID Card Page (`src/pages/IdCard.tsx`)

- [x] Imported `QRCodeSVG` and `getIdCardShareUrl`
- [x] Replaced `<QrCode />` icon placeholder with actual `<QRCodeSVG>` component
- [x] Configured QR code size to 80x80 for printing
- [x] QR Code URL: `https://universityportal2026.web.app/id-card?student={uid}`
- [x] No compile errors

#### 4. Enrollment Registration Tab (`src/components/settings/EnrollmentRegistrationTab.tsx`)

- [x] Imported `html2canvas` for future use
- [x] Imported `getEnrollmentShareUrl` and `generateQRCodeDataUrl`
- [x] Updated print document to use `generateQRCodeDataUrl()` API
- [x] Replaced placeholder SVG with real QR code image
- [x] QR Code URL: `https://universityportal2026.web.app/enrollment?student={uid}`
- [x] No compile errors

#### 5. PRN Tab (`src/components/settings/GeneratePRNTab.tsx`)

- [x] Imported `getPRNShareUrl` for future use
- [x] Ready for enhancement when needed
- [x] No breaking changes

### Documentation

- [x] Created `QR_CODE_IMPLEMENTATION.md` with:
  - Overview of changes
  - Detailed changes for each file
  - QR Code URLs reference table
  - Testing recommendations
  - Technical details
  - Implementation notes

## Testing Status

### Ready to Test

1. Results QR Code - ✓ Ready
2. Timetable QR Code - ✓ Ready
3. ID Card QR Code - ✓ Ready (with print)
4. Enrollment QR Code - ✓ Ready (print preview)
5. PRN QR Code - ✓ Unchanged (existing functionality preserved)

### Production Checklist

- [ ] Test all QR codes on `https://universityportal2026.web.app`
- [ ] Verify all scanned QR codes resolve to correct pages
- [ ] Test printing of ID Card and Enrollment documents
- [ ] Verify QR codes work on various mobile devices
- [ ] Test with multiple QR scanner apps
- [ ] Verify all links include student IDs when applicable
- [ ] Test cross-domain access (if applicable)

## Key Implementation Details

### Hosting URL

All QR codes now point to: **https://universityportal2026.web.app**

This ensures:

- Consistent behavior across development and production
- No localhost URLs in production
- Student redirects to correct domain
- Shareable, scannable QR codes

### QR Code Generation Methods

- **Interactive Pages**: Using `qrcode.react` (QRCodeSVG)
- **Print Documents**: Using `api.qrserver.com` API for PNG images
- **Sizes**:
  - Digital display: 200x200 pixels
  - Print: 80-120 pixels

### URLs with Parameters

- Results: Include student UID
- ID Card: Include student UID
- Enrollment: Include student UID
- Timetable: No parameters (general access)
- PRN: Could include PRN code for verification

## No Breaking Changes

- All existing functionality preserved
- QR code libraries unchanged (qrcode.react already in use)
- All import statements added correctly
- No deprecated code removed

## Notes

- CORS may need to be configured for `api.qrserver.com` if experiencing issues
- All QR code endpoints should be implemented on the portal for proper routing
- Consider implementing verification pages for scanned QR codes:
  - `/id-card?student={uid}` - ID card verification
  - `/enrollment?student={uid}` - Enrollment status
  - `/prn-check?code={code}` - PRN verification
