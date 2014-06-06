/*
	John Drogo
	June 6, 2014

    Crawling Specter Worker
	
    Crawles a webpage looking for links.
    Saves links in a MongoDB, and then processes the next link.
    Continues until all links have been exhausted.

    This file initiates the crawl and calls the links object for DB access.
*/




//--Includes-----------------------
try {
    var Spooky = require('spooky');
} catch (e) {
    var Spooky = require('../lib/spooky');
}

var links = require("./links")

console.log("Worker" + process.argv[2] + " says: " + "Hi.")



//--Initialization.----------------
var setup, queue, visited, spooky, pullLinks, setup, worker
var maxpages = 10
var currentpage = 0
var resetSpooky = function(){console.log("\t" + queue[0]); spooky = new Spooky(config, setup)}

var config = {
    child: {
        transport: 'http'
    },
    casper: {
        clientScripts: [ "//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"],
        logLevel: 'debug',
        verbose: true
    }
}


queue = []
visited = []
spooky = null
lastmessage = ""


//--Main functions.-----------------
pullLinks = function (){
    countAnchors = false;
    visited = []
    linkcount = 0;
    link = 0
    
    spooky.start(queue[0])
    spooky.then([{countAnchors: countAnchors, currentpage: currentpage}, function () {  
        //Find all anchors on the page, grab their href's and put them in the database.

        var urlsolver = require('url')
        linkcount = 0
        linksskipped = 0;
        
        //Grab the first link.
        winurl = this.evaluate(function(){return window.location.href})
        link = null
        firstloop = true;
 
        //Now repeat for the rest.
        while (link || firstloop){
        
            //Tell node instance we found a link and to save it.
            //We resolve the link to get the actual URL it is referring to.
            if (link)
                this.emit("link", urlsolver.resolve(winurl, link), currentpage, linkcount-linksskipped)

            //Find next valid link.
            do{
                link = this.evaluate(function(index){return $("a[href]:eq("+index+")").attr("href")}, linkcount)
                linksskipped += 1;
                linkcount += 1;
            } while (link && (link.indexOf("#") != -1 && !countAnchors))
            //Skip anchors if flag is set.
            //Make the while statement true to skip the current link.

            firstloop = false;
        }
        this.emit('crawldone', "\nOn page: " + winurl + " Found: " + linkcount + " pages.");
    }]);

    return spooky.run()
}


setup = function (err) {
    
    if (err) {
        e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        console.log("Child " + process.argv[2] + " says: " + "Error, could not initialize SpookyJS.")
        throw e;
    }

    spooky.on("link", function(url, depth, numberlinks){
        links.saveLink(url, depth, numberlinks)
    });

    spooky.on('crawldone', function (greeting) {
        console.log("\nChild " + process.argv[2] + " says: " + greeting);
        lastmessage = "Child " + process.argv[2] + " says: " + greeting
        //It is possible for our output to be a little jumbled since we are using promises to print.
        //It should still be readable, but lines might be flipped.
        links.countDocuments(function (count){console.log("Number queued is now: " + count + ".\nNext page"); process.send({ count: count, log: lastmessage })});
    });
    
    spooky.on('error', function (e, stack) {
        //console.error(e);
        //if (stack) {"Child " + process.argv[2] + " says: " + console.log(stack);}
    });

    spooky.on('run.complete', function(){
        //Clear the queue, and wait until we know our next link before spawning another spooky.
        //DEBUG2console.log("Child " + process.argv[2] + " says: " + "Done.")
        currentpage += 1
        queue.shift();       
        spooky.destroy();
        links.fetchNextLink(queue, resetSpooky);
   })

    return pullLinks();
}

//Start running.
console.log("Child " + process.argv[2] + " says: " + "Starting crawl on page:")
links.loadConnection(function(){links.fetchNextLink(queue, resetSpooky)})
