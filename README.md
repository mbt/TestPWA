# Test PWA

A test Progressive Web Application demonstrating core PWA capabilities including offline support, installability, and responsive design.

## Features

- **Progressive Web App**: Installable on desktop and mobile devices
- **Offline Support**: Service worker provides offline functionality
- **Responsive Design**: Works on all device sizes
- **Modern UI**: Clean, dark-themed interface
- **Docker Support**: Easy deployment with nginx

## Project Structure

```
TestPWA/
├── .devcontainer/
│   ├── devcontainer.json    # VS Code Dev Container configuration
│   ├── Dockerfile            # Docker container setup
│   └── nginx.conf            # Nginx server configuration
├── icons/                    # PWA icon assets (32px to 512px)
├── app.js                    # Application bootstrap code
├── sw.js                     # Service worker for offline support
├── style.css                 # Application styles
├── index.html                # Main HTML entry point
├── application.webmanifest   # PWA manifest file
├── package.json              # Project metadata and scripts
└── README.md                 # This file
```

## Requirements

- Modern web browser with Service Worker support
- Node.js 14+ (for local development server)
- Docker (optional, for containerized deployment)

## Quick Start

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TestPWA
   ```

2. Start a local web server:
   ```bash
   npm start
   ```
   Or use any static file server:
   ```bash
   python3 -m http.server 8080
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Docker Deployment

1. Build the Docker image:
   ```bash
   npm run docker:build
   ```
   Or manually:
   ```bash
   docker build -f .devcontainer/Dockerfile -t testpwa .
   ```

2. Run the container:
   ```bash
   npm run docker:run
   ```
   Or manually:
   ```bash
   docker run -p 8080:80 testpwa
   ```

3. Access the app at:
   ```
   http://localhost:8080
   ```

## PWA Installation

Once the application is running:

1. Open it in a PWA-compatible browser (Chrome, Edge, Firefox, Safari)
2. Look for the "Install" or "Add to Home Screen" prompt
3. Click to install the PWA on your device
4. The app will be available as a standalone application

## Development

### Testing Service Worker

The service worker caches all static assets for offline use. To test:

1. Open the app in your browser
2. Open DevTools (F12) and go to the Application tab
3. Check the Service Workers section to see the registered worker
4. Enable "Offline" mode in the Network tab
5. Reload the page - it should still work!

### Modifying the Cache

When you update static assets, increment the cache version in `sw.js`:

```javascript
const CACHE_NAME = 'testpwa-v2'; // Increment version
```

### VS Code Dev Container

This project includes a Dev Container configuration:

1. Install the "Remote - Containers" extension in VS Code
2. Open the project folder
3. Click "Reopen in Container" when prompted
4. The container will build and you can develop inside it

## Technical Details

### Service Worker Strategy

The app uses a **cache-first** strategy:
- On install: All static assets are cached
- On fetch: Serve from cache if available, fallback to network
- On activate: Old caches are cleaned up

### Supported Browsers

- Chrome/Edge 45+
- Firefox 44+
- Safari 11.1+
- Opera 32+

### Security Headers

The nginx configuration includes:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block

## Scripts

Available npm scripts:

- `npm start` - Start local development server
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run validate:manifest` - Validate PWA manifest

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

If you find any bugs or have feature requests, please create an issue in the repository.

## Author

Michael B. Trausch

## Acknowledgments

- Built with vanilla JavaScript - no frameworks required
- Icons and assets are part of the test application
- Uses nginx for production deployment
