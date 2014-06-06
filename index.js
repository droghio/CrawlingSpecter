try {
    var Spooky = require('spooky');
} catch (e) {
    var Spooky = require('../lib/spooky');
}

var links = require("./links")

console.log("Hi.")

var setup, queue, visited, spooky, pullLinks, setup
var maxpages = 10
var currentpage = 0

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

//Start URL.
queue = ["http://en.wikipedia.org/wiki/Spooky_the_Tuff_Little_Ghost"]
visited = []
spooky = null

pullLinks = function (){
    countAnchors = false;
    visited = []
    linkcount = 0;
    link = 0
    
    spooky.start(queue[0])
    spooky.then([{countAnchors: countAnchors, currentpage: currentpage}, function () {  
        //Get ready to hand off to link scanner.
        var urlsolver = require('url')
        linkcount = 0
        linksskipped = 0;
        
        winurl = this.evaluate(function(){return window.location.href})
        do{
            link = this.evaluate(function(index){return $("a[href]:eq("+index+")").attr("href")}, linkcount)
            linksskipped += 1;
            linkcount += 1;
        } while (link && (link.indexOf("#") != -1 && !countAnchors))
        //Skip anchors if flag is set.
     
        while (link){
            this.emit("link", urlsolver.resolve(winurl, link), currentpage, linkcount-linksskipped)
            winurl = this.evaluate(function(){return window.location.href})
            do{
                link = this.evaluate(function(index){return $("a[href]:eq("+index+")").attr("href")}, linkcount)
                linksskipped += 1;
                linkcount += 1;
            } while (link && (link.indexOf("#") != -1 && !countAnchors))
            //Skip anchors if flag is set.
            //Make the while statement true to skip the current link.
        }
     
        this.emit('hello', "\nOn page: " + winurl + " Found: " + linkcount + " pages.");
    }]);

    return spooky.run()
}


resetSpooky = function(){console.log("\t" + queue[0]); spooky = new Spooky(config, setup)}


setup = function (err) {
    
    if (err) {
        e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        console.log("Error, could not initialize SpookyJS.")
        throw e;
    }

    spooky.on("link", function(url, depth, numberlinks){
        links.saveLink(url, depth, numberlinks)
    });

    spooky.on('hello', function (greeting) {
        console.log(greeting);
        console.log("Number queued is now: " + queue.length + ".\nNext page")
    });
    
    spooky.on('error', function (e, stack) {
        //console.error(e);
        //if (stack) {console.log(stack);}
    });

    spooky.on('run.complete', function(){
        //Clear the queue, and wait until we know our next link before spawning another spooky.
        //DEBUG2console.log("Done.")
        currentpage += 1
        queue.shift();       
        spooky.destroy();
        links.fetchNextLink(queue, resetSpooky);
   })

    return pullLinks();

}

links.loadConnection()
spooky = new Spooky(config, setup);
