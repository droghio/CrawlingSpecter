/*
	John Drogo
	June 6, 2014

    Crawling Specter
	
    Crawles a webpage looking for links.
    Saves links in a MongoDB, and then processes the next link.
    Continues until all links have been exhausted.

    This file initiates children processes that actually preform the crawl.
*/

var child = require("child_process")
var key = require("keypress")
var server = require("./server.js")
var stream = require("stream")
var links = require("./links")

key(process.stdin)
process.stdin.setRawMode(true)

var numWorkers = 1;
var workers = []
var updateParameters


function killEverything(metoo){
    //Time to kill all children processes...
    console.log("Killing all children processes and quiting.")
    for (worker = 0; worker < numWorkers; worker++){
        console.log("\tKilling child " + worker + ".")
        workers[worker].kill()
    }
    
    if (metoo){
        console.log("Killing self...")
        server.updateUI({ count: "N/A", log: "Killing self..." })
        process.kill()
    }
}


updateParameters = function(parameters){
    console.log("UPDATE")
    killEverything(false)
    links.loadConnection(function(){
        links.purgeDatabase(function (){
            links.closeConnection();
            server.saveLink( parameters.url, 0, 0, function (){startCrawl()} )
        })
    });
}


server.start();
server.setParamCallback(updateParameters)
process.stdin.on("keypress", function(hmm, key){ if (key && key.ctrl && key.name == "c"){ killEverything(true) }  });


function startCrawl(){
    console.log("New crawl at: " + new Date().getTime());
    console.log("Let's get this show on the road.");
    for (worker = 0; worker < numWorkers; worker++){
        workers[worker] = child.fork("worker.js", [worker]);
        workers[worker].on("message", function(update){server.updateUI(update)});
    }
    console.log("Successfully forked " + numWorkers + " subprocesses.");
}


startCrawl()
