/**
 * PM2: Next.js в production (порт 3000).
 * На сервере: pm2 start ecosystem.config.cjs
 * или: pm2 reload ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "business-card-site",
      cwd: "/var/www/business-card-site",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
