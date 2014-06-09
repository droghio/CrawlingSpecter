var express = require("express")
var logfmt = require("logfmt");

var app = express();
app.use(logfmt.requestLogger());

var io = require("socket.io")(8001);
var socket = null;
var paramcallback = null;

//Serve static content, and starts links webui to backend. 

module.exports = {

    start: function (){
        var port = Number(process.env.PORT);
        app.use(express.static(__dirname + "/public"));
        
        app.get('/crawl?page=', function(req, res) { fetchNextLink(req.url, res); });
        app.listen(port, function() { console.log("Static Server Listening on " + port); });

        //Forward parameter update request to index process.
        io.on('connection', function (newsocket) {
            socket = newsocket;
            io.emit("uiUpdate", { count: "N/A", log: "Connected to backend server, ready for action.", color: "green", status: "loading" })
            socket.on("paramUpdate", function (update){ paramcallback(update) })
        })
    },

    updateUI: function (update){
        if (!update["color"])
            update["color"] = "black"

        if(!update.log)
            update.log = ""

        io.emit("uiUpdate", update)
    },

    setParamCallback: function (callback){
        paramcallback = callback;
    }

}
