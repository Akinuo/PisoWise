// src/components/common/CategoryIcon.jsx
// Premium SVG icon set for all transaction categories — zero emojis

function renderIcon(id, p, color) {
  switch (id) {

    // ── Expense ────────────────────────────────────────────────────────────

    case 'food': return (
      <>
        <path {...p} d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/>
        <path {...p} d="M7 2v20"/>
        <path {...p} d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3"/>
        <path {...p} d="M21 15v7"/>
      </>
    );

    case 'transport': return (
      <>
        <path {...p} d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2"/>
        <circle cx="14" cy="17" r="2" stroke={color} strokeWidth="1.75" fill="none"/>
        <circle cx="6" cy="17" r="2" stroke={color} strokeWidth="1.75" fill="none"/>
        <path {...p} d="M12 5h4l2 4H12V5z"/>
      </>
    );

    case 'utilities': return (
      <path {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    );

    case 'rent': return (
      <>
        <path {...p} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline {...p} points="9 22 9 12 15 12 15 22"/>
      </>
    );

    case 'health': return (
      <path {...p} d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    );

    case 'education': return (
      <>
        <path {...p} d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
        <path {...p} d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
      </>
    );

    case 'clothing': return (
      <path {...p} d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>
    );

    case 'load': return (
      <>
        <path {...p} d="M5 12.55a11 11 0 0114.08 0"/>
        <path {...p} d="M1.42 9a16 16 0 0121.16 0"/>
        <path {...p} d="M8.53 16.11a6 6 0 016.95 0"/>
        <circle cx="12" cy="20" r="1.2" fill={color} stroke="none"/>
      </>
    );

    case 'debt': return (
      <>
        <rect {...p} x="2" y="5" width="20" height="14" rx="2"/>
        <path {...p} d="M2 10h20"/>
        <path {...p} d="M6 15h4M14 15h2"/>
      </>
    );

    case 'grocery': return (
      <>
        <path {...p} d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <path {...p} d="M3 6h18"/>
        <path {...p} d="M16 10a4 4 0 01-8 0"/>
      </>
    );

    case 'sari_sari': return (
      <>
        <path {...p} d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <circle cx="7.5" cy="7.5" r="1.2" fill={color} stroke="none"/>
      </>
    );

    case 'remittance': return (
      <path {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    );

    case 'savings': return (
      <>
        <ellipse {...p} cx="12" cy="7" rx="9" ry="4"/>
        <path {...p} d="M3 7v4c0 2.21 4.03 4 9 4s9-1.79 9-4V7"/>
        <path {...p} d="M3 11v4c0 2.21 4.03 4 9 4s9-1.79 9-4v-4"/>
      </>
    );

    case 'insurance': return (
      <>
        <path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path {...p} d="M9 12l2 2 4-4"/>
      </>
    );

    case 'personal': return (
      <>
        <path {...p} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle {...p} cx="12" cy="7" r="4"/>
      </>
    );

    // ── Income ─────────────────────────────────────────────────────────────

    case 'salary': return (
      <>
        <rect {...p} x="2" y="7" width="20" height="14" rx="2"/>
        <path {...p} d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
        <path {...p} d="M2 13h20"/>
      </>
    );

    case 'business': return (
      <>
        <path {...p} d="M3 21h18"/>
        <path {...p} d="M5 21V7l7-4 7 4v14"/>
        <path {...p} d="M9 21v-4h6v4"/>
      </>
    );

    case 'freelance': return (
      <>
        <rect {...p} x="2" y="3" width="20" height="14" rx="2"/>
        <path {...p} d="M8 21h8M12 17v4"/>
      </>
    );

    case 'farming': return (
      <>
        <path {...p} d="M12 22V12"/>
        <path {...p} d="M12 12C12 7 17 2 22 2c0 5-5 10-10 10z"/>
        <path {...p} d="M12 12C12 7 7 2 2 2c0 5 5 10 10 10z"/>
      </>
    );

    case '13th_month': return (
      <>
        <polyline {...p} points="20 12 20 22 4 22 4 12"/>
        <rect {...p} x="2" y="7" width="20" height="5"/>
        <line {...p} x1="12" y1="22" x2="12" y2="7"/>
        <path {...p} d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
        <path {...p} d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
      </>
    );

    case 'bonus': return (
      <polygon {...p} points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    );

    case 'allowance': return (
      <>
        <path {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline {...p} points="22,6 12,13 2,6"/>
      </>
    );

    case 'rental': return (
      <>
        <circle {...p} cx="8" cy="9" r="4"/>
        <path {...p} d="M12 9h10M16 13l4-4-4-4"/>
        <path {...p} d="M8 13v6M5 16h6"/>
      </>
    );

    case 'ofw': return (
      <path {...p} d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 21 4s-2 0-3.5 1.5L14 9 5.8 7.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 3.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    );

    case 'government': return (
      <>
        <line {...p} x1="3" y1="22" x2="21" y2="22"/>
        <line {...p} x1="6" y1="11" x2="6" y2="22"/>
        <line {...p} x1="10" y1="11" x2="10" y2="22"/>
        <line {...p} x1="14" y1="11" x2="14" y2="22"/>
        <line {...p} x1="18" y1="11" x2="18" y2="22"/>
        <path {...p} d="M4 11h16M4 8h16"/>
        <path {...p} d="M12 2L4 8h16z"/>
      </>
    );

    // ── Fallback ───────────────────────────────────────────────────────────
    default: return (
      <>
        <circle cx="12" cy="12" r="1.5" fill={color} stroke="none"/>
        <circle cx="19" cy="12" r="1.5" fill={color} stroke="none"/>
        <circle cx="5"  cy="12" r="1.5" fill={color} stroke="none"/>
      </>
    );
  }
}

export default function CategoryIcon({ id, color = '#ffffff', size = 20 }) {
  const p = {
    fill:           'none',
    stroke:         color,
    strokeWidth:    '1.75',
    strokeLinecap:  'round',
    strokeLinejoin: 'round',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {renderIcon(id, p, color)}
    </svg>
  );
}
