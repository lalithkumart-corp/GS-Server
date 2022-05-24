let app = require('../server');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
let MG = require('../myGlobals');
const { default: axios } = require('axios');

module.exports = (app) => {
    checkForAppUsageEvents = () => {
        let sql = `SELECT * FROM analytics_app_usage WHERE synced = 0`;
        app.models.User.dataSource.connector.query(sql, (err, res) => {
            if(err) {
                console.log(err);
                logger.error(GsErrorCtrl.create({className: 'Background', methodName: 'checkForAppUsageEvents', cause: err, message: 'Exceptoin from query', appendChildMsg: true}));
            } else {
                if(res && res.length > 0) {
                    console.log('Received new app usage events from DB: ', res.length);
                    triggerUsageSyncApi(res);
                }
            }
        });
    }

    checkForAppLoginEvents = () => {
        let sql = `SELECT * FROM analytics_app_login WHERE synced = 0`;
        app.models.User.dataSource.connector.query(sql, (err, res) => {
            if(err) {
                console.log(err);
                logger.error(GsErrorCtrl.create({className: 'Background', methodName: 'checkForAppLoginEvents', cause: err, message: 'Exceptoin from query', appendChildMsg: true}));
            } else {
                if(res && res.length > 0) {
                    console.log('Received new app login events from DB: ', res.length);
                    triggerLoginEventsSyncApi(res);
                }
            }
        });
    }

    triggerUsageSyncApi = async (unsyncedMsgs) => {
        try {
            let ll = unsyncedMsgs.map((msgObj) => {
                msgObj.created_date = new Date(unsyncedMsgs[0].created_date).toISOString().replace('T',' ').replace('Z', '');
                msgObj.modified_date = new Date(unsyncedMsgs[0].modified_date).toISOString().replace('T',' ').replace('Z', '');
                return msgObj;
            });
            let resp = await axios.post('http://trsoftware.in/api/Commons/sync-app-usage', {unsyncedMsgs: ll});

            // let resp = await axios.post('http://localhost:3003/api/Commons/sync-app-usage', {unsyncedMsgs: ll});

            if(resp.data && resp.data.STATUS == 'SUCCESS')
                updateAppUsageTableDB(unsyncedMsgs);
        } catch(e) {
            console.log(e);
        }
    }

    triggerLoginEventsSyncApi = async (unsyncedMsgs) => {
        try {
            let ll = unsyncedMsgs.map((msgObj) => {
                msgObj.created_date = new Date(unsyncedMsgs[0].created_date).toISOString().replace('T',' ').replace('Z', '');
                msgObj.modified_date = new Date(unsyncedMsgs[0].modified_date).toISOString().replace('T',' ').replace('Z', '');
                return msgObj;
            });
            let resp = await axios.post('http://trsoftware.in/api/Commons/sync-app-login', {unsyncedMsgs: ll});

            // let resp = await axios.post('http://localhost:3003/api/Commons/sync-app-login', {unsyncedMsgs: ll});
            if(resp.data && resp.data.STATUS == 'SUCCESS')
                updateAppLoginTableDB(unsyncedMsgs);
        } catch(e) {
            console.log(e);
        }
    }

    updateAppUsageTableDB = (unsyncedMsgs) => {
        try {
            let unsyncedMsgIds = unsyncedMsgs.map((aMsgObj) => aMsgObj.id);
            app.models.User.dataSource.connector.query('UPDATE analytics_app_usage SET synced = 1 WHERE id IN (?)', [unsyncedMsgIds], (err, res) => {
                if(err) console.log(err);
                else console.log('Updated synced falg to true in DB');
            });
        } catch(e) {
            console.log(e);
        }
    }

    updateAppLoginTableDB = (unsyncedMsgs) => {
        try {
            let unsyncedMsgIds = unsyncedMsgs.map((aMsgObj) => aMsgObj.id);
            app.models.User.dataSource.connector.query('UPDATE analytics_app_login SET synced = 1 WHERE id IN (?)', [unsyncedMsgIds], (err, res) => {
                if(err) console.log(err);
                else console.log('Updated synced falg to true in DB');
            });
        } catch(e) {
            console.log(e);
        }
    }


    setInterval(() => {
        checkForAppUsageEvents();
        checkForAppLoginEvents();
    }, 5000); //1min=60000, 5min=300000

    // sendTestMsg = () => {
    //     let skt = app.get('socket');
    //     if(skt) {
    //         console.log(skt);
    //         skt.emit('alerts', {data: 'hello'});
    //     } else {
    //         console.log('no socket found');
    //     }
    // }

    // setInterval(()=> sendTestMsg(), 1000);
}