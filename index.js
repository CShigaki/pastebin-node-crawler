const cheerio = require('cheerio')
const axios = require('axios');
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
const sleep = require('sleep');

const SEARCH_WORDS = ['carmen', 'help'];
const PASTEBIN_RECENT_PASTES_API_URL = 'https://pastebin.com/api_scraping.php?limit=1';

var visitedPastes = {};
var wordGroup1 = ['lol', 'find', 'exit'];

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });

  var index = 0;

  axios.get(PASTEBIN_RECENT_PASTES_API_URL)
    .then((result) => {
      // console.log(result.data);
      result.data.map((pasteInformation) => {
        if (!visitedPastes[pasteInformation.full_url]) {
          visitedPastes[pasteInformation.full_url] = true;
          cluster.fork({ PASTE_LINK: pasteInformation.scrape_url });
        }
      });
    })
    .catch((error) => {
      console.log(error);
    })

  console.log(`passe ${index}`);
  index++;
} else {
  //console.log(`Worker ${process.env.WORKER_INDEX} started`);
  console.log(`Worker will take care of paste ${process.env.PASTE_LINK}`);
  const pasteToVerify = process.env.PASTE_LINK;

  axios.get(pasteToVerify)
    .then((result) => {
      // console.log(result.data);
      console.log(`Finished processing paste ${pasteToVerify}. Killing this worker.`);
      process.kill(process.pid);
    });
}
