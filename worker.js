const axios = require('axios');
const sleep = require('sleep');
const redis = require("redis");
const client = redis.createClient();

//console.log(`Worker will take care of paste ${process.env.PASTE_LINK}`);
const pasteToVerify = process.env.PASTE_LINK;
const keywordsToVerify = JSON.parse(process.env.KEYWORDS_TO_VERIFY);

sleep.msleep(process.env.WAITING_TIMEOUT);
axios.get(pasteToVerify)
  .then((result) => {
    console.log(result.status)
    const rawContent = result.data;

    client.get('occurences', (err, reply) => {
      var occurences = JSON.parse(reply);

      if (!occurences) {
        occurences = [];
      }

      keywordsToVerify.map((keyword) => {
        const regex = new RegExp(keyword, 'gi');

        if (rawContent.match(regex)) {
          console.log(`Achou! Link: ${pasteToVerify}, Keyword: ${keyword}`);
          occurences.push({ keyword: keyword, uri: pasteToVerify })
          client.set('occurences', JSON.stringify(occurences));
        }
      });

      console.log(`Finished processing paste ${pasteToVerify}. Killing this worker.`);
      process.exit(1);
    });
  });
