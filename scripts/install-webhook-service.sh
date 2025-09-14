#!/bin/bash

# Script to install the webhook server as a systemd service
# Run this as root on your production server

SERVICE_FILE="webhook-server.service"
SERVICE_NAME="booking-webhook"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_DIR="/etc/systemd/system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_message "$RED" "This script must be run as root"
    exit 1
fi

print_message "$GREEN" "Installing GitHub Webhook Server as systemd service..."

# Copy service file to systemd directory
if [ -f "$SCRIPT_DIR/$SERVICE_FILE" ]; then
    cp "$SCRIPT_DIR/$SERVICE_FILE" "$SYSTEMD_DIR/$SERVICE_NAME.service"
    print_message "$GREEN" "✓ Service file copied to $SYSTEMD_DIR"
else
    print_message "$RED" "Service file not found: $SCRIPT_DIR/$SERVICE_FILE"
    exit 1
fi

# Update paths in service file based on actual installation
read -p "Enter your domain (e.g., booking.yourdomain.com): " DOMAIN
if [ -n "$DOMAIN" ]; then
    sed -i "s|booking.yourdomain.com|$DOMAIN|g" "$SYSTEMD_DIR/$SERVICE_NAME.service"
    print_message "$GREEN" "✓ Updated domain to $DOMAIN"
fi

# Reload systemd daemon
systemctl daemon-reload
print_message "$GREEN" "✓ Systemd daemon reloaded"

# Enable the service to start on boot
systemctl enable $SERVICE_NAME.service
print_message "$GREEN" "✓ Service enabled to start on boot"

# Start the service
systemctl start $SERVICE_NAME.service
print_message "$GREEN" "✓ Service started"

# Check service status
sleep 2
if systemctl is-active --quiet $SERVICE_NAME.service; then
    print_message "$GREEN" "✓ Service is running successfully!"
    
    echo ""
    print_message "$YELLOW" "Useful commands:"
    echo "  Check status:  systemctl status $SERVICE_NAME"
    echo "  View logs:     journalctl -u $SERVICE_NAME -f"
    echo "  Restart:       systemctl restart $SERVICE_NAME"
    echo "  Stop:          systemctl stop $SERVICE_NAME"
    echo "  Disable:       systemctl disable $SERVICE_NAME"
else
    print_message "$RED" "✗ Service failed to start"
    print_message "$YELLOW" "Check logs with: journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

# Create nginx configuration for webhook endpoint
print_message "$GREEN" "Creating nginx configuration for webhook endpoint..."

NGINX_SNIPPET="/etc/nginx/snippets/webhook-proxy.conf"
cat > "$NGINX_SNIPPET" << 'EOF'
# GitHub Webhook Proxy Configuration
location /github-webhook {
    # Only allow POST requests
    limit_except POST {
        deny all;
    }
    
    # Proxy to webhook server
    proxy_pass http://127.0.0.1:9001/webhook;
    proxy_http_version 1.1;
    
    # Headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # GitHub webhook headers
    proxy_set_header X-GitHub-Delivery $http_x_github_delivery;
    proxy_set_header X-GitHub-Event $http_x_github_event;
    proxy_set_header X-Hub-Signature-256 $http_x_hub_signature_256;
    
    # Timeouts
    proxy_connect_timeout 10s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    
    # Buffer settings
    proxy_buffering off;
    proxy_request_buffering off;
    
    # Error handling
    proxy_intercept_errors off;
    
    # Logging
    access_log /var/log/nginx/webhook-access.log;
    error_log /var/log/nginx/webhook-error.log;
}

# Health check endpoint for webhook server
location /github-webhook/health {
    proxy_pass http://127.0.0.1:9001/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    access_log off;
}
EOF

print_message "$GREEN" "✓ Nginx snippet created at $NGINX_SNIPPET"

print_message "$YELLOW" ""
print_message "$YELLOW" "Next steps:"
echo "1. Include the webhook proxy in your site's nginx configuration:"
echo "   include /etc/nginx/snippets/webhook-proxy.conf;"
echo ""
echo "2. Test nginx configuration:"
echo "   nginx -t"
echo ""
echo "3. Reload nginx:"
echo "   systemctl reload nginx"
echo ""
echo "4. Configure GitHub webhook to point to:"
echo "   https://$DOMAIN/github-webhook"
echo ""
echo "5. Test the webhook endpoint:"
echo "   curl https://$DOMAIN/github-webhook/health"

print_message "$GREEN" ""
print_message "$GREEN" "Installation complete!"