# UI Builder — New Features Documentation

## Overview

This document describes the three major improvements added to the UI Builder:

1. **Antigravity Free-Move Compatibility System** — Detect when nested elements can't move freely
2. **Browser Preview Window** — Visual browser chrome showing page title and favicon
3. **Location Tool** — Precise positioning with anchor modes and expression parsing

---

## 1. Antigravity Free-Move Compatibility System

### Problem Solved

When you place elements inside certain HTML containers (tables, flexbox, lists, etc.), the browser's layout system takes over and prevents free-moving. The builder now **detects this automatically** and offers helpful solutions.

### How It Works

When you select a nested element, the system checks if its parent constrains movement:

**Constrained Parent Types:**
- **Table layout**: `<table>`, `<tbody>`, `<tr>`, `<td>`, `<th>`, etc.
- **List layout**: `<ul>`, `<ol>`, `<li>`
- **Form structure**: `<select>`, `<option>`, `<optgroup>`
- **Text flow**: `<p>`, `<span>` 
- **CSS layout**: Parent with `display: flex` or `display: grid`

**Free-Move Compatible Parents:**
- `<div>`, `<section>`, `<article>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<nav>`, `<body>`
- Any parent with `position: relative` or `position: absolute`

### User Interface

When a constraint is detected, a warning appears in the Properties panel:

```
⚠️ Layout Constraint Detected
Reason: Flexbox layout manages child positioning

[🔓 Convert to Free-Move]
[↗ Detach to Root]
[Dismiss]
```

### Three Solutions Offered

#### 1. Convert to Free-Move
- Sets parent to `position: relative`
- Sets child to `position: absolute`
- Child can now move freely within parent's bounds

#### 2. Detach to Root
- Moves element out of constrained parent
- Places it at root level (canvas level)
- Element becomes freely positionable

#### 3. Keep Normal Flow
- Dismiss the warning
- Keep element in normal layout flow
- Standard browser positioning applies

---

## 2. Browser Preview Window

### Features

The Browser Preview appears as an embedded browser frame above the canvas, with a browser-style top bar and a preview area below it:

```
[ 🔷 ] Page Title                                    [ ⚙ ]
```

Shows:
- **Favicon** — Automatically generated or custom URL
- **Page Title** — Editable title that appears in browser tab
- **Settings button** — Opens head editing modal

### Head Settings Modal

Click the ⚙ button to edit:

- **Page Title** — Appears in `<title>` tag and browser tab
- **Favicon URL** — Path to custom favicon image
- **Meta Description** — SEO description tag
- **Custom Head HTML** — Additional `<meta>`, `<link>`, `<script>` tags

### Example

```
Title: "My Portfolio"
Favicon: "https://example.com/favicon.ico"
Description: "A creative portfolio showcasing my work"
Custom HTML: <meta name="theme-color" content="#6c63ff">
```

Exports to:
```html
<head>
  <title>My Portfolio</title>
  <meta name="description" content="A creative portfolio showcasing my work" />
  <link rel="icon" href="https://example.com/favicon.ico" />
  <meta name="theme-color" content="#6c63ff">
</head>
```

### Persistent

Head settings are saved to localStorage with your project and restored on reload.

---

## 3. Location Tool — Precise Positioning

### Problem Solved

Dragging elements with a mouse is intuitive but imprecise. The Location Tool allows you to:
- Use math expressions for coordinates
- Anchor elements from different points (center, corners)
- Reference canvas and element dimensions

### Anchor Modes

Choose where coordinates originate:

```
↖ ⬆ ↗        (top-left, top-center, top-right)
⬅ ● ➜        (middle-left, center, middle-right)
↙ ⬇ ↘        (bottom-left, bottom-center, bottom-right)
```

**Example:** Setting `center` and (x=800, y=600):
- Normal mode: top-left at (800, 600)
- **Center mode**: element center at (800, 600)
  - Actual position: (800 - width/2, 600 - height/2)

### Available Variables

Use these in expressions:

| Variable | Meaning |
|----------|---------|
| `cw` | Canvas width |
| `ch` | Canvas height |
| `ew` | Element width |
| `eh` | Element height |

### Expression Examples

```
100                    → Fixed 100px
500/2                  → 250px (arithmetic)
cw/2                   → Horizontal center
(cw-ew)/2              → Horizontal center (precise)
(ch-eh)/2              → Vertical center (precise)
cw-ew-20               → 20px from right edge
ch-100                 → 100px from bottom
(cw*0.75)              → 75% across canvas
100+20                 → 120px (addition)
```

### Interface

In Properties panel (root-level elements only):

```
📍 PLACEMENT
[ ↖ ] [ ⬆ ] [ ↗ ]  ← Anchor selector
[ ⬅ ] [ ● ] [ ➜ ]
[ ↙ ] [ ⬇ ] [ ↘ ]

X: cw/2
Y: (ch-eh)/2

cw=canvas width, ch=canvas height, ew=element width, eh=element height

[↩ Apply Position]  ← Click to apply

[Center] [Corner]   ← Quick presets
```

### Quick Actions

**Center Button**: Centers element on canvas with smart calculation

**Corner Button**: Places element at top-left corner with 20px padding

### Safe Expression Parsing

- Only allows: `0-9`, `+`, `-`, `*`, `/`, `()`, `.`
- No arbitrary code execution
- Division by zero returns error
- Non-finite results rejected
- Results rounded to integers

### Expression Errors

If your expression has errors, you'll see:
```
Position error: Expression did not evaluate to a valid number
```

Check syntax:
- Parentheses balanced: `(cw-ew)/2` ✅ not `(cw-ew/2`
- Variable names exact: `cw` ✅ not `canvasWidth`
- No spaces in variable: `cw` ✅ not `c w`

---

## File Structure

### New Files Created

```
docs/
├── css/
│   └── app.css (moved from docs/app.css)
└── js/
    ├── antigravity.js        (parent constraint detection)
    ├── browser-preview.js    (fake tab UI)
    ├── location-tool.js      (anchor modes & expressions)
    ├── ui-integration.js     (UI binding & hooks)
    └── [existing files...]
```

### Key Changes

**state.js**
- Added `App.headSettings` object
- Updated `saveToStorage()` and `loadFromStorage()`
- Updated `pushHistory()` and `restoreSnapshot()`

**index.html**
- Added script references for new modules
- Added location tool section in properties panel
- Browser preview renders above canvas

**app.css**
- Added styles for browser preview
- Added styles for location tool
- Added styles for head settings modal
- Added styles for antigravity warnings

### Script Load Order

Critical for functionality:

1. `palette-data.js` — Element definitions
2. `state.js` — App state & helpers
3. `canvas.js` — Rendering engine
4. `antigravity.js` — Constraint detection
5. `location-tool.js` — Positioning
6. `browser-preview.js` — Tab UI
7. `panels.js` — Properties UI
8. `ui-integration.js` — Feature integration
9. `export.js` — Export functionality

---

## Integration Points

### Constraint Detection

When element is selected → `checkAndShowAntigravityWarning()` called → Warning UI updated

### Location Tool

When root-level element selected → Location tool UI shown → `updateLocationToolUI()` called

Clicking "Apply Position" → `applyLocationFromUI()` → `applyLocation()` with expressions parsed

### Browser Preview

On document load → `initBrowserPreview()` creates preview element

Head settings modal → `showHeadSettings()` opens editor → `saveHeadSettings()` persists

On export → `getExportedHeadHTML()` generates `<head>` content

---

## Backward Compatibility

- All new features are **non-breaking**
- Existing projects load correctly
- New features activate automatically when needed
- No required migrations or data updates

---

## Performance Considerations

- Expression parsing runs on demand (not continuously)
- Constraint detection runs when element selected
- Browser preview renders once at init
- No background polling or continuous checking

---

## Accessibility

- All buttons have `title` attributes
- Color-coded warnings (orange = caution)
- Text descriptions alongside symbols
- Keyboard accessible (tab navigation)

---

## Future Enhancements

Potential additions:

1. **Smart grid alignment** — Snap to grid during placement
2. **Responsive expressions** — Media query-based positioning
3. **Animation playback** — Preview keyframes with locations
4. **Batch positioning** — Apply to multiple selected elements
5. **Position history** — Undo/redo for placements specifically
6. **Constraint visualization** — Show constraint boundaries on canvas

---

## Troubleshooting

### Expression not working

**Problem**: "Expression error: contains unsafe characters"  
**Solution**: Check for special characters, only use `+`, `-`, `*`, `/`, parentheses, and numbers

**Problem**: "Expression did not evaluate to a valid number"  
**Solution**: Check parentheses are balanced, all variables typed correctly

### Location tool not showing

**Problem**: Location tool section is hidden  
**Solution**: You must select a root-level element (not nested), and not body

### Antigravity warning not appearing

**Problem**: No warning for nested element  
**Solution**: Parent must constrain layout — div without flex/grid won't show warning

### Browser preview not updating

**Problem**: Title change doesn't show in preview  
**Solution**: Head settings are in modal — click ⚙ button to open and save

---

## Technical Details

### Expression Parser

```javascript
parseCoordinateExpression(expr, vars = {})
```

1. Sanitizes expression: `[\d\s\(\)\+\-\*\/\.]+`
2. Replaces variable names with values
3. Evaluates safely using `Function` constructor
4. Returns integer pixel value

### Anchor Calculation

```javascript
calculatePositionFromAnchor(mode, x, y, w, h)
```

Transforms anchor coordinates:

```
center: (x - w/2, y - h/2)
top-right: (x - w, y)
bottom-right: (x - w, y - h)
```

### Constraint Detection Chain

Checks hierarchy up to root:

```
table
  ⬅ tbody (constrained type)
    ⬅ tr (constrained type)
      ⬅ td (constrained by structure)
        ⬅ div with flex (constrained by CSS)
          ⬅ span (constrained by text flow)
            ⬅ [YOUR ELEMENT] ← Multiple constraints
```

Shows full chain in warning message.

---

## Questions?

Refer to code comments in:
- `antigravity.js` — Detection logic
- `location-tool.js` — Expression parsing
- `browser-preview.js` — Head settings management
- `ui-integration.js` — UI binding
