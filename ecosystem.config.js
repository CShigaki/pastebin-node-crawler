module.exports = {
  apps : [{
    name: "pastebin-node-crawler-master",
    script: "./master.js",
    instances: 4,
    exec_mode: "cluster",
    cron_restart: "* * * * *"
  }]
}
