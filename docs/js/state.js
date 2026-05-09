/* ============================================================
   state.js — App state, helpers, toast, modal
   ============================================================ */
window.App = {
  elements: [],      // array of element descriptors
  nextId: 1,
  selected: null,    // uid of selected element ('__body__' for body)
  pathActive: false,
  childActive: false,
  // body virtual element — stores styles for <body>
  body: {
    bg: '#0a0c12',
    color: '#e8eaf6',
    fontFamily: '',
    fontSize: '',
    padding: '',
    margin: '',
    overflow: '',
    customAttrs: {},  // key-value pairs
  },
  // undo / redo
  history: [],
  historyIndex: -1,
  maxHistory: 60,
};

/* ── Unique ID generator ── */
function uid() { return 'el-' + (App.nextId++); }

/* ── Find element descriptor by uid ── */
function findEl(uid) { return App.elements.find(e => e.uid === uid); }

/* ── Get children of a parent uid (null = root) ── */
function childrenOf(parentUid) {
  return App.elements.filter(e => e.parentUid === (parentUid || null));
}

/* ── Get all ancestor uids ── */
function ancestors(uid) {
  const res = [];
  let el = findEl(uid);
  while (el && el.parentUid) {
    res.push(el.parentUid);
    el = findEl(el.parentUid);
  }
  return res;
}

/* ── Get all descendants up to maxLevel ── */
function descendants(uid, maxLevel) {
  const res = [];
  function walk(pid, level) {
    if (level > maxLevel) return;
    childrenOf(pid).forEach(ch => {
      res.push(ch.uid);
      walk(ch.uid, level + 1);
    });
  }
  walk(uid, 1);
  return res;
}

/* ── Remove element + all descendants ── */
function removeEl(uid) {
  const toRemove = new Set([uid, ...descendants(uid, 999)]);
  App.elements = App.elements.filter(e => !toRemove.has(e.uid));
  if (App.selected && toRemove.has(App.selected)) App.selected = null;
}

/* ── Duplicate element + all descendants ── */
function duplicateEl(uid) {
  const src = findEl(uid);
  if (!src) return null;
  const uidMap = {};   // old uid -> new uid
  const allUids = [uid, ...descendants(uid, 999)];
  // create uid mappings
  allUids.forEach(u => { uidMap[u] = 'el-' + (App.nextId++); });
  // clone elements
  allUids.forEach(u => {
    const orig = findEl(u);
    const clone = JSON.parse(JSON.stringify(orig));
    clone.uid = uidMap[u];
    clone.parentUid = clone.parentUid ? (uidMap[clone.parentUid] || clone.parentUid) : clone.parentUid;
    // offset root element slightly
    if (u === uid) {
      clone.x = (clone.x || 0) + 30;
      clone.y = (clone.y || 0) + 30;
    }
    App.elements.push(clone);
  });
  return uidMap[uid];
}

/* ── History (Undo/Redo) ── */
function pushHistory() {
  // trim future states
  App.history = App.history.slice(0, App.historyIndex + 1);
  // snapshot
  const snapshot = {
    elements: JSON.parse(JSON.stringify(App.elements)),
    nextId: App.nextId,
    body: JSON.parse(JSON.stringify(App.body)),
  };
  App.history.push(snapshot);
  if (App.history.length > App.maxHistory) App.history.shift();
  App.historyIndex = App.history.length - 1;
}

function undo() {
  if (App.historyIndex <= 0) return false;
  App.historyIndex--;
  restoreSnapshot(App.history[App.historyIndex]);
  return true;
}

function redo() {
  if (App.historyIndex >= App.history.length - 1) return false;
  App.historyIndex++;
  restoreSnapshot(App.history[App.historyIndex]);
  return true;
}

function restoreSnapshot(snap) {
  App.elements = JSON.parse(JSON.stringify(snap.elements));
  App.nextId = snap.nextId;
  App.body = JSON.parse(JSON.stringify(snap.body));
  // make sure selection is still valid
  if (App.selected && App.selected !== '__body__' && !findEl(App.selected)) {
    App.selected = null;
  }
  refreshCanvas();
  refreshLayers();
  refreshProps();
}

/* ── Toast ── */
function toast(msg, type) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => t.remove(), 300); }, 2400);
}

/* ── Modal confirm ── */
function modalConfirm(title, body) {
  return new Promise(resolve => {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;
    document.getElementById('modal-overlay').classList.add('open');
    const ok = document.getElementById('modal-ok');
    const cancel = document.getElementById('modal-cancel');
    function cleanup() {
      document.getElementById('modal-overlay').classList.remove('open');
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
    }
    function onOk() { cleanup(); resolve(true); }
    function onCancel() { cleanup(); resolve(false); }
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  });
}

/* ── Default text color for dark background ── */
const DEFAULT_TEXT_COLOR = '#eef0fa';

/* ── Create a new element descriptor from palette item ── */
function createElDescriptor(item, x, y, parentUid) {
  return {
    uid: uid(),
    tag: item.tag,
    elId: '',
    elClass: '',
    text: item.text || '',
    src: item.src || '',
    href: item.href || '',
    alt: '',
    placeholder: '',
    inputType: item.inputType || '',
    // position (only used when root-level)
    x: x || 40,
    y: y || 40,
    // size
    w: item.w || 120,
    h: item.h || 40,
    // style
    color: item.color || DEFAULT_TEXT_COLOR,
    bg: item.bg || '',
    borderColor: '',
    borderWidth: '',
    borderRadius: '',
    borderStyle: '',
    padding: item.tag === 'div' || item.tag === 'section' ? '8px' : '',
    margin: '',
    fontFamily: item.ff || '',
    fontSize: item.fs || '',
    fontWeight: item.fw || '',
    // layout
    display: '',
    flexDirection: '',
    justifyContent: '',
    alignItems: '',
    flexWrap: '',
    gap: '',
    // advanced
    overflow: '',
    opacity: '',
    zIndex: '',
    cursor: '',
    position: '',
    // custom HTML attributes (key-value pairs)
    customAttrs: {},
    // nesting
    parentUid: parentUid || null,
  };
}

/* ── Download helper ── */
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
}

/* ── LocalStorage persistence ── */
function saveToStorage() {
  try {
    const data = {
      elements: App.elements,
      nextId: App.nextId,
      body: App.body,
    };
    localStorage.setItem('ui-builder-state', JSON.stringify(data));
  } catch (e) { /* quota exceeded — ignore */ }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('ui-builder-state');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.elements) App.elements = data.elements;
    if (data.nextId) App.nextId = data.nextId;
    if (data.body) App.body = { ...App.body, ...data.body };
    return true;
  } catch (e) {
    console.error('Failed to load state:', e);
    return false;
  }
}
