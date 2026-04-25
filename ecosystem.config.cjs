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
      // Только "start": PM2 с args "start -p 3000" иначе отдаёт next лишний аргумент и путь порт->каталог /.../3000
      args: "start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      min_uptime: "10s",
      max_restarts: 20,
      restart_delay: 2000,
      exp_backoff_restart_delay: 200,
      listen_timeout: 15000,
      kill_timeout: 15000,
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
