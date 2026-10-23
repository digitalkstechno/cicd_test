module.exports = {
  apps: [
    {
      name: 'next-front',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 'max',       // Utilize all available CPU cores, or set to 1
      exec_mode: 'cluster',   // Cluster mode for zero-downtime reloads
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '800M',
      restart_delay: 3000,
      watch: false,
    },
  ],
};
