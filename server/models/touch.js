'use strict';
let app = require('../server.js');
let _ = require('lodash');

module.exports = function(Touch) {
    Touch.fetchList = async (accessToken) => {
        try {
            let resp = await Touch._fetchTouchListFromDB();
            return {STATUS: 'SUCCESS', RESPONSE: resp};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }
    Touch.remoteMethod('fetchList', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    return access_token;
                },
                description: 'Arguments goes here',
            }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/list', verb: 'get'},
        description: 'For fetching Touch list.'
    });

    Touch._fetchTouchListFromDB = () => {
        return new Promise( (resolve, reject) => {
            Touch.dataSource.connector.query(`SELECT * FROM touch`, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    let resp = [];
                    _.each(res, (anObj, index) => {
                        resp.push(anObj);
                    });
                    return resolve(resp);
                }
            });
        });
    }

    Touch.getId = (touchVal) => {
        return new Promise( (resolve, reject ) => {
            Touch.findOrCreate({ where: { purity: touchVal}}, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res.id);
                }
            });
        });
    }
}