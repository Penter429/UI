/* ============================================================
   antigravity.js — Parent layout constraint detection & free-move compatibility
   ============================================================ */

/** 
 * Detects whether a parent element constrains child free-movement
 * Returns { constrained: boolean, reason: string, type: string }
 */
function analyzeParentConstraints(childDesc, allElements) {
  if (!childDesc.parentUid) return { constrained: false, reason: '', type: '' };
  
  const parent = findEl(childDesc.parentUid);
  if (!parent) return { constrained: false, reason: '', type: '' };

  // Table family elements always constrain
  const TABLE_TAGS = ['table','thead','tbody','tfoot','tr','td','th','caption','colgroup','col'];
  if (TABLE_TAGS.includes(parent.tag)) {
    return {
      constrained: true,
      reason: 'Table layout structure forces browser positioning',
      type: 'table'
    };
  }

  // List family
  const LIST_TAGS = ['ul', 'ol', 'li'];
  if (LIST_TAGS.includes(parent.tag)) {
    return {
      constrained: true,
      reason: 'List layout controls child positioning',
      type: 'list'
    };
  }

  // Form structure
  const FORM_TAGS = ['select', 'option', 'optgroup'];
  if (FORM_TAGS.includes(parent.tag)) {
    return {
      constrained: true,
      reason: 'Form element structure is browser-controlled',
      type: 'form'
    };
  }

  // Text flow containers
  const TEXT_FLOW_TAGS = ['p', 'span', 'label', 'legend'];
  if (TEXT_FLOW_TAGS.includes(parent.tag)) {
    return {
      constrained: true,
      reason: 'Text flow container constrains child positioning',
      type: 'text-flow'
    };
  }

  // Check parent CSS layout properties
  if (parent.display === 'flex' || parent.display === 'inline-flex') {
    return {
      constrained: true,
      reason: 'Flexbox layout manages child positioning',
      type: 'flex'
    };
  }

  if (parent.display === 'grid' || parent.display === 'inline-grid') {
    return {
      constrained: true,
      reason: 'CSS Grid layout manages child positioning',
      type: 'grid'
    };
  }

  // Free-move compatible parents or positioning contexts
  const FREE_MOVE_TAGS = ['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav', 'body'];
  if (FREE_MOVE_TAGS.includes(parent.tag)) {
    // Check if parent has positioning context
    if (parent.position === 'relative' || parent.position === 'absolute' || parent.position === 'fixed') {
      return { constrained: false, reason: '', type: '' };
    }
    // div/section with no special layout is free-move compatible
    return { constrained: false, reason: '', type: '' };
  }

  // Unknown tag - assume constrained to be safe
  return {
    constrained: true,
    reason: 'Parent tag may control child layout',
    type: 'unknown'
  };
}

/**
 * Get all constraints hierarchically up to root
 * Shows chain of constraint issues
 */
function getConstraintChain(uid, allElements = null) {
  allElements = allElements || App.elements;
  const chain = [];
  let current = findEl(uid);
  
  while (current && current.parentUid) {
    const analysis = analyzeParentConstraints(current, allElements);
    if (analysis.constrained) {
      chain.push({
        parentTag: current.tag,
        parentUid: current.parentUid,
        ...analysis
      });
    }
    current = findEl(current.parentUid);
  }
  
  return chain;
}

/**
 * Show warning modal when entering antigravity on constrained parent
 */
async function checkAntigravityCompatibility(childUid) {
  const desc = findEl(childUid);
  if (!desc || !desc.parentUid) return null; // root level is always free
  
  const constraints = analyzeParentConstraints(desc, App.elements);
  if (!constraints.constrained) return null; // no constraint
  
  const chain = getConstraintChain(childUid);
  
  // Build warning message
  let message = `<strong>⚠️ Parent Layout Constraint Detected</strong><br><br>`;
  message += `<strong>Child:</strong> &lt;${desc.tag}&gt;<br>`;
  message += `<strong>Reason:</strong> ${constraints.reason}<br><br>`;
  
  if (chain.length > 0) {
    message += `<strong>Constraint Chain:</strong><br>`;
    chain.forEach((item, i) => {
      message += `${i + 1}. &lt;${item.parentTag}&gt; (${item.type})<br>`;
    });
    message += `<br>`;
  }
  
  message += `Free movement may not work correctly inside this layout.<br><br>`;
  message += `<strong>What would you like to do?</strong>`;
  
  return {
    constrained: true,
    reason: constraints.reason,
    type: constraints.type,
    chain: chain,
    message: message
  };
}

/**
 * Apply antigravity settings: make parent position:relative, child position:absolute
 */
function convertToFreeMove(childUid) {
  const child = findEl(childUid);
  if (!child || !child.parentUid) return false;
  
  const parent = findEl(child.parentUid);
  if (!parent) return false;
  
  // Make sure parent has positioning context
  if (!parent.position) {
    parent.position = 'relative';
    toast('Parent <' + parent.tag + '> set to position: relative', 'success');
  }
  
  // Make child absolutely positioned
  if (!child.position) {
    child.position = 'absolute';
    child.x = child.x || 0;
    child.y = child.y || 0;
    toast('Child <' + child.tag + '> set to position: absolute', 'success');
  }
  
  pushHistory();
  saveToStorage();
  refreshCanvas();
  refreshProps();
  
  return true;
}

/**
 * Detach element from parent - move to root level
 */
function detachFromParent(childUid) {
  const child = findEl(childUid);
  if (!child || !child.parentUid) return false;
  
  const oldParent = findEl(child.parentUid);
  
  // Move to root with safe positioning
  child.parentUid = null;
  child.x = child.x || 60;
  child.y = child.y || 60;
  child.position = child.position || 'absolute';
  
  toast('Moved <' + child.tag + '> to root level', 'success');
  pushHistory();
  saveToStorage();
  refreshCanvas();
  refreshLayers();
  refreshProps();
  
  return true;
}

/**
 * Get recommendation for making a constrained element free
 */
function getFreeMoveRecommendation(childUid) {
  const analysis = analyzeParentConstraints(findEl(childUid), App.elements);
  
  if (analysis.type === 'table') {
    return 'Tables require special handling. Consider extracting this element to root level or using a different layout.';
  }
  if (analysis.type === 'list') {
    return 'List children are layout-managed. Extract to root or wrap in a free-move container.';
  }
  if (analysis.type === 'flex' || analysis.type === 'grid') {
    return 'Change parent display to "block" or extract child to root level.';
  }
  if (analysis.type === 'text-flow') {
    return 'Text flow containers position children inline. Move to root or use a block container.';
  }
  return 'Set parent to position: relative and child to position: absolute.';
}
