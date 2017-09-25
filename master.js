const cheerio = require('cheerio')
const axios = require('axios');
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const sleep = require('sleep');
const redis = require("redis");
const client = redis.createClient();

const SEARCH_WORDS = ['carmen', 'help'];
const PASTEBIN_RECENT_PASTES_API_URL = 'https://pastebin.com/api_scraping.php?limit=100';

var wordGroup1 = ['lol', 'find', 'exit', 'function', 'trump', 'help', 'person', 'guide', 'member', 'code'];
var waitingTime = 10;

axios.get(PASTEBIN_RECENT_PASTES_API_URL)
  .then((result) => {
    client.hkeys("visitedPastes", function (err, replies) {
      var pastesLinks = [];

      result.data.map((pasteInformation) => {
        if (replies.indexOf(pasteInformation.full_url) === -1) {
          pastesLinks.push(pasteInformation.full_url);
          client.hmset("visitedPastes", pasteInformation.full_url, true);
        }
      });

      pastesLinks.map((pasteLink) => {
        sleep.msleep(waitingTime);
        waitingTime += 500;
        axios.get(pasteLink)
          .then((result) => {
            console.log(`${pasteLink} - ${result.status}`);
            const rawContent = result.data;

            client.get('occurences', (err, reply) => {
              var occurences = JSON.parse(reply);

              if (!occurences) {
                occurences = [];
              }

              wordGroup1.map((keyword) => {
                const regex = new RegExp(keyword, 'gi');

                if (rawContent.match(regex)) {
                  console.log(`Achou! Link: ${pasteLink}, Keyword: ${keyword}`);
                  occurences.push({ keyword: keyword, uri: pasteLink })
                }
                client.set('occurences', JSON.stringify(occurences));
              });

              console.log(`Finished processing paste ${pasteLink}. Killing this worker.`);
            });
          });
      })
    });
  })
  .catch((error) => {
    console.log(error);
  })
