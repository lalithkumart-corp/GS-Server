'use strict';
let utils = require('../utils/commonUtils');
let app = require('../server.js');
let _ = require('lodash');

module.exports = function(Interest) {

    Interest.getInterestRatesAPIHanlder = async (accessToken) => {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let interestRatesDetails = await Interest._getInterestRates(accessToken);
            return {STATUS: 'SUCCESS', interestRatesDetails};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }

    Interest.remoteMethod('getInterestRatesAPIHanlder', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
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
        http: {path: '/get-interest-rates', verb: 'get'},
        description: 'For fetching interest rates.',
    });

    Interest._getInterestRates = (accessToken) => {
        return new Promise( async (resolve, reject) => {
            let _userId = await utils.getStoreUserId(accessToken);
            Interest.find({where: {userId: _userId}}, (err, result) => {
                if(err) {
                    return reject(err);
                } else {                   
                    return resolve(result);
                }
            });
        });
    }
};
