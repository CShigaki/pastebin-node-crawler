const cheerio = require('cheerio')
const axios = require('axios');
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const sleep = require('sleep');
const redis = require("redis");
const client = redis.createClient();

const SEARCH_WORDS = ['carmen', 'help'];
const PASTEBIN_RECENT_PASTES_API_URL = 'https://pastebin.com/api_scraping.php?limit=30';

var wordGroup1 = ['lol', 'find', 'exit', 'function', 'trump', 'help', 'person', 'guide', 'member', 'code'];
var waitingTime = 10;

cluster.setupMaster({
  exec: 'worker.js',
})

console.log(`Master ${process.pid} is running`);

cluster.on('exit', (worker, code, signal) => {
  console.log(`worker ${worker.process.pid} exiting...`);
  if (!Object.keys(cluster.workers).length) {
    process.exit(1);
  }
});

axios.get(PASTEBIN_RECENT_PASTES_API_URL)
  .then((result) => {
    client.hkeys("visitedPastes", function (err, replies) {
      result.data.map((pasteInformation) => {
        if (replies.indexOf(pasteInformation.full_url) === -1) {
          client.hmset("visitedPastes", pasteInformation.full_url, true);
          cluster.fork({ KEYWORDS_TO_VERIFY: JSON.stringify(wordGroup1), PASTE_LINK: pasteInformation.scrape_url, WAITING_TIMEOUT: waitingTime });
          sleep.msleep(waitingTime);
          waitingTime += 500;
        }
      });
    });
  })
  .catch((error) => {
    console.log(error);
  })
