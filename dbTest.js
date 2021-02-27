const feedDb = require('./feedDatabaseHandler.js');
const feedMonitor = require('./feedMonitor.js');

// In the bot, you'll basically be calling this function every 30 seconds
// async function doQuery (){
//     let query = 'SELECT * FROM feeds';
//     let feeds = await feedDb.read( query );
//     feeds.forEach((feed) => {
//         feedMonitor.check(feed);
//     })
// }

function initMontitor() {
    let query = 'SELECT * FROM feeds';
    let readFeeds = new Promise( function(resolve, reject) {
      feedDb.read(query).then( function(result) {
        resolve(result);
      })
    });

    readFeeds.then( function(result){
        result.forEach( (feed)=> {
            //console.log(feed.url);
            feedMonitor.check(feed);
        })
    })
  }

feedDb.init();

initMontitor();
//doQuery();