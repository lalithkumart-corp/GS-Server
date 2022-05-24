let app = require('./server');
let axios = require('axios');
function validator() {
    if(process.env.NODE_ENV == 'offlineprod') {
        let csProductUUID;
        try {
            const execSync = require('child_process').execSync;
            const response = execSync('wmic csproduct get UUID'); // wmic bios get serialnumber
            csProductUUID = String(response).split('\n')[1];
            csProductUUID = csProductUUID.replace(/\r/g, '').trim();
            // console.log(csProductUUID);
            // console.log( app.get('csProductUUID'));
            app.set('observedWmic', csProductUUID);
            if(csProductUUID !== app.get('csProductUUID')) {
                // console.log('App Feeling Unsafe. Please contact Admin');
                storeInDB({isSafe: 0, csProductUUID, time: new Date(), action: 'server-start'});
                // axios.post('http://trsoftware.in/api/Commons/un-safe', {csProductUUID: csProductUUID});
                setTimeout(
                    () => {
                        process.exit();
                    },
                    10000
                );
            } else {
                storeInDB({isSafe: 1, csProductUUID, time: new Date(), action: 'server-start'});
            }
        } catch (err) {
            console.log('Error in Validating APP', err);
            storeInDB({isSafe: 0, csProductUUID, time: new Date(), action: 'server-start'});
            // axios.post('http://trsoftware.in/api/Commons/un-safe', {csProductUUID: csProductUUID, msg: 'Error in valdating the app'});
            setTimeout(
                () => {
                    process.exit();
                },
                5000
            );
        }
    }
}

function storeInAppObject(obj) {
    let msgStack = app.get('gs-msg-stack') || [];
    msgStack.push(obj);
    app.set('gs-msg-stack', msgStack);
}

function storeInDB(obj) {
    let gsSessionUid = app.get('gs-session-uid');
    app.models.User.dataSource.connector.query(`INSERT INTO analytics_app_usage (session_uid, wmic, is_safe, server_action) VALUES (?, ?,?,?)`, [gsSessionUid, obj.csProductUUID, obj.isSafe, obj.action], (err, res) => {
        if(err) {
            console.log(err);
        } else {
            console.log('');
        }
    });
}

module.exports = {
    validator
}