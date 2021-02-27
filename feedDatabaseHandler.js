var sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('feedMonitor.db');

function init() {
    try {
        db.run("CREATE TABLE feeds (url TEXT, type TEXT, lastPoll TEXT)", [], (err) =>{
          if (err){
            //throw err;
            console.log("Feed monitor database already exists");
          }
        });  
      }
      catch (e){
        console.log("Database exists -- probably");
      }
      
}

// Add check for DB read
async function read( query ){
    return new Promise( resolve => {
        db.all(query, [], (err, result) => {
            if (err){
                console.log(url + " 1");
                console.log(err);
            }
            else{
                resolve(result);
            }
        });
    })
}

// Check for DB Read
async function save( url, feedData ){
    return new Promise((resolve, reject) => {
        console.log("DOING SAVE");
        var query = "SELECT * FROM feeds";
        db.all(query, [], (err, result) => {
        if (err){
            console.log(url + " 1");
            console.log(err);
        }
        else{

            // Update existing URL
            if (result.length > 0){
                let data = [JSON.stringify(feedData), url];
                let q = "UPDATE feeds SET lastPoll = ? WHERE url = ?"

                db.run(q, data, (err)=> {
                    if (err){
                        console.log(url + " 2");
                        console.log(err);
                    }
                })
            }

            // Insert new URL and values
            else {
                console.log("TEST Insert");
                let q = "INSERT INTO feeds VALUES (?,?)";

                db.run(q, [url, JSON.stringify(feedData)], (err) => {
                    if (err){
                        console.log(url + " 3");
                        console.log(err);
                    }
                });
            }
        }
        })
    })
}

module.exports = {
    init : init,
    read : read,
    save : save
}