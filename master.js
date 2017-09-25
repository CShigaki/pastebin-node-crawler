const cheerio = require('cheerio')
const axios = require('axios');
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const sleep = require('sleep');
const redis = require("redis");
const client = redis.createClient();

const SEARCH_WORDS = ['carmen', 'help'];
const PASTEBIN_RECENT_PASTES_API_URL = 'https://pastebin.com/api_scraping.php?limit=250';

var wordGroup1 = ['lol', 'find', 'exit', 'code', 'function', 'Power'];
var waitingTime = 10;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  cluster.on('exit', (worker, code, signal) => {
    console.log(`${worker.process.pid} exited.`);
    if (!Object.keys(cluster.workers).length) {
      process.exit(1);
    }
  });

  axios.get(PASTEBIN_RECENT_PASTES_API_URL)
    .then((result) => {
      var pastesLinks = [];

      result.data.map((pasteInformation) => {
        pastesLinks.push({ full_url: pasteInformation.full_url, scrape_url: pasteInformation.scrape_url });
      });

      for (let i = 0; i < numCPUs; i++) {
        cluster.fork({ PASTES_LINKS: JSON.stringify(pastesLinks), WAITING_TIMEOUT: waitingTime});
      }
    })
    .catch((error) => {
      console.log(error);
    })
} else {
  console.log(`Worker ${process.pid} is running`);
  const pastesLinks = JSON.parse(process.env.PASTES_LINKS);

  sleep.msleep(process.env.WAITING_TIMEOUT);

  client.hkeys("visitedPastes", (err, replies) => {
    pastesLinks.map((pasteLinks) => {
      if (replies.indexOf(pasteLinks.full_url) === -1) {
        client.hmset("visitedPastes", pasteLinks.full_url, true);
        waitingTime += 166;

        client.get('occurences', (err, reply) => {
          var occurences = JSON.parse(reply);

          axios.get(pasteLinks.scrape_url)
            .then((result) => {
              const pageContent = result.data;

              wordGroup1.map((keyword) => {
                const regexString = `/${keyword}/`;
                const regex = new RegExp(regexString, 'gi');

                if (pageContent.match(regex)) {
                  console.log(`achou ${keyword}`);
                  occurences.push({ keyword: keyword, uri: pasteLinks.scrape_url });
                }
              });

              client.set('occurences', JSON.stringify(occurences));
            });
        })
      }
    });
  });
}
