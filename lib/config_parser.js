var util = require('util'),
    ini = require('ini'),
    fs = require('fs');

try {
    var config =  ini.parse(fs.readFileSync('./config.ini', 'utf-8'))
    
    if(isNaN(config.http.port)) {
        throw 'HTTP port in config is not a number!';
    }
    
    if(isNaN(config.mongo.port)) {
        throw 'MongoDB port in config is not a number!';
    }
    
    if(isNaN(config.log.level) || config.log.level < 0 || config.log.level > 7) {
        throw 'Invalid logging level given in config';
    }
    
    // export the config file after parsing it
    module.exports = config;
    
} catch(e) {
    throw util.format('Error while parsing the config file: %s',e);
    
}