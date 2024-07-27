'use strict';
let app = require('../server');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
let utils = require('../utils/commonUtils');
let moment = require('moment');

module.exports = function(ApplicationManager) {
    ApplicationManager.remoteMethod('getStatus', {
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
        http: {path: '/get-status', verb: 'get'},
        description: 'For fetching app status.',
    });

    ApplicationManager.remoteMethod('checkUsedTrialOffer', {
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
        http: {path: '/check-used-trial-offer', verb: 'get'},
        description: 'For fetching app status.',
    });

    ApplicationManager.remoteMethod('updateStatus', {
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
        http: {path: '/update-status', verb: 'post'},
        description: 'Update application status'
    });

    ApplicationManager.remoteMethod('renewLicenseApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            }, {
            arg: 'data',
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
        http: {path: '/renew-license', verb: 'post'},
        description: 'Renew the license'
    });

    ApplicationManager.getStatus = async (accessToken, cb) => {
        try {
            let status = 0;
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let appRow = await ApplicationManager.findByUserId(userId);
            let daysToExpire;
            if(appRow) {
                status = appRow.status;
                let validTillDate = moment(appRow.validTillDate);
                let todaysDate = moment();
                daysToExpire = validTillDate.diff(todaysDate, 'days');
            }
            return { STATUS: 'SUCCESS', isActive: status, daysToExpire};
        } catch(e) {
            console.log(e);
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }
    ApplicationManager.findByUserId = (userId) => {
        return new Promise((resolve, reject) => {
            ApplicationManager.find({where: {userId: userId}}, (err, result) => {
                if(err) {
                    logger.error(GsErrorCtrl.create({className: 'AppManager', className: 'findByUserId', cause: err, message: 'Exception in sql callback'}));
                    return reject(err);
                } else {
                    return resolve(result[0]);
                }
            });
        })
    }
    ApplicationManager.checkUsedTrialOffer = async (accessToken) => {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let flag = await ApplicationManager.checkAlreadySubscribedTrial(userId);
            return { STATUS: 'SUCCESS', TRIAL_OVER: flag};
        } catch(e) {
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    ApplicationManager.updateStatus = async function(apiParams, cb) {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            if(apiParams._userId) {
                let resp = await ApplicationManager._updateTable(apiParams);
                return { STATUS: 'SUCCESS', resp: resp};
            } else {
                throw 'AUTH INVALID';
            }
        } catch(e) {
            return { STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    ApplicationManager._updateTable = (apiParams) => {
        return new Promise( async (resolve, reject) => {
            try {
                let today = moment().format('YYYY-MM-DD HH:MM:ss');
                if(apiParams.plan == "trial") {
                    let day7 = moment().add(6, 'days').format('YYYY-MM-DD HH:MM:ss');
                    let alreadySubscribedTrial = await ApplicationManager.checkAlreadySubscribedTrial(apiParams._userId);
                    if(alreadySubscribedTrial)
                        return reject( new Error('Trial Version already completed!'));
                    let updatedTable = await ApplicationManager.activate(apiParams._userId, {status: 1, usedTrialOffer: 1, validTillDate: day7, modifiedDate: today});
                    await app.models.Common.createNewTablesIfNotExist(apiParams._userId);
                    await app.models.Common.setupNewUser(apiParams._userId);
                } else if(apiParams.plan == "custom") {
                    if(!apiParams.activationKey) return reject('Provide the Activation Key...')
                    let today = moment().format('YYYY-MM-DD HH:MM:ss');
                    let rr = new Date();
                    let password = app.get('csProductUUID') + app.get('encpwd') + rr.getFullYear()+rr.getMonth()+rr.getHours();
                    try {
                        const decryptedMessage = utils.decrypt(apiParams.activationKey, password);
                        let decryptedObj = JSON.parse(decryptedMessage);
                        if(!decryptedObj.expiryDate)
                            return reject('License Invalid - Code 1');
                        await ApplicationManager.activate(apiParams._userId, {status: 1, usedTrialOffer: 1, validTillDate: decryptedObj.expiryDate, modifiedDate: today});
                    } catch(e) {
                        return reject('License Invalid - Code 2');
                    }
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }
    ApplicationManager.checkAlreadySubscribedTrial = (userId) => {
        return new Promise((resolve, reject) => {
            try {
                ApplicationManager.find({where: {userId: userId}}, (err, res) => {
                    if(err) {
                        console.log(err);
                        return reject(err);
                    } else {
                        if(res && res.length > 0) {
                            if(res[0].usedTrialOffer)
                                return resolve(true);
                            else
                                return resolve(false);
                        }
                    }
                })
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }
    ApplicationManager.activate = (userId, data) => {
        return new Promise((resolve, reject) => {
            ApplicationManager.updateAll({userId: userId}, data, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        })
    }
    ApplicationManager.updateValidityTime = (userId, ownerId) => {
        return new Promise( (resolve, reject) => {
            try {
                let id = ownerId || userId;
                ApplicationManager.find({where: {userId: id}}, async (err, res) => {
                    if(err) {
                        //TODO: IMPORTANT. Log this error and notice this error in case appearing in PROD. 
                        console.log(err);
                        return resolve(false);
                    } else {
                        if(res && res.length>0) {
                            let date = res[0].validTillDate;
                            let validityLastDate = moment(new Date(date));
                            let todayDate = moment();
                            let diff = validityLastDate.diff(todayDate, 'days');
                            if(diff <= 0) {
                                let res = await ApplicationManager.disableUserApplication(id);
                                return resolve(false);
                            }
                            return resolve(true);
                        } else {
                            logger.error(GsErrorCtrl.create({className: 'ApplicationManager', methodName: 'updateValidityTime', cause: 'App Not Found', message: 'No Appp found for this user.'}));
                            return resolve(null);
                        }
                    }
                });
            } catch(e) {
                console.log(e);
                logger.error(GsErrorCtrl.create({className: 'ApplicationManager', methodName: 'updateValidityTime', cause: e, message: 'Exception'}));
                return resolve(false);
            }
        });
    }
    ApplicationManager.disableUserApplication = (userId) => {
        return new Promise((resolve, reject) => {
            ApplicationManager.updateAll({userId: userId}, {status: 0}, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    ApplicationManager.renewLicenseApi = (accessToken, data, cb) => {
        ApplicationManager._renewLicenseApi(accessToken, data).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    ApplicationManager._renewLicenseApi = (accessToken, data) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let today = moment().format('YYYY-MM-DD HH:MM:ss');
            let rr = new Date();
            let password = app.get('csProductUUID') + app.get('encpwd') + rr.getFullYear()+rr.getMonth()+rr.getHours();
            const decryptedMessage = utils.decrypt(data.licenseKey, password);
            try {
                let decryptedObj = JSON.parse(decryptedMessage);
                if(!decryptedObj.expiryDate)
                    return reject('License Invalid - Code 1');
                ApplicationManager.updateAll({userId: userId}, {status: 1, usedTrialOffer: 1, validTillDate: decryptedObj.expiryDate, modifiedDate: today}, (err, res) => {
                    if(err) {
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
            } catch(e) {
                return reject(e);
            }
        });
    }
}
