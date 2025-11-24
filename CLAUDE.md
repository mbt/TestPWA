# TestPWA - Web Components Toolbox

## Project Overview
A Progressive Web Application serving as a toolbox and gallery for Web Components. Built with vanilla JavaScript, no frameworks.

## Architecture
- **Framework**: None (Vanilla JS with ES6+)
- **Pattern**: IIFE-based module encapsulation
- **Styling**: Vanilla CSS with dark theme (background: rgb(20,20,20), accent: #501464)
- **PWA**: Service Worker with cache-first strategy

## Key Files
- `index.html` - Single entry point
- `app.js` - Main application bootstrap and routing
- `style.css` - Global styles
- `sw.js` - Service Worker for offline support
- `gallery.js` - Web Components gallery module

## Theme Colors
- Background: `rgb(20, 20, 20)`
- Text: `rgb(200, 200, 200)`
- Accent/Purple: `rgb(80, 20, 100)` / `#501464`

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

## Development Notes
- All DOM is built dynamically by JavaScript
- Nginx configured for SPA-style routing (all paths serve index.html)
- Service Worker caches all assets on install
- Update `sw.js` urlsToCache when adding new files

## Commands
- Development: Open in browser or use dev container
- The app auto-registers its service worker on load
