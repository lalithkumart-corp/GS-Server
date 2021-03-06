'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
//let init = require('./dataMigration').init;
//let uploadOrnamentData = require('./dataMigration').uploadOrnamentData;
var app = module.exports = loopback();
let GsLogger = require('./components/logger/gsLogger');
app.set('logger', new GsLogger());
let logger = app.get('logger');

app.start = function() {
  // start the web server
  return app.listen(function() {
    logger.info('App Started');
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
      console.log(' ----------------------------------------------');
      console.log('|                                              |');
      console.log('|         Server Started successfully!         |');
      console.log('|                                              |');
      console.log(' ----------------------------------------------');      
    }
    //init(app);
    //uploadOrnamentData(app);
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
