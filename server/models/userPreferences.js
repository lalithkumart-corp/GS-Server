let app = require('../server');
let utils = require('../utils/commonUtils');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');

module.exports = function(UserPreference) {

    UserPreference.fetchUserPreferenceAPI = async (accessToken) => {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let res = await UserPreference._fetchFromDB(userId);
            return {
                STATUS: 'SUCCESS',
                USER_PREFERENCES: res
            }
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: 'fetchUserPreferenceAPI', cause: e, message: 'Exception occured while fetching the user preferences'}));
            return {
                STATUS: 'ERROR',
                ERROR: e.message || '',
                ERR: e
            }
        }
    }

    UserPreference.remoteMethod('fetchUserPreferenceAPI', {
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
        http: {path: '/get-user-preferences', verb: 'get'},
        description: 'For fetching user preferences.',
    });

    UserPreference._fetchFromDB = (userId) => {
        return new Promise( (resolve, reject) => {
            try {
                UserPreference.find({where: {userId: userId}}, (err, res) => {
                    if(err) {
                        logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: '_fetchFromDB', cause: err, message: 'Exception in sql query execution'}));
                        return resolve({});
                    } else {
                        if(res.length > 0)
                            return resolve(res[0]);
                        else
                            return resolve({});
                    }
                });
            } catch(e) {
                logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: '_fetchFromDB', cause: e, message: 'Exception caught while fetching user preferences'}));
                return {};
            }
        });
    }

    UserPreference.updateAPI = async (params) => {
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await UserPreference._insertOrUpdate(params);
            return {
                STATUS: 'success'
            }
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: 'updateAPI', cause: e, message: 'Exception occured while updating the user preferences'}));
            return {
                STATUS: 'error',
                ERROR: e.message || '',
                ERR: e
            }
        }
    }

    UserPreference.remoteMethod('updateAPI', {
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
        http: {path: '/update-user-preference', verb: 'post'},
        description: 'Update user preferences'
    });

    UserPreference._getUpdatedValues = (params) => {
        let val = {};
        if(params.place)
            val.bill_create_place_default = params.place;
        if(params.city)
            val.bill_create_city_default = params.city;
        if(params.pincode)
            val.bill_create_pincode_default = params.pincode;
        if(typeof params.auto_print_receipt !== "undefined")
            val.auto_print_receipt = params.auto_print_receipt;
        
        val.bill_create_alert_offline_date = (typeof params.alertOfflineDate !== 'undefined')?params.alertOfflineDate:false;

        return val;
    }

    UserPreference._insertOrUpdate = (params) => {
        return new Promise( (resolve, reject) => {
            UserPreference.find({where: {userId: params._userId}}, (err, res) => {
                if(err) {
                    let gsErr = GsErrorCtrl.create({className: 'UserPreference', methodName: '_insertOrUpdate', message: 'Error occured while updating defaults in DB', cause: err});
                    return reject(gsErr);
                } else {
                    if(res && res.length > 0) {
                        UserPreference.update({userId: params._userId}, UserPreference._getUpdatedValues(params), (err, res) => {
                            if(err) {
                                let gsError = GsErrorCtrl.create({className: 'UserPreference', methodName: '_insertOrUpdate', message: 'Error occured while updating defaults in DB', cause: err});
                                return reject(gsError);
                            } else {
                                return resolve(res);
                            }
                        });
                    } else {
                        UserPreference.create({userId: params._userId, bill_create_place_default: params.place, bill_create_city_default: params.city, bill_create_pincode_default: params.pincode, auto_print_receipt: false, bill_create_alert_offline_date: params.alertOfflineDate}, (err, res) => {
                            if(err) {
                                let gsError = GsErrorCtrl.create({className: 'UserPreference', methodName: '_insertOrUpdate', message: 'Error occured while creating the defaults in DB', cause: err});
                                return reject(gsError);
                            } else {
                                return resolve(res);
                            }
                        });
                    }
                }
            });
        });
    }
}