'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');

module.exports = function(Analytics) {
    Analytics.remoteMethod('analyticsApiHandler', {
        accepts: [{
            arg: 'accessToken', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let accessToken;
                if(req && req.headers.authorization)
                    accessToken = req.headers.authorization;
                return accessToken;
            },
            description: 'Arguments goes here',
        },{
            arg: 'payload',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
        }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/create-event', verb: 'post'},
        description: 'Analytics',
    });

    Analytics.analyticsApiHandler = (accessToken, payload, cb) => {
        Analytics._analyticsApi(accessToken, payload).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    Analytics._analyticsApi = async (accessToken, payload) => {
        let _userId = await utils.getStoreOwnerUserId(accessToken);
        let sql = SQL.MODULE_USED;
        app.models.GsUser.dataSource.connector.query(sql, [_userId, payload.module], (err, res) => {
            if(err) {
                return reject(err);
            } else {
                return resolve(true);
            }
        });
    }
};

let SQL = {
    MODULE_USED: 'INSERT INTO analytics_module_used (user_id, module) VALUES (?,?)'
}
