FROM nginx:stable

# Copy application files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY application.webmanifest /usr/share/nginx/html/
COPY icons/ /usr/share/nginx/html/icons/

# Copy custom nginx configuration
COPY .devcontainer/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for HTTP
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

