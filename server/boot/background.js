let app = require('../server');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
let MG = require('../myGlobals');
const { default: axios } = require('axios');
let fs = require('fs');
const path = require("path");

let domain = 'http://trsoftware.in';
// let domain = 'http://localhost:3003';

module.exports = (app) => {
    checkForAppUsageEvents = () => {
        let sql = `SELECT * FROM analytics_app_usage WHERE synced = 0`;
        app.models.User.dataSource.connector.query(sql, (err, res) => {
            if(err) {
                console.log(err);
                logger.error(GsErrorCtrl.create({className: 'Background', methodName: 'checkForAppUsageEvents', cause: err, message: 'Exceptoin from query', appendChildMsg: true}));
            } else {
                if(res && res.length > 0) {
                    // console.log('Received new app usage events from DB: ', res.length);
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
                    // console.log('Received new app login events from DB: ', res.length);
                    triggerLoginEventsSyncApi(res);
                }
            }
        });
    }

    checkForAnalyticsPledgebook = () => {
        let sql = `SELECT * FROM analytics_pledgebook WHERE is_sy = 0`;
        app.models.User.dataSource.connector.query(sql, (err, res) => {
            if(err) {
                console.log(err);
                logger.error(GsErrorCtrl.create({className: 'Background', methodName: 'checkForAnalyticsPledgebook', cause: err, message: 'Exceptoin from query', appendChildMsg: true}));
            } else {
                if(res && res.length > 0) {
                    // console.log('Received pledgebook events from DB: ', res.length);
                    triggerPledgebookAnalyticsSyncApi(res);
                }
            }
        });
    }

    checkForAnalyticsModulesUsed = () => {
        let sql = `SELECT * FROM analytics_module_used WHERE is_sy = 0`;
        app.models.User.dataSource.connector.query(sql, (err, res) => {
            if(err) {
                console.log(err);
                logger.error(GsErrorCtrl.create({className: 'Background', methodName: 'checkForAnalyticsModulesUsed', cause: err, message: 'Exceptoin from query', appendChildMsg: true}));
            } else {
                if(res && res.length > 0) {
                    // console.log('Received modules events from DB: ', res.length);
                    triggerModulesAnalyticsApi(res);
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
            let resp = await axios.post(`${domain}/api/Commons/sync-app-usage`, {unsyncedMsgs: ll});

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
            let resp = await axios.post(`${domain}/api/Commons/sync-app-login`, {unsyncedMsgs: ll});

            // let resp = await axios.post('http://localhost:3003/api/Commons/sync-app-login', {unsyncedMsgs: ll});
            if(resp.data && resp.data.STATUS == 'SUCCESS')
                updateAppLoginTableDB(unsyncedMsgs);
        } catch(e) {
            console.log(e);
        }
    }

    triggerPledgebookAnalyticsSyncApi = async (unsyncedMsgs) => {
        try {
            let ll = unsyncedMsgs.map((msgObj) => {
                msgObj.created_date = new Date(unsyncedMsgs[0].created_date).toISOString().replace('T',' ').replace('Z', '');
                msgObj.modified_date = new Date(unsyncedMsgs[0].modified_date).toISOString().replace('T',' ').replace('Z', '');
                return msgObj;
            });
            let resp = await axios.post(`${domain}/api/Commons/sy-analytics-pb`, {unsyncedMsgs: ll});

            // let resp = await axios.post('http://localhost:3003/api/Commons/sy-analytics-pb', {unsyncedMsgs: ll});
            if(resp.data && resp.data.STATUS == 'SUCCESS')
                updatePledgebookAnalyticsTableDB(unsyncedMsgs);
        } catch(e) {
            console.log(e);
        }
    }

    checkCore = async () => {
        try {
            // if(app.get('app_is_unsafe')) {
                let apiRespCame = false;
                try {
                    let resp = await axios.post(`${domain}/api/Commons/core-action`, {appKey: app.get('appkey')});
                    apiRespCame = true;
                    if(resp && resp.data && resp.data.RESP == 'UNLINK') {
                        // try {fs.unlinkSync(path.resolve(process.cwd(), 'server/boot/role-resolver.js'));} catch(e){}
                        // try {fs.unlinkSync(path.resolve(process.cwd(), 'server/models/customer.js'));} catch(e){}
                        // try {fs.unlinkSync(path.resolve(process.cwd(), 'server/models/gs-user.js'));} catch(e){}
                        unlinkDB();
                        updateDB(app.get('appkey'));
                    }
                } catch(e) {
                    // console.log(e);
                    // storeInDB({isSafe: 0, action: e.message || 'exception in corecheck'});
                }
                if(!apiRespCame) {
                    app.models.GsUser.dataSource.connector.query('SELECT * FROM app WHERE `key`=?', [app.get('appkey')], (err, res) => {
                        if(res && res.length>0 && res[0] && (res[0].core_flag == 1 || res[0].core_flag == '1'))
                            unlinkDB();
                    });
                }
            // }
        } catch(e) {
            // console.log(e);
        }
    }

    updateDB = (appKey) => {
        return new Promise((resolve, reject) => {
            app.models.User.dataSource.connector.query('UPDATE app SET core_flag=1 WHERE `key`=?', [appKey], (err, res) => {
                if(err) console.log(err);
            });
        })
    }

    unlinkDB = () => {
        return new Promise((resolve, reject) => {
            app.models.User.dataSource.connector.query('DROP TABLE Role', (err, res)=> {
                app.models.User.dataSource.connector.query('DROP TABLE ACL', (err2, res2) => {
                    app.models.User.dataSource.connector.query('DROP TABLE RoleMapping', (err3, res3) => {
                        // if(err3) console.log(err3);
                        return resolve(true);
                    });
                });
            });
        });
    }

    triggerModulesAnalyticsApi = async (unsyncedMsgs) => {
        try {
            let ll = unsyncedMsgs.map((msgObj) => {
                msgObj.created_date = new Date(unsyncedMsgs[0].created_date).toISOString().replace('T',' ').replace('Z', '');
                return msgObj;
            });
            let resp = await axios.post(`${domain}/api/Commons/sy-analytics-modules`, {unsyncedMsgs: ll});

            // let resp = await axios.post('http://localhost:3003/api/Commons/sy-analytics-modules', {unsyncedMsgs: ll});
            if(resp.data && resp.data.STATUS == 'SUCCESS')
                updateModulesAnalyticsTableDB(unsyncedMsgs);
        } catch(e) {
            // console.log(e);
        }
    }

    updateAppUsageTableDB = (unsyncedMsgs) => {
        try {
            let unsyncedMsgIds = unsyncedMsgs.map((aMsgObj) => aMsgObj.id);
            let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
            app.models.User.dataSource.connector.query('UPDATE analytics_app_usage SET synced=1, modified_date=? WHERE id IN (?)', [dt, unsyncedMsgIds], (err, res) => {
                if(err) console.log(err);
                // else console.log('Updated synced falg to true in DB');
            });
        } catch(e) {
            // console.log(e);
        }
    }

    updateAppLoginTableDB = (unsyncedMsgs) => {
        try {
            let unsyncedMsgIds = unsyncedMsgs.map((aMsgObj) => aMsgObj.id);
            let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
            app.models.User.dataSource.connector.query('UPDATE analytics_app_login SET synced=1, modified_date=? WHERE id IN (?)', [dt, unsyncedMsgIds], (err, res) => {
                if(err) console.log(err);
                // else console.log('Updated synced falg to true in DB');
            });
        } catch(e) {
            // console.log(e);
        }
    }

    updatePledgebookAnalyticsTableDB = (unsyncedMsgs) => {
        try {
            let unsyncedMsgIds = unsyncedMsgs.map((aMsgObj) => aMsgObj.id);
            let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
            app.models.User.dataSource.connector.query('UPDATE analytics_pledgebook SET is_sy=1, modified_date=? WHERE id IN (?)', [dt, unsyncedMsgIds], (err, res) => {
                if(err) console.log(err);
                // else console.log('Updated synced falg to true in DB');
            });
        } catch(e) {
            // console.log(e);
        }
    }

    updateModulesAnalyticsTableDB = (unsyncedMsgs) => {
        try {
            let unsyncedMsgIds = unsyncedMsgs.map((aMsgObj) => aMsgObj.id);
            let dt = new Date().toISOString().replace('T',' ').replace('Z', '');
            app.models.User.dataSource.connector.query('UPDATE analytics_module_used SET is_sy=1, modified_date=? WHERE id IN (?)', [dt, unsyncedMsgIds], (err, res) => {
                if(err) console.log(err);
                // else console.log('Updated synced falg to true in DB');
            });
        } catch(e) {
            // console.log(e);
        }
    }


    setInterval(() => {
        checkForAppUsageEvents();
        checkForAppLoginEvents();
        checkForAnalyticsPledgebook();
        checkForAnalyticsModulesUsed();
        checkCore();
    }, 300000); //1min=60000, 5min=300000
}   