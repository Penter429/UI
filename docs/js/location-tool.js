/* ============================================================
   location-tool.js — Anchor modes and precise positioning with expressions
   ============================================================ */

// Anchor mode: where coordinates originate from element bounds
const ANCHOR_MODES = {
  'mouse': 'Top-left (drag point)',
  'center': 'Center of element',
  'top-left': 'Top-left corner',
  'top-center': 'Top-center edge',
  'top-right': 'Top-right corner',
  'middle-left': 'Middle-left edge',
  'middle-right': 'Middle-right edge',
  'bottom-left': 'Bottom-left corner',
  'bottom-center': 'Bottom-center edge',
  'bottom-right': 'Bottom-right corner',
};

/**
 * Safe expression evaluator for coordinate values
 * Supports: pixels, arithmetic, canvas/element variables
 * Examples: "100", "500/2", "cw-100", "(cw-ew)/2"
 */
function parseCoordinateExpression(expr, vars = {}) {
  // Sanitize expression: only allow numbers, operators, parentheses, and variable names
  const cleanExpr = String(expr).trim();
  
  // Replace known variables with their values
  let evaluated = cleanExpr;
  for (const [key, val] of Object.entries(vars)) {
    // Use word boundaries to avoid partial replacements
    const regex = new RegExp('\\b' + key + '\\b', 'g');
    evaluated = evaluated.replace(regex, '(' + val + ')');
  }
  
  // Validate: only allow safe characters
  if (!/^[\d\s\(\)\+\-\*\/\.]+$/.test(evaluated)) {
    throw new Error('Invalid expression: contains unsafe characters');
  }
  
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + evaluated)();
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Expression did not evaluate to a valid number');
    }
    return Math.round(result); // Return integer pixel value
  } catch (err) {
    throw new Error('Expression error: ' + err.message);
  }
}

/**
 * Get variables available for coordinate expressions
 */
function getCoordinateVariables(elementUid) {
  const el = findEl(elementUid);
  if (!el) return {};
  
  const canvasEl = document.getElementById('canvas');
  const canvasScroll = document.getElementById('canvas-scroll');
  
  const vars = {
    'cw': canvasScroll?.clientWidth || 800,
    'ch': canvasScroll?.clientHeight || 600,
    'ew': el.w || 100,
    'eh': el.h || 40,
  };
  
  return vars;
}

/**
 * Calculate actual position based on anchor mode and dimensions
 * Result: { x, y } in pixel coordinates
 */
function calculatePositionFromAnchor(anchorMode, x, y, width, height) {
  const modes = {
    'mouse': () => ({ x, y }),
    'center': () => ({ x: x - width / 2, y: y - height / 2 }),
    'top-left': () => ({ x, y }),
    'top-center': () => ({ x: x - width / 2, y }),
    'top-right': () => ({ x: x - width, y }),
    'middle-left': () => ({ x, y: y - height / 2 }),
    'middle-right': () => ({ x: x - width, y: y - height / 2 }),
    'bottom-left': () => ({ x, y: y - height }),
    'bottom-center': () => ({ x: x - width / 2, y: y - height }),
    'bottom-right': () => ({ x: x - width, y: y - height }),
  };
  
  if (modes[anchorMode]) {
    return modes[anchorMode]();
  }
  return { x, y }; // Default to mouse mode
}

/**
 * Apply location with anchor mode and optional expression parsing
 */
function applyLocation(elementUid, xExpr, yExpr, anchorMode = 'mouse') {
  const el = findEl(elementUid);
  if (!el) return { success: false, error: 'Element not found' };
  if (el.parentUid) return { success: false, error: 'Can only position root-level elements' };
  
  try {
    const vars = getCoordinateVariables(elementUid);
    const x = parseCoordinateExpression(xExpr, vars);
    const y = parseCoordinateExpression(yExpr, vars);
    
    // Calculate final position from anchor mode
    const pos = calculatePositionFromAnchor(anchorMode, x, y, el.w, el.h);
    
    el.x = Math.max(0, Math.round(pos.x));
    el.y = Math.max(0, Math.round(pos.y));
    el.anchorMode = anchorMode; // Store for UI
    
    pushHistory();
    saveToStorage();
    refreshCanvas();
    syncPropsPosition();
    
    return { success: true, x: el.x, y: el.y };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Get current position expression (reverse of applyLocation)
 * Useful for showing user what they set
 */
function getPositionExpressions(elementUid) {
  const el = findEl(elementUid);
  if (!el) return { x: '', y: '', anchor: 'mouse' };
  
  return {
    x: String(el.x || 0),
    y: String(el.y || 0),
    anchor: el.anchorMode || 'mouse',
    w: el.w,
    h: el.h,
  };
}

/**
 * Suggestion: center element on canvas
 */
function centerElementOnCanvas(elementUid) {
  const scroll = document.getElementById('canvas-scroll');
  if (!scroll) return { success: false, error: 'Canvas not found' };
  
  return applyLocation(
    elementUid,
    '(cw-ew)/2',
    '(ch-eh)/2',
    'center'
  );
}

/**
 * Position element in corner (with offset)
 */
function positionInCorner(elementUid, corner = 'top-left', offsetX = 20, offsetY = 20) {
  const offsetExprX = corner.includes('right') ? `cw-ew-${offsetX}` : `${offsetX}`;
  const offsetExprY = corner.includes('bottom') ? `ch-eh-${offsetY}` : `${offsetY}`;
  
  const anchorMap = {
    'top-left': 'top-left',
    'top-right': 'top-right',
    'bottom-left': 'bottom-left',
    'bottom-right': 'bottom-right',
  };
  
  return applyLocation(
    elementUid,
    offsetExprX,
    offsetExprY,
    anchorMap[corner] || 'top-left'
  );
}

/**
 * Validate expression without applying
 */
function validateCoordinateExpression(expr, vars = {}) {
  try {
    parseCoordinateExpression(expr, vars);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * Get example expressions for users
 */
function getExampleExpressions() {
  return [
    { expr: '100', desc: 'Fixed pixel value' },
    { expr: '500/2', desc: 'Arithmetic: 250px' },
    { expr: 'cw/2', desc: 'Canvas width divided by 2' },
    { expr: '(cw-ew)/2', desc: 'Center horizontally' },
    { expr: '(ch-eh)/2', desc: 'Center vertically' },
    { expr: 'cw-ew-20', desc: 'Right edge with 20px offset' },
    { expr: 'ch-eh-20', desc: 'Bottom edge with 20px offset' },
    { expr: 'cw*0.75', desc: '75% across canvas' },
  ];
}
