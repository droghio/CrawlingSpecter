CrawlingSpecter
===============

***Simple web crawler using NodeJS.***

###PREREQUISITES

You must have nodejs installed and access to a mongodb.
I use MongoHQ but any mongo database should work.




###SETUP

After you have installed node run:
  ```npm install```
  
This will load all of the project dependencies.
To set up the web ui and mongo bindings you'll need to set a few environment variables.

For mongodb:
  
      export MONGO_USER="your_mongo_username"
      export MONGO_PASSWORD="your_mongo_passward"
      export MONGO_URL="your_mongo_URL/the_database" #(Do not include mongodb://.)
  

Then for express:
  ```export PORT=8000```
  
  Where you replace the 8000 with whatever port you want the webui to be forwarded to.
  
  
  
  
###RUNNING

Move to the CrawlingSpecter install directory and run:
  ```node index.js```
  
  You should see a message on the console saying:
  
  ```Static Server Listening on 8000```
  
  With whatever port you chose.
  Open the webui in your browser (http://localhost:8000 by default), and you should be ready to crawl.
 
**NOTE:** You will need the port your chose for the webui, and port 8001 open to access the webui.
  
  
  
  
###CONFIGURATION

Simply type in the url you wish to crawl (don't forget the protocol eg. "http://"),
specify the number of worker processes, and hit start crawl.

The web log will update you on the status, and will dump all broken links into the box below it.
If you wish to contain your search you can add a conditional statement into the Custom Link Filter box.

If the statement evaluates true then the link will be skipped.
To access the current page's url use the variable ```winurl```, and to see the link currently selected use ```link```.

**Example:** Don't crawl any links pointing to youtube.com, and visit pages on google.com but don't record their links.

```(links.indexOf("youtube.com") != -1 || winurl.indexof("google.com") != -1)```

When the crawler visits a page it records whether the page exists or not (403/503 error, etc.), then scans all links on the page. With the Custom Link Filter you can specify complex crawling behaviors, for example ensuring your site correctly links to content hosted elsewhere without attempting to crawl the whole of youtube, flickr, google, take your pick.




###DETAILS

***Link detection:***
The crawler simply reads the href values of all anchor "<a>" tags in the source html. It will ignore all anchors that only jump to different locaitons in the same page.

***Valid Page detection:***
When the crawler lands on a page it checks the http status code. If this code is above 400 it records the page as invalid.

***Workers:***
To speed up crawling it is possible to dispatch many crawling bots simulatiously. For a Core2 Duo I suggest 4-10 bots max. Your milage will very. Keep in mind more bots does not guarantee better preformance, but feel free to play with the setting. I've gone over 100 workers without melting my Mac Mini, but gains were negligible.

***Custom Link Filter:***
The filter executes directly in the worker's runtime, meaning it is a huge security hole. I'm working on sandboxing the filter but for now be careful where you deploy this service.

Bindings for the filter include:

    winurl - The current page url.
    link - The current link selected on the page.
    linkcount - The index of the current link (including skipped).
    linksskipped - The number of links currently skipped on the page.
    res - The nodejs response object for the current page.
    res.statusCode - The http status code for the site.
    html - The raw page html.
    
Use with caution and enjoy!
