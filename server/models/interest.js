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

    Interest.remoteMethod('addNewRateApi', {
        accepts: {
            arg: 'apiParams',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/add-new-interest-rate', verb: 'post'},
        description: 'Add new Interest Rate'
    });

    Interest.remoteMethod('deleteInterestRateApi', {
        accepts: {
            arg: 'apiParams',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/del-interest-rate', verb: 'delete'},
        description: 'Delete the interest rate'
    });      

    Interest._getInterestRates = (accessToken) => {
        return new Promise( async (resolve, reject) => {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            Interest.find({where: {userId: _userId}}, (err, result) => {
                if(err) {
                    return reject(err);
                } else {                   
                    return resolve(result);
                }
            });
        });
    }

    Interest.addNewRateApi = async (apiParams) => {
        try {
            let userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            let row = {
                userId: userId,
                type: apiParams.metal,
                rangeFrom: apiParams.rangeFrom,
                rangeTo: apiParams.rangeTo,
                rateOfInterest: apiParams.interestVal
            }
            await Interest._createRow(row);
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }
    Interest._createRow = (row) => {
        return new Promise( (resolve, reject) => {
            Interest.create(row, (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        });
    }

    Interest.deleteInterestRateApi = async (apiParams) => {
        try {
            let userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            await Interest._deleteFromTable(apiParams.id, userId);
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Interest._deleteFromTable = (id, userId) => {
        return new Promise((resolve, reject) => {
            let db = Interest.dataSource.settings.database;
            let sql = `DELETE FROM \`${db}\`.interest_rates WHERE (id=${id} AND user_id=${userId})`;
            Interest.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);   
                }
            });
        });
    }
};
