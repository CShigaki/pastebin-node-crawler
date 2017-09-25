const axios = require('axios');
const sleep = require('sleep');

console.log(`Worker will take care of paste ${process.env.PASTE_LINK}`);
const pasteToVerify = process.env.PASTE_LINK;

sleep.msleep(process.env.WAITING_TIMEOUT);
axios.get(pasteToVerify)
  .then((result) => {

    console.log(`Finished processing paste ${pasteToVerify}. Killing this worker.`);
    process.exit(1);
  });
