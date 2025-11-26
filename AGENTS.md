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
- `index.html` - Single entry point with all script imports
- `app.js` - Main application bootstrap and hash-based routing
- `home.js` - Landing page module
- `gallery.js` - Web Components gallery module with carousel and component list
- `component-demos.js` - Comprehensive documentation and demos for each component
- `theme-toggle.js` - Light/dark mode toggle with localStorage persistence
- `style.css` - Global styles with CSS custom properties
- `sw.js` - Service Worker for offline support (cache-first)

## Web Components
- `video-player-chapters.js` - Video player with chapter navigation, custom controls, and keyboard shortcuts
- `digital-clock.js` - Digital clock with configurable format, blinking colons, and customizable blink rate
- `analog-clock.js` - Analog clock with smooth animated hands and reduced motion support

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
   - Add entry to the `components` array (around lines 8-70)
   - Include ALL required fields:
     - `id`: matches custom element tag name
     - `name`: display name
     - `description`: what it does
     - `dateAdded`: ISO date string (today's date in format '2025-11-25T00:00:00Z')
     - `tags`: array of relevant categories
     - `featured`: true/false (max 5 featured total - currently at 6, needs cleanup)

4. **Update Service Worker `sw.js`**
   - Add component file to `urlsToCache` array
   - Increment `CACHE_NAME` version (current: `testpwa-v18`, increment to `testpwa-v19`)
   - Add any media assets (videos, images) to cache if needed
   - This ensures offline functionality

5. **Add component demo in `component-demos.js`**
   - Create a `get[ComponentName]Demo()` function following existing patterns
   - Include: basic usage, variations, customization examples, attributes table, CSS properties table
   - Add case to `getDemoContent()` switch statement
   - Use helper functions: `createSection()`, `createDemoContainer()`, `createCodeBlock()`, `createPropertyTable()`

6. **Test the integration**
   - Check gallery displays the component card
   - Verify featured carousel if `featured: true` (max 5 components)
   - Confirm component loads and renders on demo page
   - Test component demo page at `#/components/{component-id}`
   - Test offline functionality (Service Worker cache)
   - Verify all customization examples work
   - Check keyboard/accessibility features if applicable

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
- ❌ Forgetting to add demo function in `component-demos.js`
- ❌ Using wrong `id` (must match custom element tag name)
- ❌ Missing required fields in component data
- ❌ Not incrementing Service Worker cache version
- ❌ More than 5 components marked as `featured: true`
- ❌ Not adding media assets (videos, images) to Service Worker cache
- ❌ Date format not in ISO format (must be: '2025-11-25T00:00:00Z')

## Development Notes
- All DOM is built dynamically by JavaScript
- Nginx configured for SPA-style routing (all paths serve index.html)
- Service Worker uses cache-first strategy for offline support
- Web Components use closed Shadow DOM for encapsulation
- Components customizable via CSS custom properties
- Hash-based routing pattern: `#/home`, `#/gallery`, `#/components/{id}`
- Demo pages show live examples with code snippets
- Current Service Worker version: v18 (increment when adding components)
- Media files (like test_video.mp4) should be added to Service Worker cache

## Current Component Status
**Implemented (3 components):**
- ✅ video-player-chapters (Featured)
- ✅ digital-clock (Featured)
- ✅ analog-clock (Featured)

**Placeholder/Example components (5 components):**
- 🔲 example-button (Featured - needs implementation)
- 🔲 example-card (Featured - needs implementation)
- 🔲 example-modal (Featured - needs implementation)
- 🔲 example-tabs (Not featured)
- 🔲 example-accordion (Not featured)

**Note:** Currently 6 components marked as `featured: true` but max is 5. Need to adjust when implementing real components.

## Commands
- Development: Open in browser or use dev container
- The app auto-registers its service worker on load
