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

    closeConnection: function(callBack){

        if (callBack)
            mongoose.connection.on("close", callBack)

        mongoose.connection.close()
    },


    countDocuments: function(callBack){
        var db = mongoose.connection;
        var Links = mongoose.model('Links', models.linkscheme);

        Links.find({ visited: false }).count().exec(function (err, count){
            if (err)
                return console.log("ERROR: MongoDB counting error.")
            return callBack(count)
        });
    },


    saveLink: function(url, depth, numberlinks, callBack, referers){
        //Records link in db if it doesn't exist already.
     
    	var db = mongoose.connection;
     	var Links = mongoose.model('Links', models.linkscheme);

     	//DEBUG2console.log("Save link."); 
        link = new Links({ url: url, visited: false, depth: depth, date: new Date().getTime(), numberlinks: numberlinks, valid: false, referers: referers })
        link.save(function (err, link) {
            //DEBUG1if (err) return console.error("Save error: " + err);
            if (err) //If the link already exists add our other page to it.
                module.exports.updateLinkReferers(url, referers)

            if (callBack)
                setTimeout(callBack, 1);
        });
     	
     	//DEBUG2console.log("Saved\n");
    },


    fetchNextLink: function (queue, callBack){
        //Grab the oldest link in the db that we have not visited.
        
        //DEBUG2console.log("Fetch...")
    	var db = mongoose.connection;
        //DEBUG1console.log("Request next link.");

        var Links = mongoose.model('Links', models.linkscheme);

        //A document isn't really visited until the crawl is complete, but we don't want children all scanning the same link.
        //This way links that are in the process of being visited are given lower priority, but aren't removed from the queue.
        //If a child crashes while visiting a link it will be pushed to the back of the queue, but will eventually be visited again.

        Links.find({ visited: false }).sort("pending -date").findOneAndUpdate({}, {  $set: { pending: true }  }, {}).exec(function(err, link){
            if (err) return console.log("Mongoose Error Next " + err);
	
           	//DEBUG1if (link)
                //DEBUG1console.log("Document Found.\n\tName: %s\n", link.url);

            //DEBUG1console.log("End Request\n");
            if (link)
                queue.push(link.url)

            //DEBUG2console.log(queue)
            setTimeout(callBack, 1)
    	});
    },


    getDeadLinks: function(callback){
        var Links = mongoose.model('Links', models.linkscheme);
        console.log("Finding dead links.")
        Links.find({ visited: true, valid: false }).select("url -_id").exec(function(err, deadlinks){ if (deadlinks){callback(deadlinks)} })
    },

    
    purgeDatabase: function(callback){
        console.log("Purging database.")
        var Links = mongoose.model('Links', models.linkscheme);
        Links.remove(function (error, num){
            if (error)
                return console.log("Mongoose Error Purge " + err);

            else{
                console.log("Purge successful.")
                callback()
            }
        });
    },


    updateLinkStatus: function(url, depth, numberlinks, valid, visited, pending, callBack, links){
        var Links = mongoose.model('Links', models.linkscheme);
        console.log(url)
        Links.findOne({ url: url }, function (err, link){
            if (err)
                return console.log("Mongoose Error Update " + err);

            if (link){
                link.numberlinks = numberlinks
                link.valid = valid
                link.depth = depth
                link.visited = visited
                link.pending = pending
                link.links = links

                link.save()

                if (callBack)
                   return callBack()
            }

            else
                console.log("Link not found in database: " + url)

        })
    },


    updateLinkReferers: function(url, refererurls){
        var Links = mongoose.model('Links', models.linkscheme);
        Links.findOneAndUpdate({ url: url }, {   $addToSet: {  referers: { $each: refererurls }  }   }, function (err, link){ 
            if (err) { return console.log("Mongoose Error Update " + err) }
        })
    }


}
