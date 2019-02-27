const Discord = require('discord.js');
const RichEmbed = require('discord.js').RichEmbed;
const client = new Discord.Client();
const rp = require('request-promise');

const monitor = require("./feedMonitor.js");
const fun = require("./fun.js");

var secrets;

try {
  secrets = require(process.argv[2]);  
}
catch (e) {
  throw "Bad secrets path, exiting...";
}

const BOT_KEY = secrets.BOT_KEY();
var urlRegex = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
var emojiRegex = new RegExp(/:([^\s]*):/gi);
const COMMAND_SIGNS = ["!", "/", "."];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // PASSIVE ACTIONS
  console.log("Getting announcement channel...");
  let announcementChannel = "";
  client.guilds.forEach((guild) => {
    guild.channels.forEach((channel) => {
      if (channel.id === "304823513124962305"){
        announcementChannel = channel;
      }
    })
  })
  function comicMon() {
    monitor.initCheckComicUpdate("http://latchkeykingdom.smackjeeves.com/rss/", announcementChannel)
  }
  function streamMon() {
    monitor.initCheckStream("https://api.picarto.tv/v1/channel/name/LKComic", announcementChannel);
  }
  setInterval(comicMon, 30000);
  setInterval(streamMon, 30000);
});

client.on('message', msg => {
  // DON'T TALK TO YOURSELF, DON'T RESPOND TO DMs
  if (msg.author.id !== client.user.id && msg.guild !== null) {
    
    // BOB ACTIONS
    if (msg.author.id === "87562842047279104") {
      if (msg.content === 'ping') {
        msg.channel.send("Pong");
      }
    }
    
    // COMMANDS
    if(COMMAND_SIGNS.indexOf(msg.content.substring(0,1)) > -1){
      var command = msg.content.split(" ")[0].substring(1);
      var params = msg.content.split(" ");
      var author = msg.author;
      params.shift();
      var commandRegex = new RegExp(/!+/gm);
      
      if (command !== "" && !command.match(commandRegex)){
        //msg.channel.send("👏"); 
      }
      
      if (command === "test"){
        if (params[0] == "info"){
        }
        if (params[0] == "comic"){
          //monitor.readDb( msg, "SELECT * FROM feeds" );
          monitor.manualCheckComicFeed(msg);
        }
      }
      if (command === "random"){
        fun.randomComic( msg );
      }
    }
  } // END don't talk to self
});

client.on('error', (err) => {
  console.log("WEBSOCKET ERROR: " + err.message);
});

console.log("Loggin' in...");
client.login(BOT_KEY);