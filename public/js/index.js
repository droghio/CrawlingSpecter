var socket = io.connect(window.location.hostname + ":8001");
socket.on("uiUpdate", function (update){ 
    
    if (update.count)
        $("#countQueue").text(update.count);

    if (update.status) 
        $("#status").text(update.status);

    if (update.deadlink){
        $("#deadlinks").html("")
        for (index = 0; index < update.deadlink.length; index++){
            $("#deadlinks").append("<p style='color: red'>" + update.deadlink[index].url + "</p>")
        }
        $("#deadLinkCount").text( update.deadlink.length )
    }
        
    $("#log").append("<p style='color:" + update.color + "'>" + update.log + "</p>");
    $("#log").scrollTop(document.getElementById("log").scrollHeight)
})


function updateParameters(type){
    if (type || window.confirm("Starting a new crawl will purge all previous results.\n Continue?")){
        socket.emit("paramUpdate", {
            url: $("#url").val(), 
            numbots: $("#numberWorkers").val(),
            type: type,
            numWorkers: $("#numberWorkers").val(),
            linkaccept: $("#linkAccept").val()
        })
    }
}
