/* ============================================================
   ui-integration.js — Integration of new features into UI/properties
   ============================================================ */

/**
 * Initialize location tool UI
 */
function initLocationToolUI() {
  const sectionEl = document.getElementById('location-tool-section');
  const selectorEl = document.getElementById('anchor-selector');
  
  if (!sectionEl || !selectorEl) return;
  
  // Create anchor mode buttons
  selectorEl.innerHTML = '';
  const anchorModes = [
    ['top-left', '↖'],
    ['top-center', '⬆'],
    ['top-right', '↗'],
    ['middle-left', '⬅'],
    ['center', '●'],
    ['middle-right', '➜'],
    ['bottom-left', '↙'],
    ['bottom-center', '⬇'],
    ['bottom-right', '↘'],
  ];
  
  anchorModes.forEach(([mode, sym]) => {
    const btn = document.createElement('button');
    btn.className = 'anchor-btn';
    btn.textContent = sym;
    btn.title = mode;
    btn.dataset.anchorMode = mode;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.anchor-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
    selectorEl.appendChild(btn);
  });
  
  // Apply button
  document.getElementById('location-apply-btn').addEventListener('click', applyLocationFromUI);
  
  // Preset buttons
  document.getElementById('location-center-btn').addEventListener('click', () => {
    const result = centerElementOnCanvas(App.selected);
    if (result.success) {
      toast('Element centered on canvas', 'success');
      refreshProps();
    } else {
      toast('Error: ' + result.error, 'warn');
    }
  });
  
  document.getElementById('location-corner-btn').addEventListener('click', () => {
    const result = positionInCorner(App.selected, 'top-left', 20, 20);
    if (result.success) {
      toast('Element positioned to corner', 'success');
      refreshProps();
    } else {
      toast('Error: ' + result.error, 'warn');
    }
  });
}

/**
 * Apply location from UI inputs
 */
function applyLocationFromUI() {
  if (!App.selected || App.selected === '__body__') return;
  
  const xInput = document.getElementById('location-x-input').value;
  const yInput = document.getElementById('location-y-input').value;
  const anchorBtn = document.querySelector('.anchor-btn.selected');
  const anchorMode = anchorBtn ? anchorBtn.dataset.anchorMode : 'mouse';
  
  if (!xInput || !yInput) {
    toast('Please enter X and Y values', 'warn');
    return;
  }
  
  const result = applyLocation(App.selected, xInput, yInput, anchorMode);
  if (result.success) {
    toast(`Positioned: x=${result.x}, y=${result.y}`, 'success');
    refreshProps();
  } else {
    toast('Position error: ' + result.error, 'warn');
  }
}

/**
 * Update location tool UI when element selected
 */
function updateLocationToolUI() {
  if (!App.selected || App.selected === '__body__') {
    document.getElementById('location-tool-section').style.display = 'none';
    return;
  }
  
  const el = findEl(App.selected);
  if (!el || el.parentUid) {
    document.getElementById('location-tool-section').style.display = 'none';
    return;
  }
  
  // Show location tool for root-level elements only
  document.getElementById('location-tool-section').style.display = '';
  
  const pos = getPositionExpressions(App.selected);
  document.getElementById('location-x-input').value = pos.x;
  document.getElementById('location-y-input').value = pos.y;
  
  // Set anchor button
  const selectedBtn = document.querySelector(
    `.anchor-btn[data-anchor-mode="${pos.anchor || 'mouse'}"]`
  );
  document.querySelectorAll('.anchor-btn').forEach(b => b.classList.remove('selected'));
  if (selectedBtn) selectedBtn.classList.add('selected');
}

/**
 * Show antigravity warning when appropriate
 */
async function checkAndShowAntigravityWarning() {
  if (!App.selected || App.selected === '__body__') return;
  
  const analysis = await checkAntigravityCompatibility(App.selected);
  if (!analysis) return; // No constraint
  
  // Show warning in properties
  const propsContent = document.getElementById('props-content');
  let warningEl = document.getElementById('antigravity-warning-container');
  
  if (!warningEl) {
    warningEl = document.createElement('div');
    warningEl.id = 'antigravity-warning-container';
    propsContent.insertBefore(warningEl, propsContent.firstChild);
  }
  
  warningEl.innerHTML = `
    <div class="antigravity-warning">
      <div><span class="antigravity-warning-icon">⚠️</span> <strong>Layout Constraint Detected</strong></div>
      <div style="margin-top:4px;color:var(--text-dim)">${analysis.reason}</div>
      <div class="antigravity-warning-actions">
        <button class="btn antigravity-action-btn" id="antigravity-convert-btn">
          🔓 Convert to Free-Move
        </button>
        <button class="btn antigravity-action-btn" id="antigravity-detach-btn">
          ↗ Detach to Root
        </button>
        <button class="btn antigravity-action-btn" id="antigravity-dismiss-btn">
          Dismiss
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('antigravity-convert-btn').addEventListener('click', () => {
    convertToFreeMove(App.selected);
    warningEl.style.display = 'none';
    toast('Parent set to relative, child to absolute', 'success');
  });
  
  document.getElementById('antigravity-detach-btn').addEventListener('click', () => {
    detachFromParent(App.selected);
    warningEl.style.display = 'none';
    toast('Element detached to root level', 'success');
  });
  
  document.getElementById('antigravity-dismiss-btn').addEventListener('click', () => {
    warningEl.style.display = 'none';
  });
}

/**
 * Hook into refreshProps to update location tool
 * Store original refreshProps first
 */
const originalRefreshProps = window.refreshProps;
window.refreshProps = function() {
  // Call original
  if (originalRefreshProps) {
    originalRefreshProps.call(this);
  }
  
  // Update location tool UI
  updateLocationToolUI();
  
  // Check antigravity compatibility
  checkAndShowAntigravityWarning();
};

/**
 * Initialize on document ready
 */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initLocationToolUI();
    
    // Initialize browser preview head settings in storage
    if (!localStorage.getItem('ui-builder-state') || !JSON.parse(localStorage.getItem('ui-builder-state')).headSettings) {
      const stateKey = 'ui-builder-state';
      try {
        const state = JSON.parse(localStorage.getItem(stateKey) || '{}');
        if (!state.headSettings) {
          state.headSettings = {
            title: 'Page Title',
            favicon: '',
            description: '',
            customHtml: '',
          };
          localStorage.setItem(stateKey, JSON.stringify(state));
        }
      } catch (e) {}
    }
  }, 200);
});
