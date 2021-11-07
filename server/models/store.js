'use strict';
let app = require('../server');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
let utils = require('../utils/commonUtils');
let moment = require('moment');

module.exports = function(Store) {
    Store.remoteMethod('getInfo', {
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
        http: {path: '/get-info', verb: 'get'},
        description: 'For fetching store info.',
    });

    Store.remoteMethod('updateInfo', {
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
        http: {path: '/update-info', verb: 'post'},
        description: 'Update store info'
    });    

    Store._insertNewStore = (params) => {
        return new Promise((resolve, reject) => {
            Store.create({userId: params.userId, storeName: params.storeName, email: params.email, mobile: params.phone}, (err, resp) => {
                if(err) {
                    logger.error(GsErrorCtrl.create({className: 'Store', className: '_insertNewStore', cause: err, message: 'Exception in sql callback'}));
                    return reject(err);
                } else {
                    return resolve(resp);
                }
            });
        });
    }

    Store.getInfo = async (accessToken, cb) => {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let info = await Store.findByUserId(userId);
            return { STATUS: 'SUCCESS', STORE_INFO: info };
        } catch(e) {
            console.log(e);
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Store.findByUserId = (userId) => {
        return new Promise((resolve, reject) => {
            Store.find({where: {userId: userId}}, (err, result) => {
                if(err) {
                    logger.error(GsErrorCtrl.create({className: 'Store', className: 'findByUserId', cause: err, message: 'Exception in sql callback'}));
                    return reject(err);
                } else {
                    return resolve(result[0]);
                }
            });
        })
    }

    Store.updateInfo = async (apiParams) => {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            let updatedStoreDetails = await Store._updateInfo(apiParams);
            return { STATUS: 'SUCCESS', UPDATED_DETAILS: updatedStoreDetails };
        } catch(e) {
            console.log(e);
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Store._updateInfo = (apiParams) => {
        return new Promise( (resolve, reject) => {
            let tableData = {
                storeName: apiParams.storeName,
                address: apiParams.address,
                place: apiParams.place,
                city: apiParams.city,
                pincode: apiParams.pincode,
                mobile: apiParams.mobile,
                email: apiParams.email,
                gstNo: apiParams.gstNo,
                loanLicenseName: apiParams.loanLicenseName,
                loanBillAddrLine1: apiParams.loanBillAddrLine1,
                loanBillAddrLine2: apiParams.loanBillAddrLine2,
            };
            Store.find({where: {userId: apiParams._userId}}, (error, res) => {
                if(error) {
                    return reject(error);
                } else {
                    if(res && res.length > 0) {
                        Store.updateAll({userId: apiParams._userId}, tableData, (err, resp) => {
                            if(err) {
                                return reject(err);
                            } else {
                                return resolve(tableData);
                            }
                        });
                    } else {
                        Store.create({userId: apiParams._userId, ...tableData}, (err, resp) => {
                            if(err) {
                                return reject(err);
                            } else {
                                return resolve(tableData);
                            }
                        });
                    }
                }
            });
        });
    }
}