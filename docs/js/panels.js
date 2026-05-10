/* ============================================================
   panels.js — Palette, Layers, Properties, Toolbar buttons
   ============================================================ */

/* ═══════════════ PALETTE ═══════════════ */
function buildPalette() {
  const list = document.getElementById('palette-list');
  list.innerHTML = '';
  PALETTE.forEach(cat => {
    const sec = document.createElement('div');
    sec.className = 'palette-category';
    const hdr = document.createElement('div');
    hdr.className = 'palette-cat-header';
    hdr.innerHTML = '<span class="arrow">▼</span> ' + cat.icon + ' ' + cat.cat;
    sec.appendChild(hdr);
    const items = document.createElement('div');
    items.className = 'palette-items';
    cat.items.forEach(it => {
      const d = document.createElement('div');
      d.className = 'palette-item';
      d.draggable = true;
      d.innerHTML = '<span class="pi-icon">' + cat.icon + '</span><span class="pi-tag">&lt;' + it.tag + '&gt;</span>';
      d.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', JSON.stringify(it));
        const ghost = document.getElementById('drag-ghost');
        ghost.textContent = '<' + it.tag + '>';
        ghost.style.display = 'block';
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => ghost.style.display = 'none', 0);
      });
      // double-click to add at viewport center
      d.addEventListener('dblclick', () => {
        const scroll = document.getElementById('canvas-scroll');
        const cx = scroll.scrollLeft + scroll.clientWidth / 2 - (it.w || 120) / 2;
        const cy = scroll.scrollTop + scroll.clientHeight / 2 - (it.h || 40) / 2;
        const desc = createElDescriptor(it, Math.max(20, cx), Math.max(20, cy), null);
        App.elements.push(desc);
        pushHistory(); saveToStorage();
        refreshCanvas();
        refreshLayers();
        selectElement(desc.uid);
        toast('Added <' + it.tag + '>');
      });
      items.appendChild(d);
    });
    sec.appendChild(items);
    // collapse toggle
    hdr.addEventListener('click', () => {
      hdr.classList.toggle('collapsed');
      items.classList.toggle('hidden');
    });
    list.appendChild(sec);
  });
}

/* palette search */
document.getElementById('palette-search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.palette-category').forEach(cat => {
    let anyVisible = false;
    cat.querySelectorAll('.palette-item').forEach(pi => {
      const show = pi.textContent.toLowerCase().includes(q);
      pi.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    cat.style.display = anyVisible ? '' : 'none';
  });
});

/* ═══════════════ TABS ═══════════════ */
document.querySelectorAll('.panel-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel-pane').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('pane-' + tab.dataset.pane).classList.add('active');
  });
});

/* ═══════════════ LAYERS ═══════════════ */
function refreshLayers() {
  const container = document.getElementById('layers-container');
  container.innerHTML = '';

  // Body node (always shown)
  const bodyNode = document.createElement('div');
  bodyNode.className = 'layer-node layer-body-node' + (App.selected === '__body__' ? ' selected' : '');
  bodyNode.dataset.uid = '__body__';
  bodyNode.style.paddingLeft = '8px';
  bodyNode.innerHTML = '<span class="layer-toggle">▼</span>' +
    '<span class="layer-tag">&lt;body&gt;</span>' +
    '<span class="layer-id-label" style="color:var(--orange)">root</span>';
  bodyNode.addEventListener('click', () => selectElement('__body__'));
  // body is drop target for reparenting to root
  bodyNode.addEventListener('dragover', e => { e.preventDefault(); bodyNode.classList.add('drop-target'); });
  bodyNode.addEventListener('dragleave', () => bodyNode.classList.remove('drop-target'));
  bodyNode.addEventListener('drop', e => {
    e.preventDefault(); bodyNode.classList.remove('drop-target');
    const dragUid = e.dataTransfer.getData('application/layer-uid');
    if (!dragUid) return;
    const d = findEl(dragUid);
    if (d && d.parentUid) { d.parentUid = null; d.x = 60; d.y = 60; pushHistory(); saveToStorage(); refreshCanvas(); refreshLayers(); }
  });
  container.appendChild(bodyNode);

  if (App.elements.length === 0) {
    container.innerHTML += '<p class="layer-empty">No elements yet.<br/>Add from Elements tab.</p>';
    return;
  }

  function renderNode(uid, depth) {
    const desc = findEl(uid);
    if (!desc) return;
    const node = document.createElement('div');
    node.className = 'layer-node' + (App.selected === uid ? ' selected' : '');
    node.dataset.uid = uid;
    node.draggable = true;
    node.style.paddingLeft = (8 + (depth + 1) * 14) + 'px';
    const kids = childrenOf(uid);
    let toggleHtml = '<span class="layer-toggle">' + (kids.length ? '▼' : '·') + '</span>';
    const idLabel = desc.elId ? '#' + desc.elId : (desc.elClass ? '.' + desc.elClass.split(' ')[0] : '');
    node.innerHTML = toggleHtml +
      '<span class="layer-tag">&lt;' + desc.tag + '&gt;</span>' +
      '<span class="layer-id-label">' + idLabel + '</span>' +
      '<span class="layer-actions">' +
        '<button class="layer-act-btn" data-act="dup" title="Duplicate">⧉</button>' +
        '<button class="layer-act-btn" data-act="del" title="Delete">✕</button>' +
      '</span>';
    node.addEventListener('click', e => {
      if (e.target.dataset.act === 'del') {
        removeEl(uid); pushHistory(); saveToStorage(); refreshCanvas(); refreshLayers(); refreshProps(); return;
      }
      if (e.target.dataset.act === 'dup') {
        const newUid = duplicateEl(uid); pushHistory(); saveToStorage(); refreshCanvas(); refreshLayers(); selectElement(newUid); toast('Duplicated'); return;
      }
      selectElement(uid);
    });
    // layer drag start
    node.addEventListener('dragstart', e => {
      e.stopPropagation();
      e.dataTransfer.setData('application/layer-uid', uid);
      e.dataTransfer.effectAllowed = 'move';
    });
    // layer drop target (reparent into this element)
    node.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); node.classList.add('drop-target'); });
    node.addEventListener('dragleave', () => node.classList.remove('drop-target'));
    node.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation(); node.classList.remove('drop-target');
      const dragUid = e.dataTransfer.getData('application/layer-uid');
      if (!dragUid || dragUid === uid) return;
      // prevent dropping parent into own child
      if (descendants(dragUid, 999).includes(uid)) { toast('Cannot move into own child', 'warn'); return; }
      const d = findEl(dragUid);
      if (d) { d.parentUid = uid; pushHistory(); saveToStorage(); refreshCanvas(); refreshLayers(); toast('Moved into <' + desc.tag + '>', 'success'); }
    });
    container.appendChild(node);
    kids.forEach(ch => renderNode(ch.uid, depth + 1));
  }
  App.elements.filter(e => !e.parentUid).forEach(e => renderNode(e.uid, 0));
}

/* ═══════════════ PROPERTIES ═══════════════ */
function refreshProps() {
  const empty = document.getElementById('props-empty');
  const content = document.getElementById('props-content');
  const badge = document.getElementById('props-tag-badge');
  const bodySection = document.getElementById('body-props-section');
  const elSections = document.querySelectorAll('.prop-section.el-only');

  if (!App.selected) {
    empty.style.display = '';
    content.style.display = 'none';
    badge.style.display = 'none';
    return;
  }

  // Body selected
  if (App.selected === '__body__') {
    empty.style.display = 'none';
    content.style.display = '';
    badge.style.display = '';
    badge.textContent = '<body>';
    elSections.forEach(s => s.style.display = 'none');
    if (bodySection) {
      bodySection.style.display = '';
      document.getElementById('body-bg-color').value = App.body.bg || '#0a0c12';
      document.getElementById('body-bg-text').value = App.body.bg || '';
      document.getElementById('body-color').value = App.body.color || '#e8eaf6';
      document.getElementById('body-color-text').value = App.body.color || '';
      document.getElementById('body-font-family').value = App.body.fontFamily || '';
      document.getElementById('body-padding').value = App.body.padding || '';
    }
    return;
  }

  // Normal element selected
  if (bodySection) bodySection.style.display = 'none';
  elSections.forEach(s => s.style.display = '');

  empty.style.display = 'none';
  content.style.display = '';
  const d = findEl(App.selected);
  if (!d) return;
  badge.style.display = '';
  badge.textContent = '<' + d.tag + '>';

  // tag select
  const tagSel = document.getElementById('prop-tag');
  tagSel.innerHTML = '';
  ALL_TAGS.forEach(t => {
    const o = document.createElement('option');
    o.value = t; o.textContent = '<' + t + '>';
    if (t === d.tag) o.selected = true;
    tagSel.appendChild(o);
  });

  document.getElementById('prop-id').value = d.elId;
  document.getElementById('prop-class').value = d.elClass;

  // parent select
  const parentSel = document.getElementById('prop-parent');
  parentSel.innerHTML = '<option value="">(root / canvas)</option>';
  App.elements.forEach(el => {
    if (el.uid === d.uid) return;
    // skip descendants of this element
    if (descendants(d.uid, 999).includes(el.uid)) return;
    const o = document.createElement('option');
    o.value = el.uid;
    o.textContent = '<' + el.tag + '>' + (el.elId ? ' #' + el.elId : '') + ' [' + el.uid + ']';
    if (el.uid === d.parentUid) o.selected = true;
    parentSel.appendChild(o);
  });

  document.getElementById('prop-text').value = d.text;

  // conditional rows
  const hasSrc = ['img','video','audio','iframe','source'].includes(d.tag);
  const hasHref = ['a'].includes(d.tag);
  const hasAlt = ['img'].includes(d.tag);
  const hasPlaceholder = ['input','textarea'].includes(d.tag);
  const hasType = ['input','button'].includes(d.tag);
  document.getElementById('row-src').style.display = hasSrc ? '' : 'none';
  document.getElementById('row-href').style.display = hasHref ? '' : 'none';
  document.getElementById('row-alt').style.display = hasAlt ? '' : 'none';
  document.getElementById('row-placeholder').style.display = hasPlaceholder ? '' : 'none';
  document.getElementById('row-type').style.display = hasType ? '' : 'none';

  if (hasSrc) document.getElementById('prop-src').value = d.src;
  if (hasHref) document.getElementById('prop-href').value = d.href;
  if (hasAlt) document.getElementById('prop-alt').value = d.alt;
  if (hasPlaceholder) document.getElementById('prop-placeholder').value = d.placeholder;
  if (hasType) document.getElementById('prop-type').value = d.inputType;

  // colors
  document.getElementById('prop-color').value = d.color || '#e8eaf6';
  document.getElementById('prop-color-text').value = d.color || '';
  document.getElementById('prop-bg-color').value = d.bg || '#1a1d27';
  document.getElementById('prop-bg-text').value = d.bg || '';
  document.getElementById('prop-border-color').value = d.borderColor || '#363c58';
  document.getElementById('prop-border-text').value = d.borderColor || '';

  // size & pos
  document.getElementById('prop-width').value = d.w;
  document.getElementById('prop-height').value = d.h;
  document.getElementById('prop-left').value = d.x;
  document.getElementById('prop-top').value = d.y;
  document.getElementById('row-position').style.display = d.parentUid ? 'none' : '';

  // typography
  document.getElementById('prop-font-family').value = d.fontFamily || '';
  document.getElementById('prop-font-size').value = d.fontSize || '';
  document.getElementById('prop-font-weight').value = d.fontWeight || '';

  // border & spacing
  document.getElementById('prop-border-width').value = d.borderWidth || '';
  document.getElementById('prop-border-radius').value = d.borderRadius || '';
  document.getElementById('prop-padding').value = d.padding || '';
  document.getElementById('prop-margin').value = d.margin || '';
  document.getElementById('prop-border-style').value = d.borderStyle || '';

  // layout
  var el = document.getElementById('prop-display'); if(el) el.value = d.display || '';
  el = document.getElementById('prop-flex-direction'); if(el) el.value = d.flexDirection || '';
  el = document.getElementById('prop-justify-content'); if(el) el.value = d.justifyContent || '';
  el = document.getElementById('prop-align-items'); if(el) el.value = d.alignItems || '';
  el = document.getElementById('prop-flex-wrap'); if(el) el.value = d.flexWrap || '';
  el = document.getElementById('prop-gap'); if(el) el.value = d.gap || '';

  // advanced
  el = document.getElementById('prop-overflow'); if(el) el.value = d.overflow || '';
  el = document.getElementById('prop-opacity'); if(el) el.value = d.opacity !== undefined ? d.opacity : '';
  el = document.getElementById('prop-zindex'); if(el) el.value = d.zIndex || '';
  el = document.getElementById('prop-cursor'); if(el) el.value = d.cursor || '';
  el = document.getElementById('prop-position'); if(el) el.value = d.position || '';

  // custom attrs
  var attrList = document.getElementById('custom-attrs-list');
  if (attrList) {
    attrList.innerHTML = '';
    if (d.customAttrs) {
      Object.entries(d.customAttrs).forEach(([k, v]) => {
        var row = document.createElement('div');
        row.className = 'prop-row custom-attr-row';
        row.innerHTML = '<input class="prop-input ca-key" value="' + k + '" style="flex:1" />' +
          '<input class="prop-input ca-val" value="' + (v||'') + '" style="flex:1" />' +
          '<button class="layer-act-btn ca-del" title="Remove">✕</button>';
        attrList.appendChild(row);
      });
    }
  }
}

function syncPropsPosition() {
  if (!App.selected) return;
  const d = findEl(App.selected);
  if (!d) return;
  document.getElementById('prop-left').value = d.x;
  document.getElementById('prop-top').value = d.y;
}
function syncPropsSize() {
  if (!App.selected) return;
  const d = findEl(App.selected);
  if (!d) return;
  document.getElementById('prop-width').value = d.w;
  document.getElementById('prop-height').value = d.h;
}

/* ── Bind all prop inputs ── */
function bindProps() {
  function onChange(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (!App.selected || App.selected === '__body__') return;
      fn(findEl(App.selected), el.value);
      pushHistory(); saveToStorage();
      refreshCanvas(); refreshLayers();
    });
  }
  function onSelect(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      if (!App.selected || App.selected === '__body__') return;
      fn(findEl(App.selected), el.value);
      pushHistory(); saveToStorage();
      refreshCanvas();
    });
  }

  onChange('prop-tag', (d, v) => { d.tag = v; });
  onChange('prop-id', (d, v) => { d.elId = v; });
  onChange('prop-class', (d, v) => { d.elClass = v; });
  onChange('prop-text', (d, v) => { d.text = v; });
  onChange('prop-src', (d, v) => { d.src = v; });
  onChange('prop-href', (d, v) => { d.href = v; });
  onChange('prop-alt', (d, v) => { d.alt = v; });
  onChange('prop-placeholder', (d, v) => { d.placeholder = v; });

  onSelect('prop-type', (d, v) => { d.inputType = v; });

  // parent reparent
  document.getElementById('prop-parent').addEventListener('change', () => {
    if (!App.selected || App.selected === '__body__') return;
    const d = findEl(App.selected);
    const newParent = document.getElementById('prop-parent').value || null;
    d.parentUid = newParent;
    if (!newParent) { d.x = 60; d.y = 60; }
    pushHistory(); saveToStorage();
    refreshCanvas(); refreshLayers(); refreshProps();
  });

  // colors
  function colorBind(pickId, textId, prop, isBody) {
    const pick = document.getElementById(pickId);
    const text = document.getElementById(textId);
    if (!pick || !text) return;
    pick.addEventListener('input', () => {
      if (!App.selected) return;
      if (isBody) { App.body[prop] = pick.value; } else { findEl(App.selected)[prop] = pick.value; }
      text.value = pick.value;
      pushHistory(); saveToStorage(); refreshCanvas();
    });
    text.addEventListener('input', () => {
      if (!App.selected) return;
      if (isBody) { App.body[prop] = text.value; } else { findEl(App.selected)[prop] = text.value; }
      try { pick.value = text.value; } catch(e) {}
      pushHistory(); saveToStorage(); refreshCanvas();
    });
  }
  colorBind('prop-color', 'prop-color-text', 'color', false);
  colorBind('prop-bg-color', 'prop-bg-text', 'bg', false);
  colorBind('prop-border-color', 'prop-border-text', 'borderColor', false);
  // body colors
  colorBind('body-bg-color', 'body-bg-text', 'bg', true);
  colorBind('body-color', 'body-color-text', 'color', true);

  // body font family
  var bodyFF = document.getElementById('body-font-family');
  if (bodyFF) bodyFF.addEventListener('change', () => {
    App.body.fontFamily = bodyFF.value;
    pushHistory(); saveToStorage(); refreshCanvas();
  });
  // body padding
  var bodyPad = document.getElementById('body-padding');
  if (bodyPad) bodyPad.addEventListener('input', () => {
    App.body.padding = bodyPad.value;
    pushHistory(); saveToStorage(); refreshCanvas();
  });

  // size & pos
  function numBind(id, prop) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      if (!App.selected || App.selected === '__body__') return;
      const d = findEl(App.selected);
      d[prop] = parseInt(el.value) || 0;
      const w = document.querySelector('.el-wrapper[data-uid="' + d.uid + '"]');
      if (w) {
        if (prop === 'w') w.style.width = d.w + 'px';
        if (prop === 'h') w.style.height = d.h + 'px';
        if (prop === 'x') w.style.left = d.x + 'px';
        if (prop === 'y') w.style.top = d.y + 'px';
      }
    });
  }
  numBind('prop-width', 'w');
  numBind('prop-height', 'h');
  numBind('prop-left', 'x');
  numBind('prop-top', 'y');

  // typography
  onChange('prop-font-size', (d, v) => { d.fontSize = parseInt(v) || ''; });
  onSelect('prop-font-family', (d, v) => { d.fontFamily = v; });
  onSelect('prop-font-weight', (d, v) => { d.fontWeight = v; });

  // border & spacing
  onChange('prop-border-width', (d, v) => { d.borderWidth = parseInt(v) || ''; });
  onChange('prop-border-radius', (d, v) => { d.borderRadius = parseInt(v) || ''; });
  onChange('prop-padding', (d, v) => { d.padding = v; });
  onChange('prop-margin', (d, v) => { d.margin = v; });
  onSelect('prop-border-style', (d, v) => { d.borderStyle = v; });

  // layout
  onSelect('prop-display', (d, v) => { d.display = v; });
  onSelect('prop-flex-direction', (d, v) => { d.flexDirection = v; });
  onSelect('prop-justify-content', (d, v) => { d.justifyContent = v; });
  onSelect('prop-align-items', (d, v) => { d.alignItems = v; });
  onSelect('prop-flex-wrap', (d, v) => { d.flexWrap = v; });
  onChange('prop-gap', (d, v) => { d.gap = v; });

  // advanced
  onSelect('prop-overflow', (d, v) => { d.overflow = v; });
  onChange('prop-opacity', (d, v) => { d.opacity = v; });
  onChange('prop-zindex', (d, v) => { d.zIndex = v; });
  onSelect('prop-cursor', (d, v) => { d.cursor = v; });
  onSelect('prop-position', (d, v) => { d.position = v; });

  // custom attrs
  var addBtn = document.getElementById('btn-add-attr');
  if (addBtn) addBtn.addEventListener('click', () => {
    if (!App.selected || App.selected === '__body__') return;
    var d = findEl(App.selected);
    if (!d.customAttrs) d.customAttrs = {};
    var key = 'data-new';
    var i = 1; while (d.customAttrs[key]) { key = 'data-new-' + i++; }
    d.customAttrs[key] = '';
    pushHistory(); saveToStorage(); refreshProps(); refreshCanvas();
  });
  // delegate for custom attr changes/deletes
  var attrList = document.getElementById('custom-attrs-list');
  if (attrList) {
    attrList.addEventListener('click', e => {
      if (!e.target.classList.contains('ca-del')) return;
      if (!App.selected || App.selected === '__body__') return;
      var d = findEl(App.selected);
      var row = e.target.closest('.custom-attr-row');
      var key = row.querySelector('.ca-key').value;
      delete d.customAttrs[key];
      pushHistory(); saveToStorage(); refreshProps(); refreshCanvas();
    });
    attrList.addEventListener('change', e => {
      if (!App.selected || App.selected === '__body__') return;
      var d = findEl(App.selected);
      // rebuild customAttrs from all rows
      d.customAttrs = {};
      attrList.querySelectorAll('.custom-attr-row').forEach(row => {
        var k = row.querySelector('.ca-key').value.trim();
        var v = row.querySelector('.ca-val').value;
        if (k) d.customAttrs[k] = v;
      });
      pushHistory(); saveToStorage(); refreshCanvas();
    });
  }

  // delete
  document.getElementById('btn-delete-el').addEventListener('click', async () => {
    if (!App.selected || App.selected === '__body__') return;
    const d = findEl(App.selected);
    const kids = descendants(d.uid, 999);
    const msg = kids.length ? 'This will also remove ' + kids.length + ' child element(s).' : 'Remove this element?';
    if (await modalConfirm('Delete <' + d.tag + '>', msg)) {
      removeEl(d.uid);
      pushHistory(); saveToStorage();
      refreshCanvas(); refreshLayers(); refreshProps();
      toast('Deleted', 'warn');
    }
  });
}

/* ═══════════════ TOOLBAR BUTTONS ═══════════════ */
function bindToolbar() {
  document.getElementById('btn-new-page').addEventListener('click', async () => {
    const msg = App.elements.length === 0
      ? 'Canvas is empty. Reset page settings and start fresh?'
      : 'Clear all ' + App.elements.length + ' element(s) and start fresh?';
    if (await modalConfirm('New Page', msg)) {
      App.elements = [];
      App.selected = null;
      App.nextId = 1;
      App.body = { bg: '#0a0c12', color: '#e8eaf6', fontFamily: '', fontSize: '', padding: '', margin: '', overflow: '', customAttrs: {} };
      pushHistory(); saveToStorage();
      refreshCanvas(); refreshLayers(); refreshProps();
      toast('Canvas cleared');
    }
  });

  document.getElementById('btn-check-path').addEventListener('click', () => {
    App.pathActive = !App.pathActive;
    document.getElementById('btn-check-path').classList.toggle('active', App.pathActive);
    reapplyHighlights();
  });

  document.getElementById('btn-check-child').addEventListener('click', () => {
    App.childActive = !App.childActive;
    document.getElementById('btn-check-child').classList.toggle('active', App.childActive);
    reapplyHighlights();
  });

  document.getElementById('btn-clear-highlight').addEventListener('click', () => {
    App.pathActive = false;
    App.childActive = false;
    document.getElementById('btn-check-path').classList.remove('active');
    document.getElementById('btn-check-child').classList.remove('active');
    reapplyHighlights();
  });

  document.getElementById('max-level-input').addEventListener('input', () => {
    if (App.childActive) reapplyHighlights();
  });

  document.getElementById('btn-export-html').addEventListener('click', () => exportHTML());
  document.getElementById('btn-export-css').addEventListener('click', () => exportCSS());
  document.getElementById('btn-export-js').addEventListener('click', () => exportJS());
  document.getElementById('btn-export-zip').addEventListener('click', () => exportZIP());
}

/* ═══════════════ KEYBOARD SHORTCUTS ═══════════════ */
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    // Don't intercept when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    // Delete selected element
    if (e.key === 'Delete' && App.selected && App.selected !== '__body__') {
      const d = findEl(App.selected);
      if (d) { removeEl(d.uid); pushHistory(); saveToStorage(); refreshCanvas(); refreshLayers(); refreshProps(); toast('Deleted', 'warn'); }
    }
    // Ctrl+Z undo
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      if (undo()) toast('Undo');
    }
    // Ctrl+Y or Ctrl+Shift+Z redo
    if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
      e.preventDefault();
      if (redo()) toast('Redo');
    }
    // Ctrl+D duplicate
    if (e.key === 'd' && (e.ctrlKey || e.metaKey) && App.selected && App.selected !== '__body__') {
      e.preventDefault();
      const newUid = duplicateEl(App.selected);
      if (newUid) { pushHistory(); saveToStorage(); refreshCanvas(); refreshLayers(); selectElement(newUid); toast('Duplicated'); }
    }
  });
}

/* ═══════════════ INIT ═══════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  buildPalette();
  bindProps();
  bindToolbar();
  bindKeyboard();
  pushHistory(); // initial state
  refreshCanvas();
  refreshLayers();
});
