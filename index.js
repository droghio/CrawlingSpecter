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
var shouldrebootchildren = true

key(process.stdin)
process.stdin.setRawMode(true)

var numWorkers = 32;
var workers = []
var updateParameters
var status = "idle"
var linkaccept = "";
var uiUpdateInterval = null
var linksleft = 0


function killEverything(metoo){
    //Time to kill all children processes...
    console.log("Killing all children processes.")
    shouldrebootchildren = false
    for (worker = 0; worker < workers.length; worker++){
        console.log("\tKilling child " + worker + ".")
        server.updateUI({ log:"\tKilling child " + worker + ".", color: "red" })
        try{workers[worker].send({ stop:"SIGTERM" })}
        catch(e){ server.updateUI({ log:"\tChild " + worker + " overkilled!", color: "red" })}
    }
    
    if (metoo){
        console.log("Killing self...")
        server.updateUI({ count: "N/A", log: "Killing self...", color: "red" })
        process.kill()
    }
}


function restartChild(worker){
    
    if (!shouldrebootchildren || worker >= numWorkers){ return }
    
    console.log("Attempting reboot of child " + worker)
    if (worker != -1){ 
        console.log("Attempting reboot of child " + worker)
        try{workers[worker].send({ stop:"SIGTERM" })}
        catch(e){ server.updateUI({ log:"\tChild " + worker + " overkilled!", color: "yellow" })}
        workers[worker] = child.fork("worker.js", [worker]);
        workers[worker].send({ start: 1, linkaccept: linkaccept })
        workers[worker].on("message", function(update){update.status = status; server.updateUI(update)});
        workers[worker].on("close", function(){restartChild(-1)})
    }

    else{
        for (index = 0; index < numWorkers; index++){
            if (!workers[index].connected && index <= linksleft){
                 workers[index] = child.fork("worker.js", [index]);
                 workers[index].send({ start: 1, linkaccept: linkaccept })
                 workers[index].on("message", function(update){update.status = status; server.updateUI(update)});
                 workers[index].on("close", function(){restartChild(-1)})
            }
        }
    }
}


updateParameters = function(parameters){

    if (parameters.numWorkers){numWorkers = parameters.numWorkers}

    if (parameters.linkaccept){linkaccept = parameters.linkaccept;} 

    if (parameters["type"] == "resume"){
        if (status == "paused" || status == "idle"){
            clearInterval(uiUpdateInterval)
            status = "resumming";
            startCrawl()
        }
        else
            server.updateUI({ log: "Cannot resume while a crawl is running.", color: "yellow" })
    }

    else if (parameters["type"] == "stop"){
        //links.closeConnection();
        status = "paused"
        server.updateUI({ log: "Pausing Crawl", color: "red" })
        clearInterval(uiUpdateInterval)
        killEverything(false)
    }

    else{
        status = "restarting"
        links.closeConnection();
        console.log("UPDATE")
        clearInterval(uiUpdateInterval)
        
        links.loadConnection(function(){
            links.purgeDatabase(function (){
                links.saveLink( parameters.url, 0, 0, function (){startCrawl()} )
            })
        });
    }

}


updateUI = function(){
    links.countDocuments(function (count){
        linksleft = count
        console.log("Number queued is now: " + count + ".\nNext page");
        server.updateUI({ count: count })

        if (linksleft == 0){
            updateParameters({ type: "stop" });
            console.log("Crawl completed at " + new Date().getTime())
            server.updateUI({ status: "complete", log: "Crawl complete", color: "green" })
        }

    })

    links.getDeadLinks(function (deadlinks){
        //Might want to log dead links elsewhere.
        server.updateUI({ deadlink: deadlinks })
    })

    server.updateUI({ status: status })
}


server.start();
server.setParamCallback(updateParameters)
process.stdin.on("keypress", function(hmm, key){ if (key && key.ctrl && key.name == "c"){ killEverything(true) }  });


function startCrawl(){

    killEverything(false)
    shouldrebootchildren = true

    uiUpdateInterval = setInterval(updateUI, 4000)

    status = "starting"
    console.log("New crawl at: " + new Date().getTime());
    console.log("Let's get this show on the road.");
    for (worker = 0; worker < numWorkers; worker++){
        workers[worker] = child.fork("worker.js", [worker]);
        workers[worker].send({ start: 1, linkaccept: linkaccept })
        workers[worker].on("message", function(update){update.status = status; server.updateUI(update)});
        workers[worker].on("close", function(){restartChild(-1)});
    }
    status = "crawling"
    console.log("Successfully forked " + numWorkers + " subprocesses.");
    server.updateUI({ log: "Successfully forked " + numWorkers + " subprocesses.", color: "green", status: status, count: "N/A" })
}

