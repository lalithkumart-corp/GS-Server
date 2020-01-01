'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');

module.exports = function(Ornament) {
    Ornament.insert = (params) => {
        return new Promise( (resolve, reject) => {
            Ornament.create({userId: params.userId, category: params.category, title: params.title}, (err, result) => {
                if(err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(true);     
                }
            });
        });        
    }

    Ornament.fetchList = async (accessToken) => {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let resp = await Ornament._fetchFromDB(userId);
            return {STATUS: 'SUCCESS', RESPONSE: resp};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }        
    }

    Ornament.remoteMethod('fetchList', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    var req = ctx && ctx.req;
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
        http: {path: '/fetch-list', verb: 'get'},
        description: 'For fetching ornaments list.',
    });

    Ornament._fetchFromDB = (userId) => {
        return new Promise( (resolve, reject) => {
            Ornament.find({where: {userId: userId}} , (err, res) => {
                if(err) {
                    console.error(err);
                    reject(err);
                } else {                
                    let resp = [];
                    _.each(res, (anOrnObj, index) => {
                        resp.push(anOrnObj.title);
                    });
                    resolve(resp);
                }
            });
        });        
    }
};
