#!/bin/bash

# Production deployment script for booking system with Docker PostgreSQL
# This script handles manual deployments when changes are pulled from GitHub

# Configuration
DEPLOY_DIR="/home/door50a-br/htdocs/br.door50a.co.uk"
LOG_DIR="$DEPLOY_DIR/logs"
DEPLOY_LOG="$LOG_DIR/deploy.log"
LOCK_FILE="/tmp/booking-system-deploy.lock"
BACKUP_DIR="$DEPLOY_DIR/backups"
PM2_APP_NAME="booking-system"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

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

# Function to backup database
backup_database() {
    log_message "Creating database backup..."
    BACKUP_NAME="db-backup-$(date +%Y%m%d-%H%M%S).sql.gz"
    
    docker compose -f "$DEPLOY_DIR/$DOCKER_COMPOSE_FILE" exec -T postgres \
        pg_dump -U "${DB_USER:-backroom_user}" "${DB_NAME:-backroom_bookings}" | \
        gzip > "$BACKUP_DIR/postgres/$BACKUP_NAME" 2>/dev/null && {
        log_message "Database backup created: $BACKUP_NAME"
        # Keep only last 10 backups
        ls -t "$BACKUP_DIR/postgres"/db-backup-*.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
    } || {
        log_message "WARNING: Failed to create database backup (continuing anyway)"
    }
}

# Function to check Docker and PostgreSQL health
check_services() {
    log_message "Checking Docker services..."
    
    # Check if Docker is running
    if ! systemctl is-active --quiet docker; then
        log_message "ERROR: Docker is not running"
        exit 1
    fi
    
    # Check if PostgreSQL container is running
    if ! docker compose -f "$DEPLOY_DIR/$DOCKER_COMPOSE_FILE" ps | grep -q "backroom-postgres-prod.*running"; then
        log_message "Starting PostgreSQL container..."
        docker compose -f "$DEPLOY_DIR/$DOCKER_COMPOSE_FILE" up -d postgres
        sleep 5
    fi
    
    # Wait for PostgreSQL to be ready
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$DEPLOY_DIR/$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U "${DB_USER:-backroom_user}" >/dev/null 2>&1; then
            log_message "PostgreSQL is ready"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    log_message "ERROR: PostgreSQL failed to become ready"
    exit 1
}

# Trap to ensure lock file is removed on script exit
trap remove_lock EXIT

# Main deployment process
main() {
    log_message "========================================="
    log_message "Starting production deployment process..."
    
    # Check for existing deployment
    check_lock
    create_lock
    
    # Change to project directory
    cd "$DEPLOY_DIR" || {
        log_message "ERROR: Failed to change to deploy directory"
        exit 1
    }
    
    # Load environment variables
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # Check services
    check_services
    
    # Store current commit hash for rollback if needed
    CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    log_message "Current commit: $CURRENT_COMMIT"
    
    # Backup database before deployment
    backup_database
    
    # Create backup of current build
    if [ -d ".next" ]; then
        log_message "Creating backup of current build..."
        mkdir -p "$BACKUP_DIR"
        BACKUP_NAME="build-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME" .next 2>/dev/null || {
            log_message "WARNING: Failed to create build backup (continuing anyway)"
        }
        # Keep only last 5 build backups
        ls -t "$BACKUP_DIR"/build-backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
    fi
    
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
    
    # Pull latest changes
    log_message "Pulling latest changes..."
    git pull origin main || {
        log_message "ERROR: Failed to pull changes"
        exit 1
    }
    
    NEW_COMMIT=$(git rev-parse HEAD)
    log_message "New commit: $NEW_COMMIT"
    
    # Check if docker-compose.prod.yml has changed
    if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "$DOCKER_COMPOSE_FILE"; then
        log_message "Docker Compose configuration has changed. Recreating containers..."
        docker compose -f "$DOCKER_COMPOSE_FILE" down
        docker compose -f "$DOCKER_COMPOSE_FILE" up -d
        sleep 5
        check_services
    fi
    
    # Check if package.json has changed
    if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "package.json"; then
        log_message "Package.json has changed. Installing dependencies..."
        npm ci --production=false || {
            log_message "ERROR: Failed to install dependencies"
            log_message "Attempting rollback..."
            git reset --hard "$CURRENT_COMMIT"
            docker compose -f "$DOCKER_COMPOSE_FILE" up -d postgres
            exit 1
        }
    else
        log_message "No dependency changes detected."
    fi
    
    # Check if Prisma schema has changed
    if git diff --name-only "$CURRENT_COMMIT" "$NEW_COMMIT" | grep -q "prisma/schema.prisma"; then
        log_message "Prisma schema has changed. Generating client and running migrations..."
        
        # Generate Prisma client
        npx prisma generate || {
            log_message "ERROR: Failed to generate Prisma client"
            log_message "Attempting rollback..."
            git reset --hard "$CURRENT_COMMIT"
            exit 1
        }
        
        # Run migrations (with confirmation in production)
        log_message "Running database migrations..."
        npx prisma migrate deploy || {
            log_message "ERROR: Failed to run migrations"
            log_message "Database backup is available at: $BACKUP_DIR/postgres/$BACKUP_NAME"
            log_message "Manual intervention may be required"
            exit 1
        }
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
    
    # Restart PM2 process with zero-downtime reload
    log_message "Reloading PM2 process..."
    pm2 reload "$PM2_APP_NAME" || {
        log_message "WARNING: PM2 reload failed, trying restart..."
        pm2 restart "$PM2_APP_NAME" || {
            log_message "ERROR: Failed to restart PM2 process"
            exit 1
        }
    }
    
    # Wait for app to be ready
    log_message "Waiting for application to be ready..."
    sleep 5
    
    # Health check
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
            log_message "Application health check passed"
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    if [ $attempt -eq $max_attempts ]; then
        log_message "WARNING: Health check did not pass, but continuing..."
    fi
    
    # Check if app is running
    pm2 status "$PM2_APP_NAME" | grep -q "online" && {
        log_message "SUCCESS: Deployment completed successfully!"
        log_message "Deployed commit: $NEW_COMMIT"
        
        # Get commit message
        COMMIT_MSG=$(git log -1 --pretty=%B)
        log_message "Commit message: $COMMIT_MSG"
        
        # Clear CDN cache (optional - requires Cloudflare API)
        # log_message "Clearing Cloudflare cache..."
        # curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
        #      -H "Authorization: Bearer $CF_API_TOKEN" \
        #      -H "Content-Type: application/json" \
        #      --data '{"purge_everything":true}'
        
    } || {
        log_message "ERROR: Application failed to start properly"
        exit 1
    }
    
    log_message "Deployment process finished."
    log_message "========================================="
}

# Run main function
main "$@"