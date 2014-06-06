/*
	John Drogo
	May 29, 2014

	WeatherNode Server
	
	This is a nodejs backend script that responds with an image url to be shown
	for the given weather condition.

	(Make sure you put in your API keys below. Three values to update.)
*/


var http = require('http');
var mongoose = require('mongoose');
var express = require("express");
var models = require("./models/link.js");

module.exports = {

    loadConnection: function(){
        mongoose.connect('mongodb://user:pass@mongo.db.url');
    },

    closeConnection: function(){
        mongoose.connection.close()
    },

    saveLink: function(url, depth, numberlinks, callBack){
    
     	/*
     		Weather condition in is url. Optionally we can create a new weather condition that points to the
     		provided image url. (Disabled)
     	*/
     
    	var db = mongoose.connection;
     	var Links = mongoose.model('Links', models.linkscheme);

     	//DEBUG2console.log("Save link."); 
        link = new Links({ url: url, visited: false, depth: depth, date: Math.round(new Date().getTime()/1000), numberlinks: numberlinks, valid: false })
        link.save(function (err, fluffy) {
            //DEBUG1if (err) return console.error("Save error: " + err);
        });
     	
     	//DEBUG2console.log("Saved\n");
        return callBack()
    },

    fetchNextLink: function (queue, callBack){
    	//Query the database for which image we should use for the provided weather condition.w
    
    	/*
            Weather condition in is url. Optionally we can create a new weather condition that points to the
            provided image url. (Disabled)
        */
        
        //DEBUG2console.log("Fetch...")
    	var db = mongoose.connection;
        //DEBUG1console.log("Request next link.");

        var Links = mongoose.model('Links', models.linkscheme);
        Links.find({ visited: false }).sort("-date").findOne().exec(function(err, link){
            if (err) return console.log("Mongoose Error " + err);
	
           	//DEBUG1if (link)
                //DEBUG1console.log("Document Found.\n\tName: %s\n", link.url);

            //DEBUG1console.log("End Request\n");
            queue.push(link.url)
            //DEBUG2console.log(queue)
            return callBack()
    	});

    }
}

/*Serve static content, and query the database when a request is sent to a mydomain.com/node/ url.*/

/*var port = Number(process.env.PORT);
app.use(express.static(__dirname + "/public"));

app.get('/node/*', function(req, res) { fetchNextLink(req.url, res); });
app.listen(port, function() { console.log("Listening on " + port); });*/
