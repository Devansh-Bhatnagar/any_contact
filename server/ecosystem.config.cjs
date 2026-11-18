module.exports = {
  apps: [
    {
      name: "leadsphonebook-api",
      script: "dist/index.js",
      cwd: "/home/leadsphonebook-api/htdocs/api.leadsphonebook.com",
      interpreter: "/root/.nvm/versions/node/v24.15.0/bin/node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 5085,
      },
    },
  ],
};
