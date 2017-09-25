module.exports = {
  apps : [{
    name: "pastebin-node-crawler-master",
    script: "./master.js",
    instances: 1,
    exec_mode: "fork"
  }]
}
