module.exports = {
  apps: [
    {
      name: 'booking-system',
      script: 'npm',
      args: 'start',
      cwd: '/home/door50a-br/htdocs/br.door50a.co.uk',
      instances: 2, // Use 2 instances for load balancing
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ],

  // Deployment configuration (optional - for PM2 deploy feature)
  deploy: {
    production: {
      user: 'door50a-br',
      host: '64.176.178.56',
      ref: 'origin/main',
      repo: 'git@github.com:Jonboyweb/booking-system-only-nextjs.git',
      path: '/home/door50a-br/htdocs/br.door50a.co.uk',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --production=false && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload ecosystem.config.prod.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};