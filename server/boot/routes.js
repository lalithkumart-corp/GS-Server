let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let utils = require('../utils/commonUtils');
let DataServerRouting = require('../components/dbrouting/dbrouting');


module.exports = (app) => {
    const _bindDataServerRouterLogic = (req, res, next) => {
        new DataServerRouting().bindLogic(app);
        req._boundDSRouterLogic = true;
        return next();
    }
    // app.use(_bindDataServerRouterLogic);
    let logger = app.get('logger');
    app.post('/trigger-event', async (req, res) => {
        try {
            let skt = app.get('socket');
            skt.emit('remainder', {msg: 'some' });
            res.status(200).json({status: 'SUCCESS'});
            res.end();
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'Routes', methodName: 'trigger-event', cause: e, message: 'Exception in api /trigger-event'}));
            res.status(500).json({status: "Error", MSG: e.message});
            res.end();
        }
    });
    app.get('/user-id-by-token', async (req, res) => {
        try {
            let userId = await utils.getStoreOwnerUserId(req.query.access_token);
            res.status(200).json({status: 'SUCCESS', userId});
            res.end();
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'Routes', methodName: 'user-id-by-token', cause: e, message: 'Exception in api /user-id-by-token'}));
            res.status(500).json({status: "Error", MSG: e.message});
            res.end();
        }
    });
    app.get('/ping', (req, res) => {
        res.status(200).json({STATUS: 'SUCCESS', MSG: 'Server ONLINE'});
        res.end();
    });
}
