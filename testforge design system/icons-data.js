/* TestForge functional icons — 24x24 grid.
   default elements draw with inherited ink stroke / no fill.
   class "ac"  = accent stroke (indigo in B/C)
   class "acf" = accent fill (soft indigo in C only) */
window.TF_ICONS = {
  "1. Branding & Identity": [
    { id:"logo", name:"TestForge mark", sub:"logo / brand", was:"⚒️",
      svg:`<rect class="acf" x="3.5" y="6" width="13.5" height="3.4" rx="1.2"/>
           <path class="acf" d="M16.5 6.2 h3.6 c-.4 2.1 -2.1 3.2 -3.6 3.2 z"/>
           <rect x="9.6" y="9.4" width="3" height="2.6"/>
           <path class="acf" d="M5.4 18.4 c.6 -3.4 2.8 -5.2 6.1 -5.2 s5.5 1.8 6.1 5.2 z"/>
           <path class="ac" d="M3.5 18.6 h17"/>` },
  ],
  "2. Core Features": [
    { id:"manual", name:"Manual Testing", sub:"feature", was:"📝",
      svg:`<rect x="5" y="5" width="14" height="16" rx="2.2"/>
           <path class="acf" d="M9 4 h6 a1 1 0 0 1 1 1 v1.4 a1 1 0 0 1 -1 1 H9 a1 1 0 0 1 -1 -1 V5 a1 1 0 0 1 1 -1 z"/>
           <path class="ac" d="M8.5 13 l2 2 l4 -4.2"/>
           <path d="M8.5 18 h7"/>` },
    { id:"automation", name:"Automation", sub:"feature / runs", was:"🤖",
      svg:`<rect x="5" y="8.5" width="14" height="10.5" rx="2.6"/>
           <circle class="acf" cx="9.5" cy="13.5" r="1.25"/>
           <circle class="acf" cx="14.5" cy="13.5" r="1.25"/>
           <path d="M12 8.5 V5.4"/><circle cx="12" cy="4.3" r="1.2"/>
           <path d="M5 13.5 H3.3 M19 13.5 H20.7"/>
           <path class="ac" d="M9.7 16.4 h4.6"/>` },
    { id:"cicd", name:"CI/CD", sub:"feature", was:"🔁",
      svg:`<path d="M5.5 10.5 a7 7 0 0 1 11.6 -2.7"/>
           <path class="ac" d="M17.5 4.6 l.4 3.6 l-3.6 .4"/>
           <path d="M18.5 13.5 a7 7 0 0 1 -11.6 2.7"/>
           <path class="ac" d="M6.5 19.4 l-.4 -3.6 l3.6 -.4"/>` },
    { id:"dashboard", name:"Dashboard", sub:"feature / reports", was:"📊",
      svg:`<rect x="4" y="4" width="16" height="16" rx="2.4"/>
           <path d="M8.5 16 V12"/>
           <path class="ac" d="M12 16 V8.5"/>
           <path d="M15.5 16 V10.5"/>` },
  ],
  "4. Project Templates": [
    { id:"tpl-blank", name:"Blank", sub:"template", was:"📄",
      svg:`<path d="M7 3.5 h6.2 L18 8.3 V19 a1.6 1.6 0 0 1 -1.6 1.6 H7 A1.6 1.6 0 0 1 5.4 19 V5.1 A1.6 1.6 0 0 1 7 3.5 z"/>
           <path class="acf" d="M13 3.6 v4.2 a.8 .8 0 0 0 .8 .8 H18 z"/>` },
    { id:"tpl-web", name:"Web App", sub:"template", was:"🌐",
      svg:`<circle cx="12" cy="12" r="8"/>
           <path d="M4 12 h16"/>
           <path class="ac" d="M12 4 a12 12 0 0 1 0 16 a12 12 0 0 1 0 -16"/>` },
    { id:"tpl-mobile", name:"Mobile App", sub:"template", was:"📱",
      svg:`<rect x="7" y="3" width="10" height="18" rx="2.6"/>
           <path class="ac" d="M10.6 5.4 h2.8"/>
           <circle class="acf" cx="12" cy="18" r="0.7"/>` },
    { id:"tpl-api", name:"API Service", sub:"template", was:"🔌",
      svg:`<path d="M9.5 7.5 V4 M14.5 7.5 V4"/>
           <rect x="7.5" y="7.5" width="9" height="5.5" rx="1.4"/>
           <path class="ac" d="M12 13 v3.2 a3 3 0 0 1 -3 3 H7.4"/>` },
  ],
  "5. UI Actions": [
    { id:"edit", name:"Edit", sub:"action", was:"✏️",
      svg:`<path d="M4.2 19.8 l1.2 -4.3 L15.4 5.5 a1.6 1.6 0 0 1 2.2 0 l.9 .9 a1.6 1.6 0 0 1 0 2.2 L8.5 18.6 z"/>
           <path class="ac" d="M14 7 l3 3"/>` },
    { id:"clone", name:"Clone", sub:"action", was:"⧉",
      svg:`<rect x="8" y="8" width="11" height="11" rx="2.2"/>
           <path class="ac" d="M15.5 8 V6 a2 2 0 0 0 -2 -2 H6 a2 2 0 0 0 -2 2 v7.5 a2 2 0 0 0 2 2 h2"/>` },
    { id:"delete", name:"Delete", sub:"action", was:"🗑",
      svg:`<path d="M5 7 h14"/>
           <path d="M9 7 V5.6 a1.6 1.6 0 0 1 1.6 -1.6 h2.8 A1.6 1.6 0 0 1 15 5.6 V7"/>
           <path class="acf" d="M6.6 7 h10.8 l-.9 11.8 a1.6 1.6 0 0 1 -1.6 1.5 H9.1 a1.6 1.6 0 0 1 -1.6 -1.5 z"/>
           <path class="ac" d="M10.3 11 v5.4 M13.7 11 v5.4"/>` },
    { id:"valid", name:"Valid", sub:"status ok", was:"✓",
      svg:`<circle class="acf" cx="12" cy="12" r="8"/>
           <path class="ac" d="M8.4 12.2 l2.6 2.6 L16 9.4"/>` },
    { id:"invalid", name:"Invalid", sub:"status error", was:"✕",
      svg:`<circle cx="12" cy="12" r="8"/>
           <path class="ac" d="M9.3 9.3 l5.4 5.4 M14.7 9.3 l-5.4 5.4"/>` },
  ],
  "6. Navigation & Sidebar": [
    { id:"nav-projects", name:"Projects", sub:"nav", was:"📁",
      svg:`<path class="acf" d="M4 7.5 a2 2 0 0 1 2 -2 h3.3 l1.8 2 H18 a2 2 0 0 1 2 2 V17 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 z"/>` },
    { id:"nav-keys", name:"API Keys", sub:"nav", was:"🔑",
      svg:`<circle cx="8.5" cy="8.5" r="3.8"/>
           <path class="ac" d="M11.2 11.2 L19 19 M16.4 16.4 l1.8 -1.8 M14.2 14.2 l1.8 -1.8"/>` },
    { id:"nav-audit", name:"Audit Log", sub:"nav", was:"📜",
      svg:`<path d="M6 4.5 h8.5 a1.8 1.8 0 0 1 1.8 1.8 V17 a2.2 2.2 0 0 0 2.2 2.2 H8.4 A2.4 2.4 0 0 1 6 16.8 z"/>
           <path class="ac" d="M9 9 h5 M9 12.4 h5"/>` },
    { id:"nav-tree", name:"Suite / Tree", sub:"nav / folder tree", was:"📂",
      svg:`<rect class="acf" x="4" y="4" width="6" height="3.6" rx="1"/>
           <path d="M7 7.6 V17 M7 12 h4 M7 17 h4"/>
           <rect x="13" y="10.2" width="6" height="3.6" rx="1"/>
           <rect x="13" y="15.2" width="6" height="3.6" rx="1"/>` },
  ],
  "7. Import / Export": [
    { id:"import", name:"Import CSV", sub:"import", was:"📥",
      svg:`<path d="M5 15 v2.5 a1.5 1.5 0 0 0 1.5 1.5 h11 a1.5 1.5 0 0 0 1.5 -1.5 V15"/>
           <path class="ac" d="M12 4 V14 M8.4 10.4 L12 14 l3.6 -3.6"/>` },
    { id:"download", name:"Download", sub:"export", was:"↓",
      svg:`<path class="ac" d="M12 4 V15.5 M7.6 11.1 L12 15.5 l4.4 -4.4"/>
           <path d="M5.5 19.5 h13"/>` },
    { id:"upload", name:"Upload", sub:"upload", was:"↑",
      svg:`<path class="ac" d="M12 15.5 V4 M7.6 8.4 L12 4 l4.4 4.4"/>
           <path d="M5.5 19.5 h13"/>` },
  ],
  "8. Communication": [
    { id:"mailbox", name:"Verify Email", sub:"mailbox", was:"📬",
      svg:`<rect x="4" y="6" width="16" height="12" rx="2.2"/>
           <path class="ac" d="M4.6 8 L12 13 l7.4 -5"/>` },
  ],
  "9. Analytics & Reports": [
    { id:"trend", name:"Trend Chart", sub:"report", was:"📈",
      svg:`<path d="M4.5 4 V19.5 H20"/>
           <path class="ac" d="M7 15.5 l3 -3 l3 1.8 l4.5 -5.3"/>
           <path class="ac" d="M14.5 7.8 h3.5 v3.5"/>` },
    { id:"flaky", name:"Flaky Tests", sub:"report", was:"🎲",
      svg:`<rect x="5" y="5" width="14" height="14" rx="3.2"/>
           <circle class="acf" cx="9" cy="9" r="1.05"/>
           <circle class="acf" cx="12" cy="12" r="1.05"/>
           <circle class="acf" cx="15" cy="15" r="1.05"/>` },
    { id:"bug", name:"Bug Correlation", sub:"report", was:"🐛",
      svg:`<path d="M9.5 6 l1.4 2 M14.5 6 l-1.4 2"/>
           <circle cx="12" cy="9" r="2"/>
           <path class="acf" d="M7 13.5 a5 5.5 0 0 1 10 0 a5 5.5 0 0 1 -10 0 z"/>
           <path d="M12 11.2 V19"/>
           <path class="ac" d="M7 12.5 H4 M7 15 H4.3 M7.4 17.6 H5 M17 12.5 h3 M17 15 h2.7 M16.6 17.6 h2.4"/>` },
    { id:"breakdown", name:"Data Breakdown", sub:"report", was:"📋",
      svg:`<rect x="4" y="5" width="16" height="14" rx="2.2"/>
           <path class="acf" d="M4.6 5.6 h14.8 v3.4 H4.6 z"/>
           <path d="M4 9 h16 M12 9 V19"/>` },
  ],
  "10. Milestones & Goals": [
    { id:"target", name:"Milestone", sub:"goal / target", was:"🎯",
      svg:`<circle cx="12" cy="12" r="8"/>
           <circle cx="12" cy="12" r="4.6"/>
           <circle class="acf" cx="12" cy="12" r="1.4"/>` },
  ],
  "11. Social Proof": [
    { id:"stars", name:"GitHub Stars", sub:"social proof", was:"⭐",
      svg:`<path class="acf" d="M12 3.8 l2.42 4.9 l5.4 .79 l-3.91 3.8 l.92 5.38 l-4.83 -2.54 l-4.83 2.54 l.92 -5.38 l-3.91 -3.8 l5.4 -.79 z"/>` },
    { id:"frameworks", name:"Test Frameworks", sub:"social proof", was:"🧪",
      svg:`<path d="M9.5 3.5 h5 M10.5 3.5 V10 L6.6 16.8 a2 2 0 0 0 1.8 3 h7.2 a2 2 0 0 0 1.8 -3 L13.5 10 V3.5"/>
           <path class="acf" d="M8 15 h8 l1.4 2.4 a2 2 0 0 1 -1.8 2.6 H8.4 a2 2 0 0 1 -1.8 -2.6 z"/>
           <circle class="ac" cx="11" cy="17.5" r="0.7"/>` },
    { id:"geo", name:"Geographic", sub:"social proof", was:"🌏",
      svg:`<path class="acf" d="M12 3.5 a6 6 0 0 1 6 6 c0 4.4 -6 11 -6 11 s-6 -6.6 -6 -11 a6 6 0 0 1 6 -6 z"/>
           <circle class="ac" cx="12" cy="9.5" r="2.2"/>` },
    { id:"docker-setup", name:"Docker Setup", sub:"social proof", was:"🐳",
      svg:`<rect x="5" y="11" width="3" height="3" rx=".5"/>
           <rect x="8.5" y="11" width="3" height="3" rx=".5"/>
           <rect x="12" y="11" width="3" height="3" rx=".5"/>
           <rect class="acf" x="8.5" y="7.5" width="3" height="3" rx=".5"/>
           <path class="ac" d="M4 14.5 h13 a4 4 0 0 0 3.8 -3 a2.4 2.4 0 0 0 -3.4 .4 a3 3 0 0 0 -2 -3 a3.2 3.2 0 0 0 -.4 3 M5 18.5 c3.5 1.6 9.5 1.4 12 -2.5"/>` },
    { id:"checklist", name:"Task Checklist", sub:"onboarding", was:"☑️",
      svg:`<rect x="4" y="4" width="16" height="16" rx="3.4"/>
           <path class="ac" d="M8 12.2 l2.6 2.6 L16.2 9"/>` },
  ],
  "12. Success / Status": [
    { id:"celebrate", name:"Onboarding Complete", sub:"success", was:"🎉",
      svg:`<path class="acf" d="M4 20 L8.6 8.4 a1 1 0 0 1 1.6 -.35 l5.7 5.7 a1 1 0 0 1 -.35 1.6 z"/>
           <path class="ac" d="M16.5 4 v2.4 M19.8 7.2 l-1.7 1.7 M20.5 11.5 h-2.4"/>
           <circle class="ac" cx="13.5" cy="5.5" r="0.6"/>
           <circle class="ac" cx="19.5" cy="13" r="0.6"/>` },
  ],
};
