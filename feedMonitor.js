const RichEmbed = require("discord.js").RichEmbed;
const Parser = require('rss-parser');
const parser = new Parser();
const https = require("https");
const fs = require("fs");

var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('feedMonitor.db');
  try {
    db.run("CREATE TABLE feeds (url TEXT, lastPoll TEXT)", [], (err) =>{
      if (err){
        //throw err;
        console.log("Feed monitor database already exists");
      }
    });  
  }
  catch (e){
    console.log("Database exists -- probably");
  }

async function initCheckComicUpdate( url, alertChan ){
  let query = 'SELECT lastPoll FROM feeds WHERE url like \'' + url + "'";
  let result = await readDb( query );
  let feed = await pollFeed( url );
  // If this url already has a polling entry
  if (result !== undefined || result !== "" || result.length > 1){
    result.forEach((row) => {
      let json = JSON.parse(row.lastPoll);
      
      if (feed.items[0].guid !== json.items[0].guid){
        // Update detected
        const embed = new RichEmbed()
          .setTitle(feed.items[0].title)
          .setColor(0xFF0000)
          .setDescription(feed.items[0].pubDate + "\n" + feed.items[0].link)
          .attachFiles(["./logo.webp"]);
        alertChan.send(embed);
        saveFeed( url, JSON.stringify(feed) );
      }
      
    })    
  }
  else {
    // If this is the first time the URL is being polled
    saveFeed( url, JSON.stringify(feed) );
  }
}

async function initCheckStream( url, alertChan ){
  let query = 'SELECT lastPoll FROM feeds WHERE url like \'' + url + "'";
  let api = await pollApi( url );
  let apiJson = JSON.parse(api);
  if (apiJson.online){
    let result = await readDb( query );

    if (result !== undefined || result !== "" || result.length > 1){
      result.forEach((row) => {
        let json = JSON.parse(row.lastPoll);
        // If the last stored value was 'offline', send an alert
        if (!json.online){
          const embed = new RichEmbed()
            .setTitle(apiJson.name + " is streaming")
            .setColor(0xFF0000)
            .setDescription("https://picarto.tv/" + apiJson.name + " \n adult: " + apiJson.adult)
            .attachFiles([apiJson.thumbnails.web]);
          alertChan.send(embed);
        }
      })
    }
  }
  saveFeed( url, api );
}

function readDb( query ){
  return new Promise( resolve => {
    db.all(query, [], (err, result) => {
      resolve(result);
    });    
  })
}

function pollFeed( url ){
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

async function saveFeed( url, feedData ){
  let db = new sqlite3.Database('feedMonitor.db');
  let query = 'SELECT lastPoll FROM feeds WHERE url like \'' + url + "'";
  
    db.all(query, [], (err, result) => {
      if (err){
        console.log(err);
      }
      else{
        // Update existing URL
        if (result.length > 0){
          let data = [feedData, url];
          let q = "UPDATE feeds SET lastPoll = ? WHERE url = ?"

          db.run(q, data, (err)=> {
            if (err){
              console.log(err);
            }
          })
        }
        // Insert new URL and values
        else {
          let q = "INSERT INTO feeds VALUES (?,?)";

          db.run(q, [url, JSON.stringify(feedData)], (err) => {
            if (err){
              console.log(err);
            }
          });      
        }
      }
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
  initCheckComicUpdate: initCheckComicUpdate,
  initCheckStream: initCheckStream,
  pollUrl: pollUrlNoPromise,
  readDb: readDbAsync, 
  manualCheckComicFeed: manualCheckComicFeed
}