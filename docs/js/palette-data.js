/* ============================================================
   palette-data.js — Element registry for the palette
   ============================================================ */
window.PALETTE = [
  { cat: 'Structure', icon: '▦', items: [
    { tag: 'div',     label: 'div',     w: 200, h: 100, bg: '#1e2130' },
    { tag: 'section', label: 'section', w: 300, h: 150, bg: '#1a1e2e' },
    { tag: 'article', label: 'article', w: 280, h: 140, bg: '#1a1e2e' },
    { tag: 'header',  label: 'header',  w: 300, h: 60,  bg: '#1e2236' },
    { tag: 'footer',  label: 'footer',  w: 300, h: 60,  bg: '#1e2236' },
    { tag: 'nav',     label: 'nav',     w: 250, h: 50,  bg: '#1c2032' },
    { tag: 'main',    label: 'main',    w: 400, h: 250, bg: '#171a24' },
    { tag: 'aside',   label: 'aside',   w: 180, h: 200, bg: '#1b1f2e' },
  ]},
  { cat: 'Text', icon: 'T', items: [
    { tag: 'h1', label: 'h1', w: 250, h: 44, text: 'Heading 1', fs: 32, fw: 700 },
    { tag: 'h2', label: 'h2', w: 220, h: 36, text: 'Heading 2', fs: 26, fw: 700 },
    { tag: 'h3', label: 'h3', w: 200, h: 30, text: 'Heading 3', fs: 22, fw: 600 },
    { tag: 'h4', label: 'h4', w: 180, h: 26, text: 'Heading 4', fs: 18, fw: 600 },
    { tag: 'h5', label: 'h5', w: 160, h: 22, text: 'Heading 5', fs: 16, fw: 600 },
    { tag: 'h6', label: 'h6', w: 150, h: 20, text: 'Heading 6', fs: 14, fw: 600 },
    { tag: 'p',    label: 'p',    w: 250, h: 40, text: 'Paragraph text' },
    { tag: 'span', label: 'span', w: 100, h: 24, text: 'Span' },
    { tag: 'label', label: 'label', w: 100, h: 24, text: 'Label' },
    { tag: 'blockquote', label: 'blockquote', w: 260, h: 60, text: 'Quote text', bg: '#1a1e2e' },
    { tag: 'pre',  label: 'pre',  w: 260, h: 60, text: 'preformatted', ff: 'monospace' },
    { tag: 'code', label: 'code', w: 120, h: 24, text: 'code()', ff: 'monospace', fs: 12 },
  ]},
  { cat: 'Media', icon: '🖼', items: [
    { tag: 'img',    label: 'img',    w: 200, h: 150, src: 'https://placehold.co/200x150/1a1d27/6c63ff?text=Image' },
    { tag: 'video',  label: 'video',  w: 320, h: 180, bg: '#0e1018' },
    { tag: 'audio',  label: 'audio',  w: 300, h: 40 },
    { tag: 'canvas', label: 'canvas', w: 200, h: 150, bg: '#0e1018' },
    { tag: 'svg',    label: 'svg',    w: 100, h: 100, bg: '#0e1018' },
    { tag: 'iframe', label: 'iframe', w: 320, h: 200, bg: '#0e1018' },
  ]},
  { cat: 'Form', icon: '⬜', items: [
    { tag: 'form',     label: 'form',     w: 280, h: 200, bg: '#1a1e2e' },
    { tag: 'input',    label: 'input',    w: 200, h: 34, inputType: 'text' },
    { tag: 'textarea', label: 'textarea', w: 240, h: 80 },
    { tag: 'button',   label: 'button',   w: 120, h: 38, text: 'Button', bg: '#6c63ff', color: '#fff' },
    { tag: 'select',   label: 'select',   w: 160, h: 34 },
    { tag: 'option',   label: 'option',   w: 120, h: 24, text: 'Option' },
  ]},
  { cat: 'Table', icon: '⊞', items: [
    { tag: 'table', label: 'table', w: 300, h: 120, bg: '#1a1e2e' },
    { tag: 'thead', label: 'thead', w: 300, h: 30, bg: '#22263a' },
    { tag: 'tbody', label: 'tbody', w: 300, h: 80 },
    { tag: 'tr',    label: 'tr',    w: 300, h: 30 },
    { tag: 'th',    label: 'th',    w: 100, h: 30, text: 'Header', fw: 700 },
    { tag: 'td',    label: 'td',    w: 100, h: 30, text: 'Cell' },
  ]},
  { cat: 'Lists', icon: '☰', items: [
    { tag: 'ul', label: 'ul', w: 200, h: 80 },
    { tag: 'ol', label: 'ol', w: 200, h: 80 },
    { tag: 'li', label: 'li', w: 180, h: 28, text: 'List item' },
  ]},
  { cat: 'Link & Inline', icon: '🔗', items: [
    { tag: 'a',  label: 'a',  w: 100, h: 24, text: 'Link', href: '#', color: '#6c63ff' },
    { tag: 'hr', label: 'hr', w: 300, h: 4 },
    { tag: 'br', label: 'br', w: 40,  h: 16 },
    { tag: 'strong', label: 'strong', w: 80, h: 24, text: 'Bold', fw: 700 },
    { tag: 'em',     label: 'em',     w: 60, h: 24, text: 'Italic' },
    { tag: 'small',  label: 'small',  w: 60, h: 20, text: 'Small', fs: 11 },
    { tag: 'mark',   label: 'mark',   w: 60, h: 24, text: 'Marked', bg: '#ffeb3b', color: '#000' },
    { tag: 'del',    label: 'del',    w: 80, h: 24, text: 'Deleted' },
    { tag: 'sub',    label: 'sub',    w: 40, h: 20, text: 'sub' },
    { tag: 'sup',    label: 'sup',    w: 40, h: 20, text: 'sup' },
  ]},
  { cat: 'Semantic', icon: '◈', items: [
    { tag: 'figure',     label: 'figure',     w: 220, h: 170, bg: '#1a1e2e' },
    { tag: 'figcaption', label: 'figcaption', w: 200, h: 28, text: 'Caption' },
    { tag: 'details',    label: 'details',    w: 240, h: 60, text: 'Details content' },
    { tag: 'summary',    label: 'summary',    w: 220, h: 28, text: 'Click to expand' },
    { tag: 'dialog',     label: 'dialog',     w: 260, h: 160, bg: '#22263a' },
    { tag: 'progress',   label: 'progress',   w: 200, h: 24 },
    { tag: 'meter',      label: 'meter',      w: 200, h: 24 },
    { tag: 'time',       label: 'time',       w: 120, h: 24, text: '2026-01-01' },
    { tag: 'abbr',       label: 'abbr',       w: 60,  h: 24, text: 'HTML' },
    { tag: 'address',    label: 'address',    w: 220, h: 40, text: 'Address' },
  ]},
];

/* flat list of all tag names for the tag selector */
window.ALL_TAGS = [];
PALETTE.forEach(c => c.items.forEach(it => {
  if (!ALL_TAGS.includes(it.tag)) ALL_TAGS.push(it.tag);
}));
