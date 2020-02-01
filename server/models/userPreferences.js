let app = require('../server');
let utils = require('../utils/commonUtils');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');

module.exports = function(UserPreference) {

    UserPreference.fetchUserPreferenceAPI = async (accessToken) => {
        try {
            return {
                STATUS: 'success',
                USER_PREFERENCES: {}
            }
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'UserPreference', methodName: 'fetchUserPreferenceAPI', cause: e, message: 'Exception occured while fetching the user preferences'}));
            return {
                STATUS: 'error',
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

    UserPreference._insertOrUpdate = (params) => {
        return new Promise( (resolve, reject) => {
            UserPreference.findOne({where: {userId: params._userId}}, (err, res) => {
                if(err) {
                    let gsErr = GsErrorCtrl.create({className: 'UserPreference', methodName: '_insertOrUpdate', message: 'Error occured while updating defaults in DB', cause: err});
                    return reject(gsErr);
                } else {
                    if(res && res.length > 0) {
                        UserPreference.update({userId: params._userId}, {bill_create_place_default: params.place, bill_create_city_default: params.city, bill_create_pincode_default: params.pincode}, (err, res) => {
                            if(err) {
                                let gsError = GsErrorCtrl.create({className: 'UserPreference', methodName: '_insertOrUpdate', message: 'Error occured while updating defaults in DB', cause: err});
                                return reject(gsError);
                            } else {
                                return resolve(res);
                            }
                        });
                    } else {
                        UserPreference.create({userId: params._userId, bill_create_place_default: params.place, bill_create_city_default: params.city, bill_create_pincode_default: params.pincode}, (err, res) => {
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