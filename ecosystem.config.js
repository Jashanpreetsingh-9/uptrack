module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './backend',
      script: 'dist/api/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      out_file: '../logs/api-out.log',
      error_file: '../logs/api-error.log',
      merge_logs: true,
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'worker',
      cwd: './backend',
      script: 'dist/worker/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      out_file: '../logs/worker-out.log',
      error_file: '../logs/worker-error.log',
      merge_logs: true,
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
