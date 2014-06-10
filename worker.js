/*
	John Drogo
	June 6, 2014

    Crawling Specter Worker
	
    Crawles a webpage looking for links.
    Saves links in a MongoDB, and then processes the next link.
    Continues until all links have been exhausted.

    This file initiates the crawl and calls the links object for DB access.
    TODO Sandbox linkaccept check.
    TODO Re-work database acces to run through parent.
    TODO Kill orphaned processes/prevent them, detonator?
    TODO Restart processes that are doing nothing (just starting crawl, or just ending).
*/




//--Includes-----------------------
var cheerio = require('cheerio')
var request = require('request')
var links = require("./links")
var validator = require("validator")

console.log("Child " + process.argv[2] + " says: " + "Hi.")



//--Initialization.----------------
var setup, queue, visited, spooky, pullLinks, setup, worker, crawldone
var maxpages = 10
var currentpage = 0
var linkaccept = "true"


process.on("message", function (data){
    if (data.stop == "SIGTERM"){
        links.closeConnection(function (){
            lastmessage = "Child " + process.argv[2] + " says: " + "T'was a short life."
            try{process.send({ log: lastmessage })}
            catch(e){}
            //process.kill()
            process.exit()
        })
    }

    else if (data.start){
        linkaccept = data.linkaccept
        //Start running.
        console.log("Child " + process.argv[2] + " says: " + "Starting crawl on page:")
        lastmessage = "Child " + process.argv[2] + " says: " + "Starting crawl."
        process.send({ log: lastmessage, color: "green" });
        links.loadConnection(function(){links.fetchNextLink(queue, resetCrawl)})        
    }

})


var resetCrawl = function(){

    if (!queue[0]){
        lastmessage = "\nChild " + process.argv[2] + " says: " + "Work done, queue empty."
        console.log(lastmessage);
        return
    }

    console.log("\t" + queue[0]);
    //lastmessage += ("\n\t" + queue[0]);
    //process.send({ log: lastmessage })

    setup()

}


var crawldone = function(winurl, linkcount, resstat) {
    console.log("\nChild " + process.argv[2] + " says: " + "\nOn page: " + winurl + " Found: " + linkcount + " pages.");
    lastmessage = "\tChild " + process.argv[2] + " says: " + "On page: " + winurl + " Found: " + linkcount + " pages."

    //It is possible for our output to be a little jumbled since we are using promises to print.
    //It should still be readable, but lines might be flipped.
    links.updateLinkStatus(winurl, currentpage, linkcount, (Number(resstat) < 400), null)

    deadlink = null
    if (Number(resstat) > 400)
        deadlink = winurl

    //Update UI.
    links.countDocuments(function (count){
        console.log("Number queued is now: " + count + ".\nNext page");
        process.send({ count: count, log: lastmessage, deadlink: deadlink })
    });

    currentpage += 1
    queue.shift();
    links.fetchNextLink(queue, resetCrawl);
};


queue = []
visited = []
lastmessage = ""


//--Main functions.-----------------
pullLinks = function (){
    countAnchors = false;
    visited = []
    linkcount = 0;
    link = 0
    currentpage = 100;
    
    request(queue[0], function (err, res, html) {

        var $ = cheerio.load(html)

        var urlsolver = require('url')
        linkcount = 0
        linksskipped = 0;
        
        //Grab the first link.
        winurl = queue[0]
        link = null
        firstloop = true;
 
        //Now repeat for the rest.
        while (link || firstloop){
        
            //Tell node instance we found a link and to save it.
            //We resolve the link to get the actual URL it is referring to.
            if (  link && validator.isURL( urlsolver.resolve(winurl, link) )  )
                links.saveLink(urlsolver.resolve(winurl, link), 0, 0, null) 
     
            //Find next valid link.
            do{
                link = $("a").eq(linkcount).attr("href")
                linksskipped += 1;
                linkcount += 1;
            } while (  link && ( (link.indexOf("#") != -1 && !countAnchors) || !validator.isURL(link) || eval(linkaccept) )  )
            //Skip anchors if flag is set.
            //Make the while statement true to skip the current link.
            //Link accept is a user defined filter to skip urls. Make it true to skip a link.
            //TODO SANDBOX!!!!

            firstloop = false;
        }
        return crawldone(winurl, linkcount, res.statusCode);
    });
}


setup = function () {
    return pullLinks();
}

//Process starts when parent sends the start method.
