# TestPWA - Web Components Toolbox

## Project Overview
A Progressive Web Application serving as a toolbox and gallery for Web Components. Built with vanilla JavaScript, no frameworks.

## Architecture
- **Framework**: None (Vanilla JS with ES6+)
- **Pattern**: IIFE-based module encapsulation
- **Styling**: Vanilla CSS with CSS custom properties
- **Theme**: Light/dark mode with system preference detection and manual toggle
- **PWA**: Service Worker with cache-first strategy
- **Routing**: Hash-based routing (#/home, #/gallery)

## Key Files
- `index.html` - Single entry point
- `app.js` - Main application bootstrap and hash-based routing
- `home.js` - Landing page module
- `gallery.js` - Web Components gallery module
- `theme-toggle.js` - Light/dark mode toggle with localStorage persistence
- `style.css` - Global styles with CSS custom properties
- `sw.js` - Service Worker for offline support (cache-first)

## Web Components
- `analog-clock.js` - Customizable analog clock with Shadow DOM encapsulation

## Theme System

### Colors
**Dark Mode (default):**
- Background: `rgb(20, 20, 20)`
- Text: `rgb(200, 200, 200)`
- Accent/Purple: `rgb(80, 20, 100)` / `#501464`

**Light Mode:**
- Background: `rgb(250, 250, 250)`
- Text: `rgb(40, 40, 40)`
- Accent/Purple: `rgb(120, 40, 160)`

### Theme Management
- Respects system color scheme preference via `prefers-color-scheme`
- Manual override available via toggle button (stored in localStorage)
- Automatic detection of system theme changes
- Smooth transitions between themes

## Web Components Gallery
The gallery serves as a library showcase with:
- **Carousel**: Rotates through up to 5 featured component cards
- **Component List**: All components sorted by default in reverse chronological order

### Component Data Structure
Each component entry should include:
- `id`: Unique identifier
- `name`: Display name
- `description`: Brief description
- `dateAdded`: ISO date string for sorting
- `tags`: Array of category tags
- `featured`: Boolean for carousel inclusion

## Component Implementation Checklist

**CRITICAL: When adding a new Web Component, you MUST complete ALL of these steps. Missing any step will result in a broken/orphaned component.**

### Required Steps (in order):

1. **Create the component file** (`component-name.js`)
   - Must extend `HTMLElement`
   - Use closed Shadow DOM: `this.attachShadow({ mode: 'closed' })`
   - Implement lifecycle callbacks (`connectedCallback`, `disconnectedCallback`)
   - Use IIFE pattern if needed for helper functions
   - Document CSS custom properties in header comment

2. **Load component in `index.html`**
   - Add `<script src="/component-name.js"></script>` tag
   - Place BEFORE `app.js` but AFTER dependencies
   - Maintain alphabetical or logical grouping

3. **Register in `gallery.js`**
   - Add entry to the `components` array (lines 8-57)
   - Include ALL required fields:
     - `id`: matches custom element tag name
     - `name`: display name
     - `description`: what it does
     - `dateAdded`: ISO date string (today's date)
     - `tags`: array of relevant categories
     - `featured`: true/false (max 5 featured total)

4. **Update Service Worker `sw.js`**
   - Add component file to `urlsToCache` array
   - Increment `CACHE_NAME` version (e.g., `testpwa-v10` → `testpwa-v11`)
   - This ensures offline functionality

5. **Test the integration**
   - Check gallery displays the component card
   - Verify featured carousel if `featured: true`
   - Confirm component loads and renders
   - Test offline functionality (Service Worker cache)

### Example Component Registration:

```javascript
// In gallery.js components array:
{
    id: 'my-widget',                    // Custom element name
    name: 'My Widget',                  // Display name
    description: 'Does something cool', // Brief description
    dateAdded: '2025-11-24T00:00:00Z', // ISO date string
    tags: ['utility', 'interactive'],   // Categories
    featured: true                      // Show in carousel?
}
```

### Common Mistakes to Avoid:

- ❌ Creating component file but not loading in `index.html`
- ❌ Loading in `index.html` but not registering in `gallery.js`
- ❌ Registering in gallery but forgetting to update `sw.js`
- ❌ Using wrong `id` (must match custom element tag name)
- ❌ Missing required fields in component data
- ❌ Not incrementing Service Worker cache version
- ❌ More than 5 components marked as `featured: true`

## Development Notes
- All DOM is built dynamically by JavaScript
- Nginx configured for SPA-style routing (all paths serve index.html)
- Service Worker uses cache-first strategy for offline support
- Web Components use closed Shadow DOM for encapsulation
- Components customizable via CSS custom properties
- Hash-based routing pattern: `#/home`, `#/gallery`, `#/components/{id}`

## Commands
- Development: Open in browser or use dev container
- The app auto-registers its service worker on load
