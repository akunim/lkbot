const Discord = require('discord.js');
const RichEmbed = require("discord.js").RichEmbed;
const Parser = require('rss-parser');
const parser = new Parser();
const https = require("https");
const fs = require("fs");

const feedDb = require('./feedDatabaseHandler.js');

async function check( feed ){

  console.log(feed);

  var changeTest = new Promise((resolve) => {
    resolve ("Hello");
  })

  // switch ( feed.type ){
  //   case "rss-comic":
  //     changeTest = rssComicChangeTest(feed);
  //     break;
  //   case "stream-picarto":
  //     changeTest = streamPicartoChangeTest(feed);
  //     break;
  // } 

  if (feed.type == "rss-comic"){
    console.log("YO");
    changeTest = rssComicChangeTest(feed);
  }
  else if (feed.type == "stream-picarto") {
    console.log("YA");
    changeTest = streamPicartoChangeTest(feed);
  }

  changeTest.then((result) => {
    console.log(result);
  })  
  if (changeTest.result){
    console.log("Change Detected");
    // alertChan.send(changeTest.response);
  }

  // if (changeTest.result){
  //   console.log("Change Detected");
    
  // };
}

async function rssComicChangeTest( feed ){
  return new Promise (resolve => {
    let query = 'SELECT lastPoll FROM feeds WHERE url like \'' + feed.url + "'";
    let lastSavedPollPromise = new Promise( function(resolve, reject) {
      feedDb.read(query).then( function( result) {
        resolve(result);
      })
    });
    let livePollPromise = new Promise( function(resolve, reject) {
      pollFeed( feed.url ).then( function( result ) {
        resolve(result);
      });
    });

    lastSavedPollPromise.then( function(result) {
      var lastSavedPoll = JSON.parse(result[0].lastPoll);

      livePollPromise.then( function(result) {
        var livePoll = result;
        // If this url already has a polling entry
        if (lastSavedPoll != null){

          // If update is detected
          if (livePoll.items[0].guid !== lastSavedPoll.items[0].guid){
            var didSaveWork = feedDb.save( feed.url, livePoll );

            didSaveWork.then(
              function(val){
                if (val){
                  const embed = new RichEmbed()
                  .setTitle(livePoll.items[0].title)
                  .setColor(0xFF0000)
                  .setDescription(livePoll.items[0].pubDate + "\n" + livePoll.items[0].link)
                  .attachFiles(["./logo.webp"]);
                  resolve( true, embed );
                }
              }).catch(
                (reason) => {
                  console.log(reason);
                }
              );
            }
        }
        else {
          // If this is the first time the URL is being polled
          console.log("Feed not found");
          feedDb.save( feed.url, livePoll );
        }        
      });
    })
  })
}

async function streamPicartoChangeTest( url ){
  return new Promise( (resolve, reject)=> {
    resolve("Hello");
  })
}

// async function streamPicartoChangeTest( url, alertChan ){
//   //console.log("STREAM: Checking for update... \n");
//   let query = 'SELECT lastPoll FROM feeds WHERE url like \'' + url + "'";
//   let api = await pollApi( url );
//   let apiJson = JSON.parse(api);
//   if (apiJson.online){
//     let result = await readDb( query );

//     if (result !== undefined || result !== "" || result.length > 1){
//       result.forEach((row) => {
//         let json = JSON.parse(row.lastPoll);

//         // If stream is detected
//         if (!json.online){
//           const embed = new RichEmbed()
//             .setTitle(apiJson.name + " is streaming")
//             .setColor(0xFF0000)
//             .setDescription("https://picarto.tv/" + apiJson.name + " \n adult: " + apiJson.adult)
//             .attachFiles([apiJson.thumbnails.web]);
//           //alertChan.send(embed);
//           console.log("STREAM: Update detected \n");
//         }
//         else {
//           //console.log("STREAM: No update detected \n");
//         }
//       })
//     }
//   }
//   saveFeed( url, api );
// }

async function pollFeed( url ){
  return new Promise(resolve => {
    parser.parseURL(url, (err, feed) =>{
      resolve(feed);
    });
  })
}

function pollApi( url ) {
  return new Promise(resolve => {
    https.get(url, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        resolve(data);
      });

      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });
  })
}


//****************************************************
// Manual versions of the above functions, for testing
//****************************************************
async function manualCheckComicFeed(msg){
  let url = "http://latchkeykingdom.smackjeeves.com/rss/";
  let query = 'SELECT lastPoll FROM feeds WHERE url like \'' + url + "'";
  let result = await readDb( query );
  let feed = await pollFeed( url );
  if (result !== undefined || result !== "" || result.length > 1){
    result.forEach((row) => {
      let json = JSON.parse(row.lastPoll);
      
      msg.channel.send("Checking for a new comic...");
      
      if (feed.items[0].guid !== json.items[0].guid){
        msg.channel.send("New Comic found! Trying to save...");
        saveFeed( url, JSON.stringify(feed) );
      }
    })
  }
}

async function readDbAsync( msg, query ){
  var result = await readDb( query );
  fs.writeFile("./dbresult", JSON.stringify(result));
  msg.channel.send( "Write file..." );
}

function pollUrlNoPromise( url, callback ){
  https.get(url, (res) => {
    let data = '';

    // A chunk of data has been recieved.
    res.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    res.on('end', () => {
      callback(res);
    });

    }).on("error", (err) => {
      return("Error: " + err.message);
    });  
}

module.exports = {
  check : check,
  rssComicChangeTest: rssComicChangeTest,
  streamPicartoChangeTest: streamPicartoChangeTest,
  pollUrl: pollUrlNoPromise,
  readDb: readDbAsync, 
  manualCheckComicFeed: manualCheckComicFeed
}