const RichEmbed = require("discord.js").RichEmbed;
const Parser = require('rss-parser');
const parser = new Parser();
const https = require("https");
const http = require("http");

var sqlite3 = require('sqlite3').verbose();
// let db = new sqlite3.Database('feedMonitor.db');
//   try {
//     db.run("CREATE TABLE feeds (url TEXT, lastPoll TEXT)", [], (err) =>{
//       if (err){
//         //throw err;
//         console.log("Database already exists");
//       }
//     });  
//   }
//   catch (e){
//     console.log("Database exists -- probably");
//   }

function readDb( query ){
  return new Promise( resolve => {
    db.all(query, [], (err, result) => {
      resolve(result);
    });    
  })

}

async function randomComic( msg ){
  var url = "http://latchkeykingdom.smackjeeves.com/comics/random";
  var data = await httpGet( url );
  var randomUrl = data.resp.headers.location;
  data = await httpGet( randomUrl );
  var comicImage = /(smackjeeves.com\/images\/uploaded\/comics[^"]*)/gm.exec(data.html)[1];
  
  const embed = new RichEmbed()
    .setTitle(randomUrl)
    .setColor(0xFF0000)
    .attachFiles(["http://" + comicImage]);
  msg.channel.send(embed);  
}

function httpGet( url ){
  return new Promise(resolve => {
    http.get(url, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        var result = {resp: resp, html: data};
        resolve(result);
      });

      }).on("error", (err) => {
        console.log("Error: " + err.message);
      });
  })  
}


module.exports = {
  randomComic: randomComic
}