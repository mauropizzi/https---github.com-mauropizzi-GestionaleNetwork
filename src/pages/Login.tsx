// src/pages/Login.tsx
// ...
// Find the Auth component call around line 89:
// <Auth
//   appearance={{ theme: ThemeSupa }}
//   providers={['google']}
//   link_text="Go back" // Remove this line
// />
// It should look like this after the fix:
<Auth
  appearance={{ theme: ThemeSupa }}
  providers={['google']}
  // Remove link_text prop
/>
// ...