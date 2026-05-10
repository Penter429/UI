/* ============================================================
   canvas.js — Canvas rendering, drag/drop from palette, move, select, resize
   ============================================================ */

/* ── Table-family tags — rendered as divs with flex layout on canvas ── */
const TABLE_TAGS = ['table','thead','tbody','tfoot','tr','th','td','caption','colgroup','col'];

/* ── Child element reorder by dragging handle ── */
function startChildReorder(desc, wrapEl, startEvent) {
  const parentContent = wrapEl.parentElement; // parent's .canvas-rendered-el
  const siblingWraps = Array.from(parentContent.querySelectorAll(':scope > .el-wrapper'));

  const startY = startEvent.clientY;
  const startX = startEvent.clientX;
  let moved = false;

  // Visual feedback
  wrapEl.style.opacity = '0.5';
  wrapEl.style.zIndex = '100';
  wrapEl.style.pointerEvents = 'none';

  // Create insertion indicator
  const indicator = document.createElement('div');
  indicator.className = 'child-reorder-indicator';
  indicator.style.display = 'none';
  parentContent.appendChild(indicator);

  function onMove(ev) {
    moved = true;
    const dy = ev.clientY - startY;
    wrapEl.style.transform = 'translateY(' + dy + 'px)';

    // Find insertion point among siblings
    indicator.style.display = 'none';
    let placed = false;
    for (const sib of siblingWraps) {
      if (sib.dataset.uid === desc.uid) continue;
      const rect = sib.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (ev.clientY < midY) {
        sib.insertAdjacentElement('beforebegin', indicator);
        indicator.style.display = '';
        placed = true;
        break;
      }
    }
    if (!placed) {
      parentContent.appendChild(indicator);
      indicator.style.display = '';
    }
  }

  function onUp(ev) {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);

    wrapEl.style.opacity = '';
    wrapEl.style.transform = '';
    wrapEl.style.zIndex = '';
    wrapEl.style.pointerEvents = '';
    indicator.remove();

    if (!moved) return;

    // Determine new position
    let insertBeforeUid = null;
    for (const sib of siblingWraps) {
      if (sib.dataset.uid === desc.uid) continue;
      const rect = sib.getBoundingClientRect();
      if (ev.clientY < rect.top + rect.height / 2) {
        insertBeforeUid = sib.dataset.uid;
        break;
      }
    }

    // Remove from current position
    const idx = App.elements.findIndex(e => e.uid === desc.uid);
    App.elements.splice(idx, 1);

    // Insert at new position
    if (insertBeforeUid) {
      const targetIdx = App.elements.findIndex(e => e.uid === insertBeforeUid);
      App.elements.splice(targetIdx, 0, desc);
    } else {
      // Place after last sibling with same parent
      let lastIdx = -1;
      App.elements.forEach((e, i) => { if (e.parentUid === desc.parentUid) lastIdx = i; });
      App.elements.splice(lastIdx + 1, 0, desc);
    }

    pushHistory(); saveToStorage();
    refreshCanvas(); refreshLayers();
    selectElement(desc.uid);
    toast('Reordered', 'success');
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

/* ── Apply body styles to canvas ── */
function applyBodyStyles() {
  const canvas = document.getElementById('canvas');
  const b = App.body;
  canvas.style.backgroundColor = b.bg || '';
  canvas.style.color = b.color || '';
  canvas.style.fontFamily = b.fontFamily || '';
  canvas.style.fontSize = b.fontSize ? b.fontSize + 'px' : '';
  canvas.style.padding = b.padding || '';
  canvas.style.margin = b.margin || '';
  canvas.style.overflow = b.overflow || '';
}

/* ── Render one element onto the canvas ── */
function renderElToCanvas(desc, parentDom) {
  const wrap = document.createElement('div');
  wrap.className = 'el-wrapper' + (desc.parentUid ? ' is-child' : '');
  wrap.dataset.uid = desc.uid;
  if (TABLE_TAGS.includes(desc.tag)) wrap.dataset.tableEl = desc.tag;

  if (!desc.parentUid) {
    wrap.style.left = desc.x + 'px';
    wrap.style.top  = desc.y + 'px';
  }
  // Table child elements: rows=100% width, cells=pixel width, all=pixel height
  if (desc.parentUid && TABLE_TAGS.includes(desc.tag)) {
    if (['tr','thead','tbody','tfoot','caption'].includes(desc.tag)) {
      wrap.style.width = '100%';
    } else {
      // Cells (td/th): use stored pixel width so user can resize individually
      wrap.style.width = desc.w + 'px';
    }
    wrap.style.height = desc.h + 'px';
  } else {
    wrap.style.width  = desc.w + 'px';
    wrap.style.height = desc.h + 'px';
  }
  if (desc.zIndex) wrap.style.zIndex = desc.zIndex;

  // handle bar
  const handle = document.createElement('div');
  handle.className = 'el-handle';
  handle.textContent = '<' + desc.tag + '>' + (desc.elId ? ' #' + desc.elId : '');
  wrap.appendChild(handle);

  // content
  const content = document.createElement('div');
  content.className = 'el-content';

  const inner = createRenderedEl(desc);
  content.appendChild(inner);

  // render children inside
  childrenOf(desc.uid).forEach(ch => renderElToCanvas(ch, inner));

  wrap.appendChild(content);

  // resize handle
  const rh = document.createElement('div');
  rh.className = 'el-resize';
  wrap.appendChild(rh);

  parentDom.appendChild(wrap);

  // -- Events --
  // Select
  wrap.addEventListener('mousedown', e => {
    if (e.target.classList.contains('el-resize')) return;
    e.stopPropagation();
    selectElement(desc.uid);
  });

  // Move (root: absolute positioning, child: reorder among siblings)
  handle.addEventListener('mousedown', e => {
    if (desc.parentUid) {
      e.preventDefault(); e.stopPropagation();
      selectElement(desc.uid);
      startChildReorder(desc, wrap, e);
      return;
    }
    e.preventDefault(); e.stopPropagation();
    selectElement(desc.uid);
    const startX = e.clientX, startY = e.clientY;
    const origX = desc.x, origY = desc.y;
    function onMove(ev) {
      desc.x = Math.max(0, origX + ev.clientX - startX);
      desc.y = Math.max(0, origY + ev.clientY - startY);
      wrap.style.left = desc.x + 'px';
      wrap.style.top  = desc.y + 'px';
      syncPropsPosition();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      pushHistory();
      saveToStorage();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Resize
  rh.addEventListener('mousedown', e => {
    e.preventDefault(); e.stopPropagation();
    selectElement(desc.uid);
    const startX = e.clientX, startY = e.clientY;
    // Use actual rendered size as starting point (handles table flex sizing)
    const origW = wrap.offsetWidth;
    const origH = wrap.offsetHeight;
    function onMove(ev) {
      desc.w = Math.max(30, origW + ev.clientX - startX);
      desc.h = Math.max(16, origH + ev.clientY - startY);
      wrap.style.width  = desc.w + 'px';
      wrap.style.height = desc.h + 'px';
      syncPropsSize();
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      pushHistory();
      saveToStorage();
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Drop target for palette drag
  wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('drop-target'); });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('drop-target'));
  wrap.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation();
    wrap.classList.remove('drop-target');
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    try {
      const item = JSON.parse(data);
      const newDesc = createElDescriptor(item, 0, 0, desc.uid);
      App.elements.push(newDesc);
      pushHistory();
      saveToStorage();
      refreshCanvas();
      refreshLayers();
      selectElement(newDesc.uid);
      toast('Added <' + item.tag + '> inside <' + desc.tag + '>', 'success');
    } catch(ex) { console.error('Drop error:', ex); }
  });
}



/* ── Create the rendered HTML element from descriptor ── */
function createRenderedEl(desc) {
  const voidTags = ['img','input','br','hr','progress','meter'];
  let el;

  if (TABLE_TAGS.includes(desc.tag)) {
    // Render table tags as <div> with flex so they are visible on canvas
    el = document.createElement('div');
    el.dataset.tableTag = desc.tag; // remember real tag for styling

    if (desc.tag === 'table') {
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.border = '2px solid #6c63ff';
      el.style.background = desc.bg || 'rgba(26,30,46,.85)';
      el.style.borderRadius = '4px';
      el.style.overflow = 'visible';
    } else if (['thead','tbody','tfoot'].includes(desc.tag)) {
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.background = desc.bg || 'rgba(30,34,50,.6)';
      el.style.borderBottom = '1px solid #363c58';
      el.style.overflow = 'visible';
    } else if (desc.tag === 'tr') {
      el.style.display = 'flex';
      el.style.flexDirection = 'row';
      el.style.background = desc.bg || 'rgba(34,38,58,.5)';
      el.style.borderBottom = '1px solid #2a2f45';
      el.style.minHeight = '28px';
      el.style.overflow = 'visible';
    } else if (desc.tag === 'th') {
      el.style.flex = '1';
      el.style.padding = '4px 8px';
      el.style.border = '1px solid #363c58';
      el.style.fontWeight = '700';
      el.style.background = desc.bg || 'rgba(108,99,255,.12)';
      el.style.minHeight = '28px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
    } else if (desc.tag === 'td') {
      el.style.flex = '1';
      el.style.padding = '4px 8px';
      el.style.border = '1px solid #2a2f45';
      el.style.background = desc.bg || 'rgba(26,29,39,.6)';
      el.style.minHeight = '28px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
    } else if (desc.tag === 'caption') {
      el.style.padding = '6px 8px';
      el.style.fontWeight = '600';
      el.style.background = desc.bg || 'rgba(108,99,255,.08)';
      el.style.borderBottom = '1px solid #363c58';
    }

    if (desc.text) el.textContent = desc.text;
  } else if (voidTags.includes(desc.tag)) {
    el = document.createElement(desc.tag);
    if (desc.tag === 'img') { el.src = desc.src || 'https://placehold.co/200x150/1a1d27/6c63ff?text=Image'; el.alt = desc.alt || ''; }
    if (desc.tag === 'input') { el.type = desc.inputType || 'text'; el.placeholder = desc.placeholder || ''; }
    if (desc.tag === 'progress') { el.value = 60; el.max = 100; }
    if (desc.tag === 'meter') { el.value = 0.6; }
  } else {
    el = document.createElement(desc.tag);
    if (desc.text) el.textContent = desc.text;
  }
  if (desc.href && desc.tag === 'a') el.href = desc.href;
  if (desc.tag === 'iframe' && desc.src) el.src = desc.src;

  // apply custom attributes
  if (desc.customAttrs) {
    Object.entries(desc.customAttrs).forEach(([key, val]) => {
      try { el.setAttribute(key, val); } catch(e) { /* invalid attr name */ }
    });
  }

  el.className = 'canvas-rendered-el' + (TABLE_TAGS.includes(desc.tag) ? ' canvas-table-el' : '');
  if (TABLE_TAGS.includes(desc.tag)) {
    // Only apply text-level styles for table elements (don't override our flex layout / overflow / bg)
    applyTableTextStyles(el, desc);
  } else {
    applyDescStyles(el, desc);
  }
  return el;
}

/* ── Apply inline styles from descriptor ── */
function applyDescStyles(el, d) {
  const s = el.style;
  if (d.color) s.color = d.color;
  if (d.bg) s.backgroundColor = d.bg;
  if (d.borderColor) s.borderColor = d.borderColor;
  if (d.borderWidth) s.borderWidth = d.borderWidth + 'px';
  if (d.borderRadius) s.borderRadius = d.borderRadius + 'px';
  if (d.borderStyle) s.borderStyle = d.borderStyle;
  if (d.padding) s.padding = d.padding;
  if (d.margin) s.margin = d.margin;
  if (d.fontFamily) s.fontFamily = d.fontFamily;
  if (d.fontSize) s.fontSize = d.fontSize + 'px';
  if (d.fontWeight) s.fontWeight = d.fontWeight;
  // layout
  if (d.display) s.display = d.display;
  if (d.flexDirection) s.flexDirection = d.flexDirection;
  if (d.justifyContent) s.justifyContent = d.justifyContent;
  if (d.alignItems) s.alignItems = d.alignItems;
  if (d.flexWrap) s.flexWrap = d.flexWrap;
  if (d.gap) s.gap = d.gap;
  // advanced
  if (d.overflow) s.overflow = d.overflow;
  if (d.opacity !== '' && d.opacity !== undefined) s.opacity = d.opacity;
  if (d.cursor) s.cursor = d.cursor;
  if (d.position) s.position = d.position;

  s.boxSizing = 'border-box';
  // only force overflow hidden if no explicit overflow set
  if (!d.overflow) s.overflow = 'hidden';
}

/* ── Apply only text-level styles (for table elements on canvas) ── */
function applyTableTextStyles(el, d) {
  const s = el.style;
  if (d.color) s.color = d.color;
  if (d.fontFamily) s.fontFamily = d.fontFamily;
  if (d.fontSize) s.fontSize = d.fontSize + 'px';
  if (d.fontWeight) s.fontWeight = d.fontWeight;
  if (d.opacity !== '' && d.opacity !== undefined) s.opacity = d.opacity;
  if (d.cursor) s.cursor = d.cursor;
  s.boxSizing = 'border-box';
}

/* ── Full canvas refresh ── */
function refreshCanvas() {
  const canvas = document.getElementById('canvas');
  canvas.innerHTML = '';
  applyBodyStyles();
  // render root-level elements
  App.elements.filter(e => !e.parentUid).forEach(e => renderElToCanvas(e, canvas));
  // re-apply selection
  if (App.selected && App.selected !== '__body__') {
    const w = canvas.querySelector('[data-uid="' + App.selected + '"]');
    if (w) w.classList.add('selected');
  }
  reapplyHighlights();
}

/* ── Select element ── */
function selectElement(uid) {
  App.selected = uid;
  document.querySelectorAll('.el-wrapper.selected').forEach(w => w.classList.remove('selected'));
  document.querySelectorAll('.layer-node.selected').forEach(n => n.classList.remove('selected'));
  // deselect body node
  const bodyNode = document.querySelector('.layer-node[data-uid="__body__"]');
  if (bodyNode) bodyNode.classList.remove('selected');

  if (uid && uid !== '__body__') {
    const w = document.querySelector('[data-uid="' + uid + '"]');
    if (w) w.classList.add('selected');
    const ln = document.querySelector('.layer-node[data-uid="' + uid + '"]');
    if (ln) ln.classList.add('selected');
  } else if (uid === '__body__') {
    if (bodyNode) bodyNode.classList.add('selected');
  }
  refreshProps();
  if (App.pathActive || App.childActive) reapplyHighlights();
}

/* ── Highlight helpers ── */
function reapplyHighlights() {
  document.querySelectorAll('.el-wrapper.path-highlight, .el-wrapper.child-highlight').forEach(w => {
    w.classList.remove('path-highlight', 'child-highlight');
  });
  document.querySelectorAll('.layer-node.path-lit, .layer-node.child-lit').forEach(n => {
    n.classList.remove('path-lit', 'child-lit');
  });
  if (!App.selected || App.selected === '__body__') return;
  if (App.pathActive) {
    ancestors(App.selected).forEach(auid => {
      const w = document.querySelector('.el-wrapper[data-uid="' + auid + '"]');
      if (w) w.classList.add('path-highlight');
      const ln = document.querySelector('.layer-node[data-uid="' + auid + '"]');
      if (ln) ln.classList.add('path-lit');
    });
  }
  if (App.childActive) {
    const maxLv = parseInt(document.getElementById('max-level-input').value) || 3;
    descendants(App.selected, maxLv).forEach(duid => {
      const w = document.querySelector('.el-wrapper[data-uid="' + duid + '"]');
      if (w) w.classList.add('child-highlight');
      const ln = document.querySelector('.layer-node[data-uid="' + duid + '"]');
      if (ln) ln.classList.add('child-lit');
    });
  }
}

/* ── Canvas click (deselect or select body) ── */
document.getElementById('canvas-wrapper').addEventListener('mousedown', e => {
  // Select body when clicking on empty canvas area (not on any element)
  const target = e.target;
  if (target.id === 'canvas' || target.id === 'canvas-scroll' || target.id === 'canvas-wrapper') {
    selectElement('__body__');
  }
});

/* ── Canvas drop from palette (root-level) ── */
const canvasEl = document.getElementById('canvas');
canvasEl.addEventListener('dragover', e => e.preventDefault());
canvasEl.addEventListener('drop', e => {
  e.preventDefault();
  const data = e.dataTransfer.getData('text/plain');
  if (!data) return;
  try {
    const item = JSON.parse(data);
    const rect = canvasEl.getBoundingClientRect();
    const scroll = document.getElementById('canvas-scroll');
    const x = e.clientX - rect.left + scroll.scrollLeft;
    const y = e.clientY - rect.top + scroll.scrollTop;
    const desc = createElDescriptor(item, x, y, null);
    App.elements.push(desc);
    pushHistory();
    saveToStorage();
    refreshCanvas();
    refreshLayers();
    selectElement(desc.uid);
    toast('Added <' + item.tag + '>', 'success');
  } catch(ex) { console.error('Canvas drop error:', ex); }
});
