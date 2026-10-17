const ICONS = (() => {
  const s = p => `<svg viewBox="0 0 24 24">${p}</svg>`;
  return {
    folder: s('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    undo: s('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    redo: s('<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
    download: s('<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>'),
    bold: s('<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>'),
    italic: s('<path d="M10 5h8M6 19h8M15 5l-6 14"/>'),
    underline: s('<path d="M7 4v7a5 5 0 0 0 10 0V4M5 21h14"/>'),
    strike: s('<path d="M4 12h16M16 7c-.5-1.7-2.2-2.5-4-2.5-2.3 0-4 1.2-4 3 0 1.5 1 2.2 4 3M8 17c.6 1.6 2.3 2.5 4.2 2.5 2.3 0 4-1.200 4-3"/>'),
    textcolor: s('<path d="m6 16 6-12 6 12M8.500 12h7"/><path d="M5 21h14" stroke="#c00000" stroke-width="3"/>'),
    marker: s('<path d="m14 4 6 6-8 8H6v-6z"/><path d="M4 21h16" stroke="#e6c800" stroke-width="3"/>'),
    alignL: s('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),
    alignC: s('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'),
    alignR: s('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'),
    alignJ: s('<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>'),
    ul: s('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.500" cy="6" r="1"/><circle cx="4.500" cy="12" r="1"/><circle cx="4.500" cy="18" r="1"/>'),
    ol: s('<path d="M10 6h10M10 12h10M10 18h10M4 5l1-1v4M4 14h2l-2 3h2"/>'),
    indent: s('<path d="M4 6h16M12 10h8M12 14h8M4 18h16M4 9l3 3-3 3"/>'),
    outdent: s('<path d="M4 6h16M12 10h8M12 14h8M4 18h16M7 9l-3 3 3 3"/>'),
    table: s('<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>'),
    image: s('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.500"/><path d="m4 18 5-5 4 4 3-3 4 4"/>'),
    link: s('<path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1"/><path d="M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1"/>'),
    hr: s('<path d="M3 12h18"/>'),
    pagebreak: s('<path d="M6 3h12v6M6 21h12v-6M3 12h3M9 12h2M13 12h2M18 12h3"/>'),
    find: s('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.500-4.500"/>'),
    print: s('<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6"/>'),
    close: s('<path d="M6 6l12 12M18 6 6 18"/>')
  };
})();
Object.assign(ICONS, {
  sup: '<svg viewBox="0 0 24 24"><path d="m4 19 8-9M12 19 4 10"/><path d="M16 8c0-1 .8-2 2-2s2 .8 2 1.800c0 1.500-4 2.200-4 4.200h4"/></svg>',
  sub: '<svg viewBox="0 0 24 24"><path d="m4 5 8 9M12 5l-8 9"/><path d="M16 17c0-1 .8-2 2-2s2 .8 2 1.800c0 1.500-4 2.200-4 4.200h4"/></svg>',
  clear: '<svg viewBox="0 0 24 24"><path d="m7 21-4-4 10-12 7 7-8 9z"/><path d="M7 21h13"/></svg>',
  rtl: '<svg viewBox="0 0 24 24"><path d="M10 4h8M14 4v10M18 4v10M10 4a4 4 0 0 0 0 8h4"/><path d="M5 18h14M8 15l-3 3 3 3"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 16v-5M9.500 13.500 12 11l2.500 2.500"/></svg>'
});
