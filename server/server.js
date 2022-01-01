'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
//let init = require('./dataMigration').init;
//let uploadOrnamentData = require('./dataMigration').uploadOrnamentData;
var app = module.exports = loopback();
let GsLogger = require('./components/logger/gsLogger');
app.set('logger', new GsLogger());
let logger = app.get('logger');
let SocketClass = require('./socket');
const cors = require('cors');
let AwsManager = require('./helpers/cdnuploader');
const getmac = require('getmac');
let path = require('path');

// let os = require('os');
// console.log(Object.keys(os.networkInterfaces()));

const getUniqId = () =>{
    return getmac.default();
}
app.start = function() {
    // start the web server
    let server = app.listen(function() {
        logger.info('App Started');
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
          var explorerPath = app.get('loopback-component-explorer').mountPath;
        //   console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
          console.log(' ----------------------------------------------');
          console.log('|                                              |');
          console.log('|         Server Started successfully!         |');
          console.log('|                                              |');
          console.log(' ----------------------------------------------');      
        }
        //init(app);
        //uploadOrnamentData(app);
        
        /*
        let networkMac = getUniqId();
        networkMac = networkMac.toUpperCase();
        console.log(networkMac);
        if(networkMac == '2E:6E:85:EA:93:5E' || networkMac == '2C:6E:85:EA:93:5E' || networkMac == '00:15:5D:79:F9:F7' ||) {}
        else {
            console.log('App Feeling Unsafe. Please contact Admin');
            setTimeout(
                () => {
                    process.exit();
                },
                10000
            );
        }
        */
        if(process.env.NODE_ENV == 'offlineprod') {
            try {
                const execSync = require('child_process').execSync;
                const response = execSync('wmic csproduct get UUID'); // wmic bios get serialnumber
                let csProductUUID = String(response).split('\n')[1];
                csProductUUID = csProductUUID.replace(/\r/g, '').trim();
                // console.log(csProductUUID);
                // console.log( app.get('csProductUUID'));
                if(csProductUUID !== app.get('csProductUUID')) {
                    console.log('App Feeling Unsafe. Please contact Admin');
                    setTimeout(
                        () => {
                            process.exit();
                        },
                        10000
                    );
                }
            } catch (err) {
                console.log('Error in Validating APP', err);
                setTimeout(
                    () => {
                        process.exit();
                    },
                    5000
                );
            }
        }
    });
    // testUpload();
    new SocketClass(server);
    return server;
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module)
        app.start();
});

app.use(cors());

if(process.env.NODE_ENV == 'offlineprod') {
    let path1 = path.resolve(process.cwd(), 'client');
    console.log(`CURR CWD: ${process.cwd()}, static Folder: ${path1}`);
    app.use(loopback.static(path1));
}


// const testUpload = async () => {
//     try {
//         let inst = new AwsManager();
//         let resp = await inst.uploadSampleFile();
//         return true;
//     } catch(e) {
//         console.log(e);
//     }
// }

