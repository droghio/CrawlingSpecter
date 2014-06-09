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

var numWorkers = 32;
var workers = []
var updateParameters
var status = "idle"


function killEverything(metoo){
    //Time to kill all children processes...
    console.log("Killing all children processes.")
    for (worker = 0; worker < workers.length; worker++){
        console.log("\tKilling child " + worker + ".")
        server.updateUI({ log:"\tKilling child " + worker + ".", color: "red" })
        workers[worker].send({ stop:"SIGTERM" })
        //workers[worker].kill()
    }
    
    if (metoo){
        console.log("Killing self...")
        server.updateUI({ count: "N/A", log: "Killing self...", color: "red" })
        process.kill()
    }
}


updateParameters = function(parameters){

    if (parameters["type"] == "resume"){status = "resumming"; startCrawl()}

    else if (parameters["type"] == "stop"){
        //links.closeConnection();
        status = "paused"
        server.updateUI({ log: "Pausing Crawl", color: "red" })
        killEverything(false)
    }

    else{
        status = "restarting"
        links.closeConnection();
        console.log("UPDATE")
        killEverything(false)
        
        links.loadConnection(function(){
            links.purgeDatabase(function (){
                links.saveLink( parameters.url, 0, 0, function (){startCrawl()} )
            })
        });
    }

    server.updateUI({ status: status })

}


server.start();
server.setParamCallback(updateParameters)
process.stdin.on("keypress", function(hmm, key){ if (key && key.ctrl && key.name == "c"){ killEverything(true) }  });


function startCrawl(){
    status = "starting"
    console.log("New crawl at: " + new Date().getTime());
    console.log("Let's get this show on the road.");
    for (worker = 0; worker < numWorkers; worker++){
        workers[worker] = child.fork("worker.js", [worker]);
        workers[worker].on("message", function(update){update.status = status; server.updateUI(update)});
    }
    status = "crawling"
    console.log("Successfully forked " + numWorkers + " subprocesses.");
    server.updateUI({ log: "Successfully forked " + numWorkers + " subprocesses.", color: "green", status: status })
}


//startCrawl()
