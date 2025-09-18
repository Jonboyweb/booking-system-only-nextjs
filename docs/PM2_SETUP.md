# PM2 Production Setup Guide

## Installation

First, install PM2 globally:
```bash
npm install -g pm2
```

## Starting the Application

1. Build the Next.js application:
```bash
npm run build
```

2. Start the application with PM2:
```bash
npm run pm2:start
```

## PM2 Commands

The following npm scripts are available for managing the PM2 process:

- `npm run pm2:start` - Start the application
- `npm run pm2:stop` - Stop the application
- `npm run pm2:restart` - Restart the application
- `npm run pm2:reload` - Gracefully reload the application (zero-downtime)
- `npm run pm2:delete` - Remove the application from PM2
- `npm run pm2:logs` - View application logs
- `npm run pm2:monit` - Monitor the application in real-time

## Auto-start on System Boot

To ensure your application starts automatically when the server reboots:

1. Generate the startup script:
```bash
pm2 startup
```

2. Follow the instructions provided by the command (it will give you a command to run with sudo)

3. Save the current PM2 process list:
```bash
pm2 save
```

## Monitoring

### View Process Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs booking-system
```

### Monitor Resources
```bash
pm2 monit
```

## Log Management

Logs are stored in the `./logs` directory:
- `pm2-out.log` - Standard output
- `pm2-error.log` - Error output
- `pm2-combined.log` - Combined logs

To rotate logs, you can use PM2's log rotation module:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:retain 30
```

## Environment Variables

The PM2 configuration uses environment variables from your `.env` file. Make sure your `.env` file is properly configured before starting the application.

## Troubleshooting

If the application fails to start:

1. Check the logs:
```bash
npm run pm2:logs
```

2. Verify the build was successful:
```bash
npm run build
```

3. Check if port 3000 is available:
```bash
lsof -i :3000
```

4. Restart PM2:
```bash
npm run pm2:restart
```