try {
    var Spooky = require('spooky');
} catch (e) {
    var Spooky = require('../lib/spooky');
}

console.log("Hi.")
rooturl = "http://www.w3schools.com/jsref/jsref_indexof.asp"

var spooky = new Spooky({
        child: {
            transport: 'http'
        },
        casper: {
            clientScripts: [ "//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"],
            logLevel: 'debug',
            verbose: true
        }
    }, function (err) {
        if (err) {
            e = new Error('Failed to initialize SpookyJS');
            e.details = err;
            console.log("Error, could not initialize SpookyJS.")
            throw e;
        }

        spooky.start("http://en.wikipedia.org/wiki/Spooky_the_Tuff_Little_Ghost");
        
        spooky.then(function () {
            countAnchors = false;
            maxpages = 3
            currentpage = 0
            queue = []
            visited = []
            linkcount = 0;
            link = 0

            while (currentpage < maxpages){
                //Get ready to hand off to link scanner.
                var urlsolver = require('url')
                
                winurl = this.evaluate(function(){return window.location.href})
                do{
                    link = this.evaluate(function(index){return $("a[href]:eq("+index+")").attr("href")}, linkcount)
                    linkcount += 1;
                } while (link && (link.indexOf("#") != -1 && !countAnchors))
                //Skip anchors if flag is set.
    
                while (link){
                    queue.push( urlsolver.resolve(winurl, link) )
                    winurl = this.evaluate(function(){return window.location.href})
                    do{
                        link = this.evaluate(function(index){return $("a[href]:eq("+index+")").attr("href")}, linkcount)
                        linkcount += 1;
                    } while (link && (link.indexOf("#") != -1 && !countAnchors))
                    //Skip anchors if flag is set.
                }
    
                this.emit('hello', "\nOn page: " + winurl + " Found: " + linkcount + " pages. Number queued is now: " + queue.length + ". Next page " + queue[0] + "\n");
                this.emit( 'hello', this.evaluate(function(nexturl){window.location.assign(nexturl); return window.location.href}, queue[0]) )
                queue.shift()
                currentpage++
             }
        });
        spooky.run();
    }
);


spooky.on('hello', function (greeting) {
    console.log(greeting);
});


spooky.on('error', function (e, stack) {
    console.error(e);

    if (stack) {
        console.log(stack);
    }
});

