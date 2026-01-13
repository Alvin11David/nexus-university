# View Receipt - Mobile Responsive Updates

## Overview

The "View Receipt" modal (displayed after generating a PRN) has been made fully responsive for mobile devices. All UI elements now adapt gracefully to different screen sizes.

## Changes Made

### 1. **Dialog Container & Header**

- **Desktop:** `max-w-2xl` container with standard padding
- **Mobile:** `w-[95vw]` ensures proper margins on small screens
- **Header Layout:** Converts from flex-row on desktop to flex-col on mobile with proper gap spacing

```tsx
// Before: Fixed large layout
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

// After: Responsive layout
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6 rounded-xl sm:rounded-lg">
```

### 2. **Receipt Content Spacing**

- Responsive padding: `p-4 sm:p-8` (4px on mobile, 32px on desktop)
- Responsive spacing: `space-y-4 sm:space-y-6` (smaller gaps on mobile)
- Responsive border radius: `rounded-xl sm:rounded-2xl`

### 3. **Typography Responsiveness**

All text elements scale based on screen size:

- **Receipt Title:** `text-xl sm:text-2xl`
- **Subheadings:** `text-sm sm:text-base`
- **Body Text:** `text-xs sm:text-sm`
- **Labels:** `text-xs sm:text-sm`

### 4. **Information Sections**

- **Spacing:** `space-y-1 sm:space-y-2` - Compact on mobile, spacious on desktop
- **Text Alignment:** Added `text-right` and `break-all` for long content (emails, PRN codes)
- **Layout:** `flex justify-between gap-2` with gaps for wrapping on small screens

### 5. **Payment Details Box**

- Padding: `p-3 sm:p-4`
- Border radius: `rounded-lg sm:rounded-xl`
- Spacing: `space-y-2 sm:space-y-3`

### 6. **QR Code**

- Dynamic sizing: Reduces to 100px on phones (< 480px), 120px on larger screens
- Proper centering with overflow handling: `overflow-x-auto`
- Flex shrink to prevent breaking: `flex-shrink-0`
- Responsive padding: `py-3 sm:py-4`

```tsx
<QRCodeSVG
  size={window.innerWidth < 480 ? 100 : 120}
  // ... rest of props
/>
```

### 7. **Instructions & Footer**

- Padding: `p-3 sm:p-4`
- Border radius: `rounded-lg sm:rounded-xl`
- List items maintain readability with proper spacing

### 8. **Action Buttons**

Complete redesign for mobile accessibility:

**Layout Changes:**

- Desktop: `flex gap-3 justify-between` (horizontal)
- Mobile: `flex flex-col sm:flex-row gap-2 sm:gap-3` (stacked on small screens)

**Button Sizing:**

- Width: `w-full sm:flex-1` or `w-full sm:w-auto` (full width on mobile)
- Height: `h-10 sm:h-auto` (optimal touch target on mobile)
- Text size: `text-xs sm:text-sm` (readable on all devices)
- Icon size: `h-3 w-3 sm:h-4 sm:w-4` (appropriately scaled)

**Smart Text Display:**

- Long labels hidden on extra small screens
- Abbreviated text shows on mobile (e.g., "Image" instead of "Download as Image")
- Full text displays on larger screens

```tsx
<span className="hidden xs:inline">Download as Image</span>
<span className="inline xs:hidden">Image</span>
```

## Responsive Breakpoints Used

| Breakpoint            | Size        | Usage                              |
| --------------------- | ----------- | ---------------------------------- |
| Mobile (default)      | < 640px     | Base styles, compact layout        |
| `sm:`                 | ≥ 640px     | Tablet and desktop adjustments     |
| `xs:` (hidden/inline) | Extra small | Text abbreviation for tiny screens |

## Testing Recommendations

1. **Mobile Phones (< 400px)**

   - Portrait orientation
   - Verify text readability
   - Check QR code scaling
   - Test button stacking

2. **Tablets (400px - 768px)**

   - Both orientations
   - Spacing adjustments
   - Button layout transitions

3. **Desktop (> 768px)**
   - Verify no layout breaks
   - Check spacing consistency
   - Ensure visual hierarchy maintained

## Benefits

✅ **Better Mobile Experience**

- Reduced padding prevents text crowding
- Buttons stack vertically for easier tapping
- Text scales appropriately for readability

✅ **Improved Accessibility**

- Larger touch targets (h-10 minimum)
- Proper text wrapping (`break-all`, `text-right`)
- Clear visual hierarchy across all screen sizes

✅ **Bandwidth Friendly**

- Smaller QR code on mobile (less rendering overhead)
- Abbreviated button text reduces layout width

✅ **Print Friendly**

- Downloaded receipt maintains proper formatting
- QR code remains scannable across all sizes

## Files Modified

- `src/components/settings/GeneratePRNTab.tsx`
