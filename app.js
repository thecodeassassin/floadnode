var http = require('http'),
    fs = require('fs'),
    server = require('./lib/server'), 
    Log = require('log'),
    util = require('util'),
    config,
    log;
    
try {
    var config = require('./lib/config_parser.js');
    
    log = new Log(parseInt(config.log.level),
        fs.createWriteStream(config.log.file, {'flags': 'a'}));
    
    server.setConfig(config)
        .setLogger(log)
        .create();

} catch(e) {
    var error = util.format('A fatal error occured: %s',e);
    
    // log the exception if the logger is available
    if(log) {
        log.error(error);    
    } else {
        console.log(error);
    }
    
}