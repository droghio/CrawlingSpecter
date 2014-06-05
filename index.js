try {
    var Spooky = require('spooky');
} catch (e) {
    var Spooky = require('../lib/spooky');
}

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
    spooky.then([{countAnchors: countAnchors}, function () {  
        //Get ready to hand off to link scanner.
        var urlsolver = require('url')
        linkcount = 0
        
        winurl = this.evaluate(function(){return window.location.href})
        do{
            link = this.evaluate(function(index){return $("a[href]:eq("+index+")").attr("href")}, linkcount)
            linkcount += 1;
        } while (link && (link.indexOf("#") != -1 && !countAnchors))
        //Skip anchors if flag is set.
     
        while (link){
            this.emit("link", urlsolver.resolve(winurl, link) )
            winurl = this.evaluate(function(){return window.location.href})
            do{
                link = this.evaluate(function(index){return $("a[href]:eq("+index+")").attr("href")}, linkcount)
                linkcount += 1;
            } while (link && (link.indexOf("#") != -1 && !countAnchors))
            //Skip anchors if flag is set.
            //Make the while statement true to skip the current link.
        }
     
        this.emit('hello', "\nOn page: " + winurl + " Found: " + linkcount + " pages.");
    }]);

    return spooky.run()
}


setup = function (err) {
    
    if (err) {
        e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        console.log("Error, could not initialize SpookyJS.")
        throw e;
    }

    spooky.on("link", function(url){
        queue.push(url)
    });

    spooky.on('hello', function (greeting) {
        console.log(greeting);
        console.log("Number queued is now: " + queue.length + ". Next page " + queue[1] + "\n")
    });
    
    spooky.on('error', function (e, stack) {
        //console.error(e);
        //if (stack) {console.log(stack);}
    });

    spooky.on('run.complete', function(){
        currentpage += 1
        queue.shift()
        spooky.destroy();
        spooky = new Spooky(config, setup);
    })

    return pullLinks();

}


spooky = new Spooky(config, setup);
