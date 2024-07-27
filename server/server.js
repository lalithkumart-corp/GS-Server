'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
//let init = require('./dataMigration').init;
//let uploadOrnamentData = require('./dataMigration').uploadOrnamentData;
var app = module.exports = loopback();
let GsLogger = require('./components/logger/gsLogger');
let loggerInstance = new GsLogger();
app.set('logger', loggerInstance);
let logger = app.get('logger');
let SocketClass = require('./socket');
const cors = require('cors');
let AwsManager = require('./helpers/cdnuploader');
const getmac = require('getmac');
let path = require('path');
let consoleLogHandler = require('./components/logger/consoleLogHandler');
let appValidator = require('./appValidator');
const { encrypt } = require('./utils/commonUtils');
// let os = require('os');
// console.log(Object.keys(os.networkInterfaces()));

const getUniqId = () =>{
    return getmac.default();
}

app.set('gs-session-uid', +new Date());

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
    });
    
    bindUncaughtException();
    bindUnhandledRejection();

    appValidator.validator();
    consoleLogHandler.consoleLogHandler(loggerInstance);
    // testUpload();
    new SocketClass(server);
    /*
    let rr = new Date();
    // let password = app.get('csProductUUID') + app.get('encpwd') + rr.getFullYear()+rr.getMonth()+rr.getHours();
    let password = `4C4C4544-0038-3710-8053-B6C04F444332A(*&nlk)[._` + rr.getFullYear()+rr.getMonth()+rr.getHours();
    let encted = encrypt(JSON.stringify({expiryDate: '2026-10-10 00:00:00'}), password);
    console.log(password)
    console.log(encted);
    */

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

// process.on('uncaughtException', (err) => {
//     console.log('Uncaught Exception occured');
//     console.log(err);
// });

const bindUncaughtException = () => {
    process.on('uncaughtException', (err) => {
        console.error('GS noticed UnCaughtException ', err);
    });
}

const bindUnhandledRejection = () => {
    process.on('unhandledRejection', (err) => {
        if(err && err.message && err.message.indexOf('Callback was already called') < 0) { // Loopback older version has this issue. Have to upgrade Loopback version
            console.error('GS noticed UnhandledRejection ', err);
        } else {
            // console.imp('FLCL Caught Known Issue with Loopback older version ... Unhandled_rejection_caught');
        }
    });
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

process.once('SIGINT', async (code) => { // ctrl+C (or) when stopping the application (i tried by terminating the VisualCode debug mode)
    console.log('----------SIGINT. CODE: 1572516475314');
    console.log(code);
    await storeInDB({action: 'stopped(sigint)'});
    process.exit();
});

process.once('SIGTERM', async (code) => { //when killing the port via CMD
    console.log('----------SIGTERM. CODE: 1572516477777');
    console.log(code);
    await storeInDB({action: 'stopped(sigterm)'});
    process.exit();
});

process.once('SIGQUIT', async (code) => { //when killing the port via CMD
    console.log('----------SIGQUIT. CODE: 15725164121312');
    console.log(code);
    await storeInDB({action: 'stopped(sigquit)'});
    process.exit();
});

function storeInDB(obj) {
    return new Promise((resolve, reject) => {
        let gsSessionUid = app.get('gs-session-uid');
        app.models.User.dataSource.connector.query(`INSERT INTO analytics_app_usage (session_uid, server_action) VALUES (?,?)`, [gsSessionUid, obj.action], (err, res) => {
            if(err) {
                console.log(err);
                return resolve(false);
            } else {
                console.log('');
                return resolve(true);
            }
        });
    });
}