const cheerio = require('cheerio')
const axios = require('axios');
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

const redis = require("redis");
const client = redis.createClient();

const SEARCH_WORDS = ['carmen', 'help'];
const PASTEBIN_RECENT_PASTES_API_URL = 'https://pastebin.com/api_scraping.php?limit=50';

var wordGroup1 = ['lol', 'find', 'exit'];
var waitingTime = 10;

cluster.setupMaster({
  exec: 'worker.js',
})

console.log(`Master ${process.pid} is running`);

cluster.on('exit', (worker, code, signal) => {
  if (!Object.keys(cluster.workers).length) {
    process.exit(1);
  }
});

axios.get(PASTEBIN_RECENT_PASTES_API_URL)
  .then((result) => {
    client.hkeys("visitedPastes", function (err, replies) {
      result.data.map((pasteInformation) => {
        if (replies.indexOf(pasteInformation.full_url) === -1) {
          client.hmset("visitedPastes", pasteInformation.full_url, true, redis.print);
          cluster.fork({ PASTE_LINK: pasteInformation.scrape_url, WAITING_TIMEOUT: waitingTime });
          waitingTime += 166;
        }
      });
    });
  })
  .catch((error) => {
    console.log(error);
  })
