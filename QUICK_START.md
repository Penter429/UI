# 🚀 UI Builder — Quick Start Guide

## What Just Happened?

Your UI Builder has been upgraded with **3 professional features**:

1. **Free-Move Layout Detection** — Warns when elements can't move freely + offers solutions
2. **Browser Preview Frame** — Shows a browser-style title bar and favicon embedded above the canvas
3. **Precision Placement Tool** — Position elements using math expressions (e.g., `cw/2`, `(ch-eh)/2`)

All files organized, styles added, state management updated.

---

## 🎮 Try It Now

### 1. Browser Preview
```
👀 Look at top of canvas → Should see title bar with page icon
Click ⚙ button → Edit title, favicon, meta tags
```

### 2. Placement Tool
```
1. Add element to canvas (drag from palette)
2. Make sure it's root-level (not nested)
3. Scroll Properties → Find "📍 Placement" section
4. Click anchor point (center button: ●)
5. Enter: X = (cw-ew)/2, Y = (ch-eh)/2
6. Click "Apply Position" → Element centers!
```

### 3. Free-Move Detection
```
1. Add a div
2. Add a flex container inside it
3. Put another element inside the flex container
4. Select the inner element
5. See warning: "⚠️ Layout Constraint Detected"
6. Choose: Convert to Free-Move OR Detach to Root
```

---

## 📚 Documentation Files

**Read these in order:**
1. `IMPLEMENTATION_SUMMARY.md` — High-level overview + examples
2. `FEATURES_GUIDE.md` — Detailed feature documentation
3. `VERIFICATION_CHECKLIST.md` — Technical verification

---

## 🎯 Key Differences

### Before
- ❌ Nested elements in flex/grid couldn't move freely
- ❌ No way to position elements precisely
- ❌ No visual preview of page title/favicon
- ❌ Had to manually calculate position offsets

### After
- ✅ Automatic layout constraint detection
- ✅ Free-move solutions offered instantly
- ✅ Expression-based precise positioning
- ✅ Live browser preview
- ✅ Smart presets (center, corner)
- ✅ Math support: `cw/2`, `ch-100`, `(cw-ew)/2`

---

## 💡 Common Use Cases

### Center element on canvas
```
📍 Placement section:
Anchor: Center (● button)
X: (cw-ew)/2
Y: (ch-eh)/2
Apply
```

### Position in top-left corner
```
Anchor: Top-Left (↖ button)
X: 20
Y: 20
Apply
```

### Right side with offset
```
Anchor: Top-Right (↗ button)
X: cw-100   (100px from right)
Y: 50
Apply
```

### Quick center
```
Click "Center" button → Done! ⚡
```

---

## 🔧 Technical Details

**What Changed:**
```
/docs/
├── css/app.css           ← Moved here, +200 lines
├── index.html            ← +40 lines, +4 scripts
└── js/
    ├── state.js          ← +30 lines (head settings)
    ├── antigravity.js    ← NEW (230 lines)
    ├── location-tool.js  ← NEW (190 lines)
    ├── browser-preview.js ← NEW (245 lines)
    └── ui-integration.js  ← NEW (220 lines)
```

**Total: ~27KB new code, 100% backward compatible**

---

## 🧠 How It Works (Simplified)

### Location Tool
1. You enter: `cw/2`, `(ch-eh)/2`
2. Parser replaces: `cw`→window width, `ch`→window height, `ew`→element width, `eh`→element height
3. Evaluates: `(1600/2, (1200-120)/2)` = `(800, 540)`
4. Applies anchor offset if needed
5. Updates element position

### Free-Move Detection
1. You select nested element
2. System checks parent tag
3. If table/flex/grid/ul/ol: Show warning
4. You pick solution:
   - Convert: Parent gets `position: relative`, you get `position: absolute`
   - Detach: Move to root level
   - Dismiss: Keep current layout

### Browser Preview
1. Stores title, favicon, meta in App.headSettings
2. Shows live in preview bar
3. Exports to `<head>` when you download
4. Persists in localStorage with project

---

## ❓ FAQ

**Q: Why is element locked to grid/flex?**  
A: Browser layout controls it. Use "Convert to Free-Move" or "Detach to Root".

**Q: Can I use `width*2` in expressions?**  
A: No, use: `ew*2` = element width × 2

**Q: Where's the Location Tool?**  
A: Only shows for root-level elements. Select nested element first.

**Q: How do I preview on phone?**  
A: Download the HTML/CSS/JS and test in device browser.

**Q: Will my old projects break?**  
A: No! Everything is backward compatible. Old projects load as-is.

---

## 📏 Variable Reference

**Available in expressions:**
| Variable | Means | Example |
|----------|-------|---------|
| `cw` | Canvas width (1600) | `cw/2` = 800 |
| `ch` | Canvas height (1200) | `ch-100` = 1100 |
| `ew` | Element width | `cw-ew` = canvas-element |
| `eh` | Element height | `ch-eh` = canvas-element |

---

## 🎨 Anchor Reference

```
↖              ⬆              ↗
top-left    top-center    top-right

⬅                ●               ➜
middle-left    center      middle-right

↙              ⬇              ↘
bottom-left  bottom-center  bottom-right
```

Each anchor changes where (x, y) coordinates originate from element.

---

## ✨ Pro Tips

1. **Combination**: Use anchor + expressions for pixel-perfect layouts
2. **Presets**: Click "Center" or "Corner" for instant positioning
3. **Math**: `100+50`, `200-20`, `1000*0.5` all work
4. **Division**: `cw/2`, `1000/3`, `cw/4` supported
5. **Nesting**: Use "Detach to Root" to free nested elements
6. **Favicon**: Use full URL: `https://example.com/icon.png`

---

## 🐛 Troubleshooting

**Location Tool not showing?**
→ Select a root-level element (not nested, not body)

**Expression error showing?**
→ Check variable names: `cw` not `canvasWidth`

**Constraint warning not appearing?**
→ Select child of flex/grid/table element

**Head settings not saving?**
→ Click ⚙, edit, then click "Save Settings"

---

## 📞 Need Help?

**Step-by-step:** → `IMPLEMENTATION_SUMMARY.md`  
**Deep dive:** → `FEATURES_GUIDE.md`  
**Verification:** → `VERIFICATION_CHECKLIST.md`  
**Code comments:** → Check `.js` files directly

---

## 🎉 You're All Set!

The three new systems are:
- ✅ Fully integrated
- ✅ Documented
- ✅ Ready to use
- ✅ Backward compatible

Enjoy precise positioning and smarter layout control!

**Questions?** Check the docs above. Happy building! 🚀
