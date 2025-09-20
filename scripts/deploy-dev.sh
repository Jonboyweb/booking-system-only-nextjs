#!/bin/bash

# Development deployment script for booking system
# This script handles deployments to development/staging servers
# Usage: ./scripts/deploy-dev.sh [--skip-tests] [--reset-db]

# Configuration
DEPLOY_DIR="${DEPLOY_DIR:-$(pwd)}"
LOG_DIR="$DEPLOY_DIR/logs"
DEPLOY_LOG="$LOG_DIR/deploy-dev.log"
LOCK_FILE="/tmp/booking-system-dev-deploy.lock"
PM2_APP_NAME="booking-system-dev"
DOCKER_COMPOSE_FILE="docker-compose.dev.yml"
SKIP_TESTS=false
RESET_DB=false

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --reset-db)
            RESET_DB=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --skip-tests    Skip running tests"
            echo "  --reset-db      Reset database and run fresh migrations"
            echo "  --help          Show this help message"
            exit 0
            ;;
        *)
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    mkdir -p "$LOG_DIR"
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$DEPLOY_LOG"
}

# Function to check if deployment is already running
check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        log_error "Deployment already in progress (lock file exists)"
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

# Function to check Docker services
check_services() {
    log_message "Checking Docker services..."

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if PostgreSQL container exists and is running
    if docker compose -f "$DEPLOY_DIR/$DOCKER_COMPOSE_FILE" ps | grep -q "postgres.*running"; then
        log_message "PostgreSQL container is running"
    else
        log_message "Starting PostgreSQL container..."
        docker compose -f "$DEPLOY_DIR/$DOCKER_COMPOSE_FILE" up -d postgres
        sleep 5
    fi

    # Wait for PostgreSQL to be ready
    local max_attempts=20
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$DEPLOY_DIR/$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready >/dev/null 2>&1; then
            log_message "PostgreSQL is ready"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    log_error "PostgreSQL failed to become ready"
    exit 1
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests (--skip-tests flag)"
        return 0
    fi

    log_message "Running linter..."
    npm run lint || {
        log_warning "Linter found issues, continuing anyway..."
    }

    log_message "Checking database connection..."
    npm run db:check || {
        log_error "Database connection test failed"
        exit 1
    }
}

# Function to reset database
reset_database() {
    if [ "$RESET_DB" = true ]; then
        log_warning "Resetting database (--reset-db flag)"
        read -p "Are you sure you want to reset the database? This will delete all data! (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npx prisma migrate reset --force
            log_message "Database reset complete"

            # Seed the database
            log_message "Seeding database..."
            npx prisma db seed
            npx tsx scripts/seed-admin.ts
            log_message "Database seeding complete"
        else
            log_message "Database reset cancelled"
        fi
    fi
}

# Trap to ensure lock file is removed on script exit
trap remove_lock EXIT

# Main deployment process
main() {
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}Starting development deployment process...${NC}"
    echo -e "${BLUE}=========================================${NC}"

    # Check for existing deployment
    check_lock
    create_lock

    # Change to project directory
    cd "$DEPLOY_DIR" || {
        log_error "Failed to change to deploy directory"
        exit 1
    }

    # Load environment variables
    if [ -f ".env.local" ]; then
        log_message "Loading .env.local"
        export $(grep -v '^#' .env.local | xargs)
    elif [ -f ".env" ]; then
        log_message "Loading .env"
        export $(grep -v '^#' .env | xargs)
    else
        log_warning "No environment file found. Please create .env.local"
    fi

    # Check services
    check_services

    # Store current commit hash
    CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    log_message "Current commit: $CURRENT_COMMIT"

    # Fetch latest changes
    log_message "Fetching latest changes from GitHub..."
    git fetch origin || {
        log_warning "Failed to fetch from origin, continuing with local changes"
    }

    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    log_message "Current branch: $CURRENT_BRANCH"

    # Pull latest changes if on a tracking branch
    if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
        log_message "Pulling latest changes..."
        git pull || {
            log_warning "Failed to pull changes, continuing with local version"
        }

        NEW_COMMIT=$(git rev-parse HEAD)
        log_message "New commit: $NEW_COMMIT"
    fi

    # Check if package.json has changed
    if [ "$CURRENT_COMMIT" != "unknown" ] && git diff --name-only "$CURRENT_COMMIT" HEAD | grep -q "package.json"; then
        log_message "Package.json has changed. Installing dependencies..."
        npm ci || npm install || {
            log_error "Failed to install dependencies"
            exit 1
        }
    else
        log_message "Checking dependencies..."
        npm ci || npm install || {
            log_error "Failed to install dependencies"
            exit 1
        }
    fi

    # Generate Prisma client
    log_message "Generating Prisma client..."
    npx prisma generate || {
        log_error "Failed to generate Prisma client"
        exit 1
    }

    # Handle database operations
    reset_database

    # Run migrations if not resetting
    if [ "$RESET_DB" = false ]; then
        log_message "Running database migrations..."
        npx prisma migrate dev || {
            log_warning "Migration failed or no migrations to run"
        }
    fi

    # Run tests
    run_tests

    # Build the application
    log_message "Building Next.js application..."
    npm run build || {
        log_error "Build failed"
        exit 1
    }

    # Check if PM2 is installed
    if command -v pm2 &> /dev/null; then
        # Check if app is already running
        if pm2 status "$PM2_APP_NAME" 2>/dev/null | grep -q "$PM2_APP_NAME"; then
            log_message "Restarting PM2 process..."
            pm2 restart "$PM2_APP_NAME"
        else
            log_message "Starting PM2 process..."
            pm2 start ecosystem.config.dev.js
        fi

        # Save PM2 process list
        pm2 save
    else
        log_warning "PM2 not installed. You can run 'npm run start' manually"
    fi

    # Wait for app to be ready
    log_message "Waiting for application to be ready..."
    sleep 3

    # Simple health check
    PORT=${PORT:-3001}
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health | grep -q "200"; then
        log_message "✅ Application health check passed"
    else
        log_warning "Health check did not return 200, but app may still be starting"
    fi

    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ Development deployment completed successfully!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo
    echo -e "📋 Next steps:"
    echo -e "  - View app: ${BLUE}http://localhost:$PORT${NC}"
    echo -e "  - View logs: ${BLUE}pm2 logs $PM2_APP_NAME${NC}"
    echo -e "  - Database UI: ${BLUE}npm run db:studio${NC}"
    echo -e "  - pgAdmin: ${BLUE}http://localhost:5050${NC}"
    echo -e "  - MailHog: ${BLUE}http://localhost:8025${NC}"
    echo

    # Show current commit info
    if [ -n "$NEW_COMMIT" ] && [ "$NEW_COMMIT" != "$CURRENT_COMMIT" ]; then
        COMMIT_MSG=$(git log -1 --pretty=%B)
        echo -e "📝 Deployed commit: $NEW_COMMIT"
        echo -e "   Message: $COMMIT_MSG"
    fi
}

# Run main function
main "$@"