'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
let dateformat = require('dateformat');

module.exports = function(UdhaarSettings) {
    UdhaarSettings.remoteMethod('getLastBillSeriesAndNumber', {
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
        http: {path: '/get-next-serial-no', verb: 'get'},
        description: 'For fetching udhaar serial number.',
    });

    UdhaarSettings.getLastBillSeriesAndNumber =  (accessToken, cb) => {
        utils.getStoreOwnerUserId(accessToken)
        .then(
            (userId) => {
                UdhaarSettings.findOne({where: {userId: userId}}, (err, result) => {
                    if(err) {
                        cb(err, null);
                    } else {
                        let data = result || {};
                        let returnVal = {
                            billSeries: data.billSeries,
                            billNo: data.nextBillNo
                        };
                        cb(null, returnVal);
                    }
                });
            },
            (error) => {
                cb(error, null);
            }
        )
        .catch(
            (exception) => {
                cb(exception, null);
            }
        )
    };

    UdhaarSettings.updateNextBillNumber = (userId, nextBillNo) => {
        return new Promise((resolve, reject) => {
            let userId = data._userId;

            UdhaarSettings.findOrCreate({where: {userId: userId}}, {userId: userId}, (err, res) => {
                if(err) {
                    console.log(err); //TODO: Replace with Logger;
                    reject(err);
                } else {
                    UdhaarSettings.updateAll({userId: userId}, {nextBillNo: nextBillNo}, (error, result) => {
                        if(error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    });
                }
            });            
        });
    }
}