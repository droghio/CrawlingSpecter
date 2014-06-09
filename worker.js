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

console.log("Child " + process.argv[2] + " says: " + "Hi.")



//--Initialization.----------------
var setup, queue, visited, spooky, pullLinks, setup, worker
var maxpages = 10
var currentpage = 0


process.on("message", function (data){
    if (data.stop == "SIGTERM"){
        links.closeConnection(function (){
            spooky.destroy()
            lastmessage = "Child " + process.argv[2] + " says: " + "T'was a short life."
            process.send({ log: lastmessage })
            process.exit(0)
        })
    }
})


var resetSpooky = function(){

    if (!queue[0]){
        lastmessage = "\nChild " + process.argv[2] + " says: " + "Work done, queue empty."
        console.log(lastmessage);
        return
    }

    console.log("\t" + queue[0]);
    //lastmessage += ("\n\t" + queue[0]);
    //process.send({ log: lastmessage })

    spooky = new Spooky(config, setup)
}


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
    currentpage = 100;
    
    spooky.start(queue[0])
    spooky.then([{countAnchors: countAnchors, currentpage: currentpage, links: links}, function (res) {

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
                this.emit("link", urlsolver.resolve(winurl, link), 0, 0)

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
        this.emit('crawldone', winurl, linkcount, res.status);
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

    spooky.on("logmy", function(data){  console.log( data )  });

    spooky.on("link", function(url, depth, numberlinks){
        links.saveLink(url, depth, numberlinks, 0)
    });

    spooky.on('crawldone', function (winurl, linkcount, resstat) {
        console.log("\nChild " + process.argv[2] + " says: " + "\nOn page: " + winurl + " Found: " + linkcount + " pages.");
        lastmessage = "\tChild " + process.argv[2] + " says: " + "On page: " + winurl + " Found: " + linkcount + " pages."

        //It is possible for our output to be a little jumbled since we are using promises to print.
        //It should still be readable, but lines might be flipped.
        links.updateLinkStatus(winurl, currentpage, linkcount, (Number(resstat) < 400), null)
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
        spooky._rpcClient._server.stream.removeAllListeners()
        spooky.destroy();
        links.fetchNextLink(queue, resetSpooky);
   })

    return pullLinks();
}


//Start running.
console.log("Child " + process.argv[2] + " says: " + "Starting crawl on page:")

lastmessage = "Child " + process.argv[2] + " says: " + "Starting crawl."
process.send({ log: lastmessage, color: "green" });

links.loadConnection(function(){links.fetchNextLink(queue, resetSpooky)})
