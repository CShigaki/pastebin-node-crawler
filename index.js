const cheerio = require('cheerio')
const axios = require('axios');
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const sleep = require('sleep');

const SEARCH_WORDS = ['carmen', 'help'];
const BASE_PASTEBIN_URL = 'https://pastebin.com/';
const PASTES_LINKS = '.right_menu li a';
const PASTE_CONTENT = '#paste_code'

var workers = [];
var busyWorkers = {};
var pasteLinkFetcherWorker = null;
var visitedPastes = {};
var wordGroup1 = ['lol', 'find', 'exit'];

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    if (i == 0) {
      pasteLinkFetcherWorker = cluster.fork({ WORKER_INDEX: i });

      pasteLinkFetcherWorker.on('message', (value) => {
        console.log(value);

        if (value.url) {
          var index = 0;
          workers.map((index, worker) => {
            worker.send({ url: value.url });
            index++;
          });
        }

        if (value.workerId) {
          delete busyWorkers[value.workerId];
        }
      });
    }
    workers.push(cluster.fork({ WORKER_INDEX: i }));
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });

  // while (true) {
  //   axios.get(BASE_PASTEBIN_URL)
  //     .then((result) => {
  //       const $ = cheerio.load(result.data, { decodeEntities: true });
  //
  //       $(PASTES_LINKS).each((i, elem) => {
  //         const pasteLink = elem.attribs.href;
  //
  //         if (visitedPastes[pasteLink] == undefined) {
  //           console.log('New unvisited paste found. Link: ' + pasteLink);
  //           workers[Math.random() * workers.length].send('new-paste', { url: (BASE_PASTEBIN_URL + pasteLink) });
  //         }
  //       });
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     })
  //
  //   sleep.sleep(2);
  // }
} else {
  //console.log(process.env.WORKER_INDEX);
  if (process.env.WORKER_INDEX == 0) {
    while (true) {
      axios.get(BASE_PASTEBIN_URL)
        .then((result) => {
          const $ = cheerio.load(result.data, { decodeEntities: true });

          $(PASTES_LINKS).each((i, elem) => {
            const pasteLink = elem.attribs.href;

            if (visitedPastes[pasteLink] == undefined) {
              console.log('New unvisited paste found. Link: ' + pasteLink);
              process.send({ url: (BASE_PASTEBIN_URL + pasteLink) });
              visitedPastes[pasteLink] = true;
            }
          });
        })
        .catch((error) => {
          console.log(error);
        })
      sleep.sleep(5);
    }
  }

  process.on('message', function(value) {
    axios.get(value.url)
      .then((result) => {
        const $ = cheerio.load(result.data, { decodeEntities: true });
        let pasteContent = $(PASTE_CONTENT).val();

        wordGroup1.map((word) => {
          let regex = new RegExp(word, 'i');
          if (regex.test(pasteContent)) {
            console.log('Found word ' + word + ' occurence. Current URL: ' + value.url);
          }
        });

        proccess.send({ workerId: process.env.WORKER_INDEX });
      });
  });

  console.log(`Worker ${process.pid} started`);
}
