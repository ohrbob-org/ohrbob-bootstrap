# Ohrbob Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Ohrbob Bootstrap 5 Glassmorphism theme with a custom audio player widget.

**Architecture:** A minimal npm project using Dart Sass to compile custom SCSS alongside Bootstrap 5. 

**Tech Stack:** HTML5, CSS3/SCSS, Bootstrap 5, Dart Sass.

## Global Constraints

- Must use colors from `colors.md`
- Dark blue (`#0b1c5d`) base background
- Glass panels need `backdrop-filter: blur(15px)`
- Audio player widget must be fixed in the bottom corner

---

### Task 1: Project Scaffold and Showcase HTML

**Files:**
- Create: `package.json`
- Create: `index.html`

**Interfaces:**
- Consumes: None
- Produces: Base HTML structure for visual testing, npm scripts for building CSS.

- [ ] **Step 1: Scaffold package.json**

```json
{
  "name": "ohrbob-bootstrap",
  "version": "1.0.0",
  "scripts": {
    "build": "sass scss/theme.scss css/theme.css",
    "watch": "sass --watch scss/theme.scss css/theme.css"
  },
  "dependencies": {
    "bootstrap": "^5.3.2"
  },
  "devDependencies": {
    "sass": "^1.70.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: Node modules installed successfully.

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ohrbob Theme</title>
    <link rel="stylesheet" href="css/theme.css">
</head>
<body>
    <div class="container mt-5">
        <h1 class="mb-4">Ohrbob UI Kit</h1>
        
        <div class="card glass-panel mb-4">
            <div class="card-body">
                <h5 class="card-title">Glass Card</h5>
                <p class="card-text">This is a glassmorphism card.</p>
                <button class="btn btn-primary btn-glow">Primary Button</button>
            </div>
        </div>

        <input type="text" class="form-control glass-input mb-4" placeholder="Glass Input">
    </div>

    <!-- Audio Widget -->
    <div class="audio-widget glass-panel neon-border">
        <div class="audio-info">
            <strong>Track Name</strong>
            <small>Artist</small>
        </div>
        <div class="audio-controls mt-2">
            <button class="btn btn-sm btn-outline-light">◀◀</button>
            <button class="btn btn-sm btn-primary btn-glow">▶</button>
            <button class="btn btn-sm btn-outline-light">▶▶</button>
        </div>
    </div>
</body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git init
git add package.json index.html
git commit -m "chore: scaffold project and showcase html"
```

---

### Task 2: SCSS Architecture and Glass Theme

**Files:**
- Create: `scss/_variables.scss`
- Create: `scss/_glass.scss`
- Create: `scss/theme.scss`
- Create: `css/` (directory)

**Interfaces:**
- Consumes: Bootstrap 5 source
- Produces: Compiled `css/theme.css` with core glassmorphism styles

- [ ] **Step 1: Create _variables.scss**

```scss
$yellow: #fdb404;
$orange-light: #fd9e03;
$dark-blue: #0b1c5d;
$light-blue: #4d48f2;
$strong-orange: #fb6002;

$body-bg: $dark-blue;
$body-color: #ffffff;
$primary: $strong-orange;
```

- [ ] **Step 2: Create _glass.scss**

```scss
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.neon-border {
  border-color: $yellow;
  box-shadow: 0 0 10px rgba($yellow, 0.5);
}

.btn-glow {
  box-shadow: 0 0 15px rgba($primary, 0.6);
  border: none;
  &:hover {
    box-shadow: 0 0 25px rgba($primary, 0.8);
    background: lighten($primary, 5%);
  }
}

.glass-input {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  &:focus {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-color: $light-blue;
    box-shadow: 0 0 10px rgba($light-blue, 0.5);
  }
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}
```

- [ ] **Step 3: Create theme.scss**

```scss
@import "variables";
@import "../node_modules/bootstrap/scss/bootstrap";
@import "glass";
```

- [ ] **Step 4: Build CSS and verify**

Run: `mkdir -p css && npm run build`
Expected: `css/theme.css` is generated without errors.

- [ ] **Step 5: Commit**

```bash
git add scss css
git commit -m "feat: implement base glassmorphism theme"
```

---

### Task 3: Floating Audio Widget

**Files:**
- Create: `scss/_audio-widget.scss`
- Modify: `scss/theme.scss`

**Interfaces:**
- Consumes: Variables and glass mixins
- Produces: CSS for the fixed floating widget

- [ ] **Step 1: Create _audio-widget.scss**

```scss
.audio-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  padding: 15px;
  border-radius: 12px;
  z-index: 1050; /* Above bootstrap modals/navs */
  transition: all 0.3s ease;
  
  .audio-info {
    display: flex;
    flex-direction: column;
    strong { font-size: 1.1rem; }
    small { opacity: 0.8; }
  }
  
  .audio-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
```

- [ ] **Step 2: Update theme.scss**

Run: `echo '@import "audio-widget";' >> scss/theme.scss`

- [ ] **Step 3: Rebuild CSS**

Run: `npm run build`
Expected: Completes without error.

- [ ] **Step 4: Commit**

```bash
git add scss/_audio-widget.scss scss/theme.scss css/theme.css
git commit -m "feat: add floating audio widget styles"
```