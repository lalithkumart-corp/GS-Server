'use strict';
let utils = require('../utils/commonUtils');

module.exports = function(Pledgebooksettings) {
    Pledgebooksettings.updateLastBillDetail = (data) => {
        return new Promise((resolve, reject) => {
            let userId = data._userId;
            Pledgebooksettings.updateAll({userId: userId}, {billSeries: data.billSeries, lastCreatedBillNo: data.billNo}, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    Pledgebooksettings.getLastBillSeriesAndNumber =  (accessToken, cb) => {
        utils.getStoreUserId(accessToken)
        .then(
            (userId) => {
                Pledgebooksettings.findOne({where: {userId: userId}}, (err, result) => {
                    if(err) {
                        cb(err, null);
                    } else {
                        let data = result;
                        let returnVal = {
                            billSeries: data.billSeries,
                            billNo: data.lastCreatedBillNo
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

    Pledgebooksettings.remoteMethod('getLastBillSeriesAndNumber', {
        accepts: {
            arg: 'accessToken', type: 'string', http: (ctx) => {
                var req = ctx && ctx.req;
                let access_token = req && req.query.access_token;
                return access_token;
            },
            description: 'Accesstoken passed from client'
        },
        returns: {
            type: 'string',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/get-last-bill-series-and-number', verb: 'get'},
        description: 'For fetching metadata from Customer Data.',
    });
};
