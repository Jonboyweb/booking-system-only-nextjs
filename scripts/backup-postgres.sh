#!/bin/bash

# PostgreSQL Docker Backup Script
# Performs automated backups of PostgreSQL database running in Docker
# Can be run manually or via cron job

# Configuration
PROJECT_DIR="/home/door50a-br/htdocs/br.door50a.co.uk"
BACKUP_DIR="$PROJECT_DIR/backups/postgres"
DOCKER_COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
LOG_FILE="$PROJECT_DIR/logs/backup.log"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup settings
BACKUP_RETENTION_DAYS=7  # Keep backups for 7 days
BACKUP_RETENTION_WEEKLY=4  # Keep 4 weekly backups
BACKUP_RETENTION_MONTHLY=3  # Keep 3 monthly backups

# Database settings (will be read from .env if available)
DB_NAME="${DB_NAME:-backroom_bookings}"
DB_USER="${DB_USER:-backroom_user}"
CONTAINER_NAME="backroom-postgres-prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
    local level=$1
    shift
    local message="$@"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
    
    # Also output to console with colors
    case $level in
        ERROR)
            echo -e "${RED}$message${NC}" >&2
            ;;
        SUCCESS)
            echo -e "${GREEN}$message${NC}"
            ;;
        WARNING)
            echo -e "${YELLOW}$message${NC}"
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_message ERROR "Docker is not installed"
        exit 1
    fi
    
    # Check if docker-compose file exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_message ERROR "Docker compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Load environment variables if .env exists
    if [ -f "$PROJECT_DIR/.env" ]; then
        export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
    fi
}

# Function to check if PostgreSQL container is running
check_container() {
    if ! docker ps --format "table {{.Names}}" | grep -q "$CONTAINER_NAME"; then
        log_message ERROR "PostgreSQL container '$CONTAINER_NAME' is not running"
        exit 1
    fi
    
    # Wait for PostgreSQL to be ready
    log_message INFO "Checking PostgreSQL readiness..."
    for i in {1..30}; do
        if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" >/dev/null 2>&1; then
            log_message INFO "PostgreSQL is ready"
            return 0
        fi
        sleep 1
    done
    
    log_message ERROR "PostgreSQL is not ready after 30 seconds"
    exit 1
}

# Function to perform backup
perform_backup() {
    local backup_type=$1
    local backup_file="$BACKUP_DIR/backup-${backup_type}-${DATE}.sql.gz"
    
    log_message INFO "Starting $backup_type backup of database '$DB_NAME'..."
    
    # Perform the backup
    if docker exec "$CONTAINER_NAME" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --quote-all-identifiers \
        2>>"$LOG_FILE" | gzip -9 > "$backup_file"; then
        
        # Check if backup file is not empty
        if [ -s "$backup_file" ]; then
            local size=$(du -h "$backup_file" | cut -f1)
            log_message SUCCESS "Backup completed successfully: $backup_file (Size: $size)"
            
            # Verify backup integrity
            if gzip -t "$backup_file" 2>/dev/null; then
                log_message SUCCESS "Backup file integrity verified"
                return 0
            else
                log_message ERROR "Backup file is corrupted"
                rm -f "$backup_file"
                return 1
            fi
        else
            log_message ERROR "Backup file is empty"
            rm -f "$backup_file"
            return 1
        fi
    else
        log_message ERROR "Backup failed"
        rm -f "$backup_file"
        return 1
    fi
}

# Function to clean up old backups
cleanup_old_backups() {
    log_message INFO "Cleaning up old backups..."
    
    # Remove daily backups older than retention days
    find "$BACKUP_DIR" -name "backup-daily-*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null
    
    # Keep only specified number of weekly backups
    ls -t "$BACKUP_DIR"/backup-weekly-*.sql.gz 2>/dev/null | tail -n +$((BACKUP_RETENTION_WEEKLY + 1)) | xargs rm -f 2>/dev/null
    
    # Keep only specified number of monthly backups
    ls -t "$BACKUP_DIR"/backup-monthly-*.sql.gz 2>/dev/null | tail -n +$((BACKUP_RETENTION_MONTHLY + 1)) | xargs rm -f 2>/dev/null
    
    log_message INFO "Cleanup completed"
}

# Function to get backup statistics
show_statistics() {
    log_message INFO "Backup Statistics:"
    
    # Count backups by type
    local daily_count=$(ls -1 "$BACKUP_DIR"/backup-daily-*.sql.gz 2>/dev/null | wc -l)
    local weekly_count=$(ls -1 "$BACKUP_DIR"/backup-weekly-*.sql.gz 2>/dev/null | wc -l)
    local monthly_count=$(ls -1 "$BACKUP_DIR"/backup-monthly-*.sql.gz 2>/dev/null | wc -l)
    
    log_message INFO "Daily backups: $daily_count"
    log_message INFO "Weekly backups: $weekly_count"
    log_message INFO "Monthly backups: $monthly_count"
    
    # Calculate total size
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    log_message INFO "Total backup size: ${total_size:-0}"
    
    # Show latest backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | head -n1)
    if [ -n "$latest_backup" ]; then
        log_message INFO "Latest backup: $(basename "$latest_backup")"
    fi
}

# Function to restore backup (for reference)
restore_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log_message ERROR "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_message WARNING "This will restore the database from: $backup_file"
    log_message WARNING "All current data will be replaced!"
    
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_message INFO "Restore cancelled"
        exit 0
    fi
    
    log_message INFO "Restoring database..."
    
    if gzip -dc "$backup_file" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"; then
        log_message SUCCESS "Database restored successfully"
    else
        log_message ERROR "Database restore failed"
        exit 1
    fi
}

# Function to determine backup type based on schedule
determine_backup_type() {
    local day_of_week=$(date +%u)  # 1-7 (Monday-Sunday)
    local day_of_month=$(date +%d)  # 01-31
    
    # Monthly backup on the 1st of each month
    if [ "$day_of_month" == "01" ]; then
        echo "monthly"
    # Weekly backup on Sundays
    elif [ "$day_of_week" == "7" ]; then
        echo "weekly"
    # Daily backup for all other days
    else
        echo "daily"
    fi
}

# Main execution
main() {
    log_message INFO "========================================="
    log_message INFO "PostgreSQL Docker Backup Script Started"
    
    # Parse command line arguments
    case "${1:-}" in
        restore)
            if [ -z "$2" ]; then
                log_message ERROR "Usage: $0 restore <backup-file>"
                exit 1
            fi
            check_prerequisites
            check_container
            restore_backup "$2"
            ;;
        stats)
            check_prerequisites
            show_statistics
            ;;
        cleanup)
            check_prerequisites
            cleanup_old_backups
            show_statistics
            ;;
        manual)
            check_prerequisites
            check_container
            perform_backup "manual"
            cleanup_old_backups
            show_statistics
            ;;
        *)
            # Automatic backup with type determination
            check_prerequisites
            check_container
            backup_type=$(determine_backup_type)
            perform_backup "$backup_type"
            cleanup_old_backups
            show_statistics
            ;;
    esac
    
    log_message INFO "Backup Script Completed"
    log_message INFO "========================================="
}

# Error handling
set -o pipefail
trap 'log_message ERROR "Script failed at line $LINENO"' ERR

# Run main function
main "$@"