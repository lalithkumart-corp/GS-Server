let app = require('../server');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
let MG = require('../myGlobals');

module.exports = (app) => {
    checkForNewNotifications = () => {
        let sql = `SELECT * FROM alerts WHERE archived=0 AND trigger_time BETWEEN (UTC_TIMESTAMP()- INTERVAL 5 SECOND) AND UTC_TIMESTAMP()`;
        app.models.Alert.dataSource.connector.query(sql, (err, res) => {
            if(err) {
                logger.error(GsErrorCtrl.create({className: 'Alert', methodName: 'checkForNewNotifications', cause: err, message: 'Exceptoin from query', appendChildMsg: true}));
            } else {
                if(res && res.length > 0) {
                    console.log('Received new alerts from DB: ', res.length);
                    sendToUi([...res], res[0].user_id);
                }
            }
        });
    }

    sendToUi = (data, user_id) => {
        let skt = app.get('socket');
        if(skt) {
            if(MG.registeredClientDetails[user_id]) {
                if(MG.registeredClientDetails[user_id].events.has('notifications')) {
                    console.log('Sending to UI,' +new Date());
                    skt.emit('alerts', {payload: data});
                }
            }
        } else {
            console.log('no socket found');
        }
    }

    setInterval(() => checkForNewNotifications(), 5400); //1min=60000, 5min=300000

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