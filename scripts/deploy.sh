#!/bin/bash

# Deployment script for booking system
# This script is triggered by GitHub webhooks when changes are pushed to main branch

# Configuration
DEPLOY_DIR="/home/cdev/booking-system-only-nextjs"
LOG_DIR="$DEPLOY_DIR/logs"
DEPLOY_LOG="$LOG_DIR/deploy.log"
LOCK_FILE="/tmp/booking-system-deploy.lock"
BACKUP_DIR="$DEPLOY_DIR/backups"
PM2_APP_NAME="booking-system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

# Function to check if deployment is already running
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        log_message "ERROR: Deployment already in progress (lock file exists)"
        exit 1
    fi
}

# Function to create lock file
create_lock() {
    echo $$ > "$LOCK_FILE"
}

# Function to remove lock file
remove_lock() {
    rm -f "$LOCK_FILE"
}

# Trap to ensure lock file is removed on script exit
trap remove_lock EXIT

# Main deployment process
main() {
    log_message "========================================="
    log_message "Starting deployment process..."
    
    # Check for existing deployment
    check_lock
    create_lock
    
    # Change to project directory
    cd "$DEPLOY_DIR" || {
        log_message "ERROR: Failed to change to deploy directory"
        exit 1
    }
    
    # Store current commit hash for rollback if needed
    CURRENT_COMMIT=$(git rev-parse HEAD)
    log_message "Current commit: $CURRENT_COMMIT"
    
    # Fetch latest changes
    log_message "Fetching latest changes from GitHub..."
    git fetch origin main || {
        log_message "ERROR: Failed to fetch from origin"
        exit 1
    }
    
    # Check if there are new changes
    LOCAL_COMMIT=$(git rev-parse HEAD)
    REMOTE_COMMIT=$(git rev-parse origin/main)
    
    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        log_message "Already up to date. No deployment needed."
        exit 0
    fi
    
    # Create backup of current build
    if [ -d ".next" ]; then
        log_message "Creating backup of current build..."
        mkdir -p "$BACKUP_DIR"
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME" .next 2>/dev/null || {
            log_message "WARNING: Failed to create backup (continuing anyway)"
        }
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
    fi
    
    # Pull latest changes
    log_message "Pulling latest changes..."
    git pull origin main || {
        log_message "ERROR: Failed to pull changes"
        exit 1
    }
    
    NEW_COMMIT=$(git rev-parse HEAD)
    log_message "New commit: $NEW_COMMIT"
    
    # Check if package.json has changed
    if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "package.json"; then
        log_message "Package.json has changed. Installing dependencies..."
        npm ci --production=false || {
            log_message "ERROR: Failed to install dependencies"
            log_message "Attempting rollback..."
            git reset --hard "$CURRENT_COMMIT"
            exit 1
        }
    else
        log_message "No dependency changes detected."
    fi
    
    # Check if Prisma schema has changed
    if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "prisma/schema.prisma"; then
        log_message "Prisma schema has changed. Generating client..."
        npx prisma generate || {
            log_message "ERROR: Failed to generate Prisma client"
            log_message "Attempting rollback..."
            git reset --hard "$CURRENT_COMMIT"
            exit 1
        }
        
        # Note: Not running migrations automatically for safety
        log_message "WARNING: Prisma schema changed. You may need to run migrations manually."
    fi
    
    # Build the application
    log_message "Building Next.js application..."
    npm run build || {
        log_message "ERROR: Build failed"
        log_message "Attempting rollback..."
        git reset --hard "$CURRENT_COMMIT"
        
        # Restore backup if exists
        if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
            log_message "Restoring previous build..."
            tar -xzf "$BACKUP_DIR/$BACKUP_NAME" 2>/dev/null
        fi
        
        exit 1
    }
    
    # Restart PM2 process
    log_message "Restarting PM2 process..."
    pm2 restart "$PM2_APP_NAME" || {
        log_message "ERROR: Failed to restart PM2 process"
        exit 1
    }
    
    # Wait for app to be ready
    log_message "Waiting for application to be ready..."
    sleep 5
    
    # Check if app is running
    pm2 status "$PM2_APP_NAME" | grep -q "online" && {
        log_message "SUCCESS: Deployment completed successfully!"
        log_message "Deployed commit: $NEW_COMMIT"
        
        # Get commit message
        COMMIT_MSG=$(git log -1 --pretty=%B)
        log_message "Commit message: $COMMIT_MSG"
    } || {
        log_message "ERROR: Application failed to start properly"
        exit 1
    }
    
    log_message "Deployment process finished."
    log_message "========================================="
}

# Run main function
main "$@"