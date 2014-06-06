/*
	John Drogo
	June 6, 2014

    Crawling Specter Mongo interface
	
    Saves visited links and links found in a MongoDB.

	(Make sure you put in your MongoDB credentials. Three values to update.)
*/


var http = require('http');
var mongoose = require('mongoose');
var models = require("./models/link.js");

var mongouser = process.env.MONGO_USER
var mongopassword = process.env.MONGO_PASSWORD
var mongourl = process.env.MONGO_URL

module.exports = {

    loadConnection: function(callBack){
        mongoose.connect("mongodb://" + mongouser + ":" + mongopassword + "@" + mongourl);
        mongoose.connection.on("error", console.error.bind(console, "ERROR: Quiting due to MongoDB connection error: "));
        mongoose.connection.once("open", callBack)
    },

    closeConnection: function(){
        mongoose.connection.close()
    },


    countDocuments: function(callBack){
        var db = mongoose.connection;
        var Links = mongoose.model('Links', models.linkscheme);

        Links.count().exec(function (err, count){
            if (err)
                return console.log("ERROR: MongoDB counting error.")
            return callBack(count)
        });
    },


    saveLink: function(url, depth, numberlinks, callBack){
        //Records link in db if it doesn't exist already.
     
    	var db = mongoose.connection;
     	var Links = mongoose.model('Links', models.linkscheme);

     	//DEBUG2console.log("Save link."); 
        link = new Links({ url: url, visited: false, depth: depth, date: Math.round(new Date().getTime()/1000), numberlinks: numberlinks, valid: false })
        link.save(function (err, link) {
            //DEBUG1if (err) return console.error("Save error: " + err);
        });
     	
     	//DEBUG2console.log("Saved\n");
        return callBack()
    },


    fetchNextLink: function (queue, callBack){
        //Grab the oldest link in the db that we have not visited.
        
        //DEBUG2console.log("Fetch...")
    	var db = mongoose.connection;
        //DEBUG1console.log("Request next link.");

        var Links = mongoose.model('Links', models.linkscheme);
        Links.find({ visited: false }).sort("-date").findOneAndUpdate({}, {  $set: { visited: true }  }, {}).exec(function(err, link){
            if (err) return console.log("Mongoose Error " + err);
	
           	//DEBUG1if (link)
                //DEBUG1console.log("Document Found.\n\tName: %s\n", link.url);

            //DEBUG1console.log("End Request\n");
            queue.push(link.url)
            //DEBUG2console.log(queue)
            return callBack()
    	});
    },

    
    purgeDatabase: function(callback){
        var db = mongoose.connection;
        db.dropCollection("Lists", callback)
    }
}
