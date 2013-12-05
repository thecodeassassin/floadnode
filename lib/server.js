var http = require('http'),
    express = require('express'),
    util = require('util'),
    url = require('url'),
    fs = require('fs'),
    multipart = require("multipart"),
    MongoClient = require('mongodb').MongoClient,
    crypto = require('crypto');

var server = {
    config: null,
    db: null,
    log: null,
    
    setConfig : function(config) {
        this.config = config;
        return this;
    },
    
    setLogger: function(log) {
      this.log = log;  
      return this;
    },
    
    create: function() {
        var me = this,
            config,
            log,
            app;
            
        if(!me.config) {
            throw 'No config set!';
        }
        
        if(!me.log) {
            throw 'No logger set!';
        }
        
        config = me.config;
        log = me.log;
        
        try {
            me._connectToDB(config.mongo.host, config.mongo.port, config.mongo.db);
            app = express.createServer();
        
            app.put('/', function (req, res) {
                 
                 if(req.method == 'PUT') {
                     log.debug('Starting new file transfer');
                     
                     res.end();
                 } else {
                    res.writeHead(403, {'Content-Type': 'text/plain'});
                    res.end('You are welcome to use this service by sending your files via PUT');
                    
                 }
                 
            })
            
            // @todo: do retrieve
            // app.get('/[.*]')
            
            app.listen(config.http.port);
        } catch(e) {
            throw util.format('An error occurred while running the floadnode server: %s', e);
        }   
    },
    
    //@protected connect to the mongoDB server
    _connectToDB: function(host, port, db) {
        var me = this;
        MongoClient.connect('mongodb://'+host+':'+port+'/'+db, function(err, db) {
            if(err) throw err;
            me.db = db;
        });
    },
    
    /*
     * Handle file upload
     */
    _upload_file : function (req, res) {
        var me = this,
            log = me.log;
            
        // Request body is binary
        req.setBodyEncoding("binary");
    
        // Handle request as multipart
        var stream = me._parse_multipart(req);
    
        var fileName = null;
        var fileStream = null;
    
        // Set handler for a request part received
        stream.onPartBegin = function(part) {
            log.debug("Started part, name = " + part.name + ", filename = " + part.filename);
    
            // Construct file name
            fileName = "./uploads/" + stream.part.filename;
    
            // Construct stream used to write to file
            fileStream = fs.createWriteStream(fileName);
    
            // Add error handler
            fileStream.addListener("error", function(err) {
                log.error("Error while writing to file '" + fileName + "': ", err);
            });
    
            // Add drain (all queued data written) handler to resume receiving request data
            fileStream.addListener("drain", function() {
                req.resume();
            });
        };
    
        // Set handler for a request part body chunk received
        stream.onData = function(chunk) {
            // Pause receiving request data (until current chunk is written)
            req.pause();
    
            // Write chunk to file
            // Note that it is important to write in binary mode
            // Otherwise UTF-8 characters are interpreted
            
            
            fileStream.write(chunk, "binary");
        };
    
        // Set handler for request completed
        stream.onEnd = function() {
            // As this is after request completed, all writes should have been queued by now
            // So following callback will be executed after all the data is written out
            fileStream.addListener("drain", function() {
                // Close file stream
                fileStream.end();
                
                // Handle request completion, as all chunks were already written
                me._upload_complete(res);
            });
        };
    },
    
    
    // parse per chunk
    _parse_multipart: function(req) {
        var parser = multipart.parser();
    
        // Make parser use parsed request headers
        parser.headers = req.headers;
    
        // Add listeners to request, transfering data to parser
    
        req.addListener("data", function(chunk) {
            // @todo: save the first chunk for future comparison of data
            parser.write(chunk);
        });
    
        req.addListener("end", function() {
            parser.close();
        });

        return parser;
    },
    
    _upload_complete: function(res) {
          // Render response
          res.sendHeader(200, {"Content-Type": "text/plain"});

         // @todo: write the unique identifier to the file, and the delete link
          
          res.end();

    } 
}



module.exports = server;