# Ko-fi Button Implementation Guide

This guide explains how to implement a theme-aware Ko-fi support button with custom styling for light and dark modes.

## Overview

The Ko-fi button implementation uses an embedded approach (not the floating widget) with custom colors that adapt to the user's theme preference:

- **Light Mode**: Warm coffee-shop aesthetic with pink background and brown accents
- **Dark Mode**: Original Ko-fi branding colors (dark gray with cyan hover)

## Implementation

### 1. README.md Badge (GitHub/Markdown)

For README files or markdown documentation, you can use either the official badge or the custom HTML button.

#### Option A: Official Ko-fi Badge (Simple)

```markdown
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/guygir)
```

#### Option B: Custom HTML Button (Styled, Coffee Theme)

```html
<a href="https://ko-fi.com/guygir" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#92400e;color:white;font-weight:600;border-radius:8px;text-decoration:none;transition:background 0.3s;">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
  </svg>
  Buy me a cup of Ko-fi
</a>
```

The custom HTML button features:
- Coffee brown background (#92400e - amber-800)
- Ko-fi logo SVG in white
- Smooth hover transition
- Matches the coffee theme from the React component

**Complete Example for README**:

```markdown
## Support the Project

If you enjoy using this app, consider supporting its development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/guygir)

<a href="https://ko-fi.com/guygir" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#92400e;color:white;font-weight:600;border-radius:8px;text-decoration:none;transition:background 0.3s;">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
  </svg>
  Support Me on Ko-fi
</a>
```

**Placement**: Add this section in the lower part of the README, typically after the "Legal" section and before "Changelog" or similar sections. This keeps the technical setup information at the top while placing the support button in a visible but non-intrusive location.

**How to Add to a New Project**:
1. Locate the project's `README.md` file in the root directory
2. Find the "Legal" section (or equivalent end-of-content section)
3. Add the "Support the Project" section immediately after it
4. Choose either the simple badge, custom HTML button, or both
5. Ensure proper spacing (blank line before and after the section)

**Reference**: See `README.md` lines 75-85 for the implementation in this project.

### 2. Button Component Code (React/Next.js)

Add this code to your React/Next.js component:

```tsx
{/* Ko-fi Support Button */}
<div className="my-6 flex justify-center">
  <a
    href="https://ko-fi.com/guygir"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-6 py-3 bg-pink-100 hover:bg-pink-200 dark:bg-[#323842] dark:hover:bg-[#13C3FF] text-amber-900 dark:text-white font-semibold rounded-lg transition-colors shadow-lg"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className="fill-amber-800 dark:fill-current"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
    </svg>
    Buy me a cup of Ko-fi
  </a>
</div>
```

**Note**: The Ko-fi username is already set to `guygir` - no changes needed for your projects. You can customize the button text to anything you prefer.

### 3. Color Breakdown

#### Light Mode Colors:
- **Background**: `bg-pink-100` (soft pink)
- **Hover Background**: `hover:bg-pink-200` (slightly darker pink)
- **Text**: `text-amber-900` (dark coffee brown)
- **Icon**: `fill-amber-800` (coffee brown)

#### Dark Mode Colors:
- **Background**: `dark:bg-[#323842]` (Ko-fi dark gray)
- **Hover Background**: `dark:hover:bg-[#13C3FF]` (Ko-fi cyan)
- **Text**: `dark:text-white`
- **Icon**: `dark:fill-current` (inherits text color)

### 4. Tailwind CSS Requirements

This implementation uses Tailwind CSS with dark mode support. Ensure your `tailwind.config.ts` has dark mode enabled:

```typescript
export default {
  darkMode: 'class', // or 'media'
  // ... rest of config
}
```

### 5. Next.js CSP Configuration (Optional)

If you want to use Ko-fi's official floating widget instead, you'll need to update your Content Security Policy in `next.config.mjs`:

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://storage.ko-fi.com",
    "style-src 'self' 'unsafe-inline' https://storage.ko-fi.com https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://ko-fi.com https://*.ko-fi.com",
    "frame-src https://ko-fi.com",
  ].join('; ')
}
```

**Note**: The embedded button approach (shown above) doesn't require CSP changes.

## Reference Implementation

See the complete implementation in this project:
- **File**: `app/riftle/page.tsx`
- **Lines**: 1244-1263

## Customization Options

### Change Colors

You can customize the color scheme by modifying the Tailwind classes:

```tsx
// Example: Blue theme for light mode
className="... bg-blue-100 hover:bg-blue-200 text-blue-900 ..."

// Example: Different dark mode colors
className="... dark:bg-gray-800 dark:hover:bg-gray-700 ..."
```

### Adjust Size

Modify padding and icon size:

```tsx
// Larger button
className="... px-8 py-4 ..."
<svg width="32" height="32" ...>

// Smaller button
className="... px-4 py-2 ..."
<svg width="20" height="20" ...>
```

### Change Position

The button is wrapped in a flex container for centering. Adjust as needed:

```tsx
// Left-aligned
<div className="my-6 flex justify-start">

// Right-aligned
<div className="my-6 flex justify-end">

// Full width
<div className="my-6">
  <a className="... w-full justify-center">
```

## Why Embedded Instead of Floating Widget?

We chose the embedded button approach over Ko-fi's official floating widget because:

1. **Better Control**: Full control over styling and positioning
2. **Theme Integration**: Seamlessly adapts to light/dark mode
3. **No CSP Issues**: Doesn't require external script loading
4. **Performance**: No additional JavaScript to load
5. **Customization**: Easy to modify colors, size, and placement

## Testing

Test the button in both light and dark modes:

1. Toggle your system/browser theme
2. Verify colors change appropriately
3. Test hover states in both modes
4. Ensure the link opens correctly in a new tab

## Troubleshooting

### Button doesn't change colors in dark mode
- Ensure your theme provider is set up correctly
- Check that `darkMode` is configured in `tailwind.config.ts`
- Verify the `dark:` prefix classes are being applied

### Colors look wrong
- Make sure you're using the exact Tailwind color classes
- For custom hex colors, use bracket notation: `bg-[#323842]`
- Check that your Tailwind build includes the color utilities

### Link doesn't work
- Ensure the URL format is correct: `https://ko-fi.com/guygir`
- Verify the link opens in a new tab with `target="_blank"`

## Additional Resources

- [Ko-fi Official Website](https://ko-fi.com)
- [Tailwind CSS Dark Mode Documentation](https://tailwindcss.com/docs/dark-mode)
- [Next.js CSP Configuration](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)