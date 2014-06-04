try {
    var Spooky = require('spooky');
} catch (e) {
    var Spooky = require('../lib/spooky');
}

console.log("Hi.")

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

        spooky.start(
            'http://en.wikipedia.org/wiki/Spooky_the_Tuff_Little_Ghost');
        
        spooky.then(function () {
            //Get ready to hand off to link scanner.
            queue = []
            visited = []
  
            var queue = this.evaluate(function(){
              var innerqueue = []
              $("a").each(function(index){innerqueue.push( $("a:nth-child("+index+")").attr("href") )});
              return innerqueue;
            });

            this.emit('hello', "\n-O-" + queue + "-O-");
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

