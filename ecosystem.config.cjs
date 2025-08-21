module.exports = {
  apps: [
    {
      name: 'whohub',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=whohub-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        // Local development environment variables
        ENVIRONMENT: 'development',
        APP_VERSION: '1.0.0-dev'
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reload)
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork',
      // Restart policy
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: 10000,
      // Logging
      log_file: './logs/whohub.log',
      out_file: './logs/whohub-out.log',
      error_file: './logs/whohub-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
}