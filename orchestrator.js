const express = require('express');
const app = express();
const server = require('http').createServer(app)
const io = require('socket.io').listen(server);
const cp = require('child_process');
const numCPUs = require('os').cpus().length;

var processedKeywords = [];

const API_URL = 'https://cdqqef2ncjktaygih.stoplight-proxy.io/v1/vps/keywords-monitoring/keywords-to-monitor';
const PASTEBIN_RECENT_PASTES_API_URL = 'https://pastebin.com/api_scraping.php?limit=250';
const NUMBER_OF_WORKERS = 4;

io.on('connection', (client) => {
  client.on('disconnect', () => {
    console.log()
  });
});

server.listen((process.env.PORT || 8005), "0.0.0.0");

function init() {
  setEventHandlers();

  getNonVisitedPastes();

  startCrawlers();

  // setInterval(() => {
  //   startCrawlers();
  // }, 10000);
}

function setEventHandlers() {
  io.sockets.on('connection', onSocketConnection);
}

function startCrawlers() {
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

        const originalPastesLinksLength = pastesLinks.length;

        for (var i = 0; i < NUMBER_OF_WORKERS; i++) {
          var pastesToSendToCrawler = [];
          for (var o = 0; o < originalPastesLinksLength / 4; o++) {
            pastesToSendToCrawler.push(pastesLinks.splice(o, 1))
          }
          cp.fork('./crawler.js', [], {
            env: {
              PASTES_LINKS: JSON.stringify(pastesToSendToCrawler),

            }
          });
        }


      });
    })
    .catch((error) => {
      console.log(error);
    })
}

function onSocketConnection(client) {
  client.on('finishedWork', crawlerFinishedWork);
  client.on('disconnect', playerDisconnected);
}

function playerDisconnected(data) {
  console.log('One of the crawlers died.');
}

function crawlerFinishedWork(data) {
  console.log('One of the crawlers finished it\'s work. He\'s now free to receive more work.')
}

init();
