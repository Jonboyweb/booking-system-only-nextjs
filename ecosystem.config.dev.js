module.exports = {
  apps: [
    {
      name: 'booking-system-dev',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: process.cwd(), // Use current working directory
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false, // Set to true if you want PM2 to restart on file changes
      max_memory_restart: '500M', // Lower memory limit for dev
      env: {
        NODE_ENV: 'development',
        PORT: 3001, // Different port to avoid conflicts
      },
      error_file: './logs/dev-error.log',
      out_file: './logs/dev-out.log',
      log_file: './logs/dev-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 3000,
      wait_ready: true,
      listen_timeout: 5000,
      min_uptime: '5s',
      max_restarts: 5,
      restart_delay: 2000,

      // Development-specific settings
      node_args: '--inspect=0.0.0.0:9229', // Enable Node.js debugging
      interpreter_args: '--max-old-space-size=512', // Lower memory allocation
    }
  ],

  // Optional deployment configuration for development server
  deploy: {
    development: {
      user: 'cdev', // Development server user
      host: 'localhost', // or your dev server IP
      ref: 'origin/develop', // Development branch
      repo: 'git@github.com:Jonboyweb/booking-system-only-nextjs.git',
      path: '/home/cdev/booking-system-only-nextjs',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && npx prisma generate && npx prisma migrate dev && npm run build && pm2 reload ecosystem.config.dev.js',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};