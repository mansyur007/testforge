/* Authentic brand marks for integrations — official colors, recognizable geometry.
   Used nominatively for integration display, per the brief ("pakai icon asli"). */
window.TF_BRANDS = [
  { id:"jira", name:"Jira", role:"Integration", note:"#2684FF",
    svg:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="jg" x1="98%" y1="0%" x2="36%" y2="46%">
        <stop offset="0" stop-color="#0052CC"/><stop offset="1" stop-color="#2684FF"/></linearGradient></defs>
      <path fill="#2684FF" d="M11.57 11.51H0a5.22 5.22 0 0 0 5.23 5.22h2.13v2.05A5.22 5.22 0 0 0 12.58 24V12.52a1 1 0 0 0-1.01-1.01z"/>
      <path fill="url(#jg)" d="M17.29 5.76H5.74a5.22 5.22 0 0 0 5.21 5.21h2.13v2.06a5.22 5.22 0 0 0 5.22 5.21V6.76a1 1 0 0 0-1.01-1z"/>
      <path fill="url(#jg)" d="M23.01 0H11.46a5.22 5.22 0 0 0 5.21 5.22h2.13v2.05A5.22 5.22 0 0 0 24 12.48V1.01A1 1 0 0 0 23.01 0z"/>
    </svg>` },

  { id:"github", name:"GitHub", role:"Integration", note:"#181717",
    svg:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#181717" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.26.8-.58 0-.28-.01-1.04-.02-2.04-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.82 1.1.82 2.22 0 1.61-.02 2.9-.02 3.29 0 .32.22.7.83.58A12 12 0 0 0 12 .3z"/>
    </svg>` },

  { id:"cypress", name:"Cypress", role:"Integration", note:"#69D3A7",
    svg:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11.3" fill="#1B1E2E"/>
      <path fill="none" stroke="#69D3A7" stroke-width="1.7" stroke-linecap="round"
        d="M14.3 8.6a4 4 0 1 0 0 6.8"/>
      <path fill="#69D3A7" d="M6.2 9.4l1.7 5 1.7-5h1.5l-2.4 6.4c-.4 1.1-.9 1.6-1.9 1.6-.3 0-.6 0-.9-.1v-1.2c.2 0 .4.1.6.1.4 0 .6-.2.8-.6l.1-.3-2.4-5.9z"/>
    </svg>` },

  { id:"slack", name:"Slack", role:"Integration", note:"4-color",
    svg:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#36C5F0" d="M6.2 14.9a2 2 0 1 1-2-2h2zM7.2 14.9a2 2 0 1 1 4 0v5a2 2 0 1 1-4 0z"/>
      <path fill="#2EB67D" d="M9.2 6.1a2 2 0 1 1 2-2v2zM9.2 7.1a2 2 0 1 1 0 4h-5a2 2 0 1 1 0-4z"/>
      <path fill="#ECB22E" d="M17.9 9.1a2 2 0 1 1 2 2h-2zM16.9 9.1a2 2 0 1 1-4 0v-5a2 2 0 1 1 4 0z"/>
      <path fill="#E01E5A" d="M14.9 17.9a2 2 0 1 1-2 2v-2zM14.9 16.9a2 2 0 1 1 0-4h5a2 2 0 1 1 0 4z"/>
    </svg>` },

  { id:"docker", name:"Docker", role:"Setup", note:"#2496ED",
    svg:`<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g fill="#2496ED">
        <rect x="2.6" y="11" width="2.5" height="2.4" rx=".3"/>
        <rect x="5.5" y="11" width="2.5" height="2.4" rx=".3"/>
        <rect x="8.4" y="11" width="2.5" height="2.4" rx=".3"/>
        <rect x="11.3" y="11" width="2.5" height="2.4" rx=".3"/>
        <rect x="5.5" y="8.2" width="2.5" height="2.4" rx=".3"/>
        <rect x="8.4" y="8.2" width="2.5" height="2.4" rx=".3"/>
        <rect x="8.4" y="5.4" width="2.5" height="2.4" rx=".3"/>
        <path d="M22.5 11.4c-.5-.35-1.7-.48-2.6-.3-.12-.85-.6-1.6-1.45-2.27l-.5-.33-.33.5c-.42.64-.56 1.7-.1 2.45.2.34.5.6.85.78-.3.16-.9.38-1.68.37H1.9c-.3 1.78.2 4.08 1.55 5.65 1.3 1.5 3.27 2.26 5.84 2.26 5.56 0 9.68-2.56 11.6-7.2.76.01 2.4.01 3.23-1.57.05-.09.18-.35.55-1.15z"/>
      </g>
    </svg>` },
];
