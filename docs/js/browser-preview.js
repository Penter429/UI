/* ============================================================
   browser-preview.js — Browser preview tab window (fake browser chrome)
   ============================================================ */

/**
 * Initialize browser preview window that shows above canvas
 * Displays: favicon, page title, browser-like appearance
 */
function initBrowserPreview() {
  const preview = document.getElementById('browser-preview');
  if (!preview) return;

  const settingsBtn = preview.querySelector('.browser-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showHeadSettings);
  }

  updateBrowserPreview();
}

/**
 * Update browser preview with current page info
 */
function updateBrowserPreview() {
  const titleEl = document.getElementById('browser-title');
  const faviconEl = document.querySelector('.browser-favicon');
  
  if (!titleEl || !faviconEl) return;
  
  // Get saved head settings or defaults
  const headSettings = getHeadSettings();
  
  titleEl.textContent = headSettings.title || 'Page Title';
  
  if (headSettings.favicon) {
    faviconEl.src = headSettings.favicon;
    faviconEl.style.opacity = '1';
  } else {
    faviconEl.style.opacity = '0.5';
  }
  
  // Also update document title for reference
  document.title = headSettings.title || 'UI Builder';
}

/**
 * Show modal to edit head settings (title, favicon)
 */
function showHeadSettings() {
  const settings = getHeadSettings();
  
  const modal = document.createElement('div');
  modal.className = 'head-settings-modal';
  modal.innerHTML = `
    <div class="head-settings-content">
      <h3>Page Head Settings</h3>
      
      <div class="head-setting-group">
        <label>Page Title</label>
        <input type="text" id="head-title-input" placeholder="My Website" value="${escapeHtml(settings.title || '')}" />
        <small>Appears in browser tab and meta tags</small>
      </div>
      
      <div class="head-setting-group">
        <label>Favicon URL</label>
        <input type="text" id="head-favicon-input" placeholder="https://example.com/favicon.ico" value="${escapeHtml(settings.favicon || '')}" />
        <small>URL to favicon image</small>
      </div>
      
      <div class="head-setting-group">
        <label>Meta Description</label>
        <textarea id="head-description-input" placeholder="Brief description of your page">${escapeHtml(settings.description || '')}</textarea>
      </div>
      
      <div class="head-setting-group">
        <label>Custom Head HTML</label>
        <textarea id="head-custom-input" placeholder="&lt;meta name=&quot;theme-color&quot; content=&quot;#6c63ff&quot;&gt;" style="font-family:var(--font-mono);font-size:11px">${escapeHtml(settings.customHtml || '')}</textarea>
        <small>Additional &lt;meta&gt;, &lt;link&gt;, &lt;script&gt; tags in &lt;head&gt;</small>
      </div>
      
      <div class="head-settings-buttons">
        <button class="btn" id="head-settings-cancel">Cancel</button>
        <button class="btn btn-accent" id="head-settings-save">Save Settings</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'head-settings-overlay';
  overlay.addEventListener('click', () => {
    overlay.remove();
    modal.remove();
  });
  document.body.appendChild(overlay);
  
  // Event handlers
  document.getElementById('head-settings-cancel').addEventListener('click', () => {
    overlay.remove();
    modal.remove();
  });
  
  document.getElementById('head-settings-save').addEventListener('click', () => {
    const newSettings = {
      title: document.getElementById('head-title-input').value,
      favicon: document.getElementById('head-favicon-input').value,
      description: document.getElementById('head-description-input').value,
      customHtml: document.getElementById('head-custom-input').value,
    };
    
    saveHeadSettings(newSettings);
    updateBrowserPreview();
    overlay.remove();
    modal.remove();
    toast('Head settings updated', 'success');
  });
  
  // Focus on title input
  document.getElementById('head-title-input').focus();
  document.getElementById('head-title-input').select();
}

/**
 * Get head settings from App state
 */
function getHeadSettings() {
  if (!App.headSettings) {
    App.headSettings = {
      title: 'Page Title',
      favicon: '',
      description: '',
      customHtml: '',
    };
  }
  return App.headSettings;
}

/**
 * Save head settings to App state
 */
function saveHeadSettings(settings) {
  if (!App.headSettings) {
    App.headSettings = {};
  }
  Object.assign(App.headSettings, settings);
  saveToStorage();
}

/**
 * HTML escape for safe display in forms
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get exported head content for HTML export
 */
function getExportedHeadHTML() {
  const settings = getHeadSettings();
  let html = '';
  
  if (settings.title) {
    html += `  <title>${escapeHtml(settings.title)}</title>\n`;
  }
  
  if (settings.description) {
    html += `  <meta name="description" content="${escapeHtml(settings.description)}" />\n`;
  }
  
  if (settings.favicon) {
    html += `  <link rel="icon" href="${escapeHtml(settings.favicon)}" />\n`;
  }
  
  if (settings.customHtml) {
    html += `  ${settings.customHtml}\n`;
  }
  
  return html;
}

// Extend App state to include head settings
if (typeof App !== 'undefined') {
  if (!App.headSettings) {
    App.headSettings = {
      title: 'Page Title',
      favicon: '',
      description: '',
      customHtml: '',
    };
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initBrowserPreview, 100); // Small delay to ensure DOM is ready
});
