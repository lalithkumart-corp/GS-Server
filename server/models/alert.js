'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');

module.exports = function(Alert) {
    Alert.remoteMethod('createNew', {
        accepts: {
            arg: 'params',
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
        http: {path: '/create-new', verb: 'post'},
        description: 'Create New Alert'
    });

    Alert.remoteMethod('updateAlert', {
        accepts: {
            arg: 'data',
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
        http: {path: '/update-alert', verb: 'put'},
        description: 'Updates an Alert'
    });

    Alert.remoteMethod('deleteAlert', {
        accepts: {
            arg: 'data',
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
        http: {path: '/delete-alert', verb: 'del'},
        description: 'Delete an Alert'
    });

    Alert.remoteMethod('getAlertsList', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'params', type: 'object', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let params = req && req.query.params;
                    params = params ? JSON.parse(params) : {};
                    return params;
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
        http: {path: '/get-alerts-list', verb: 'get'},
        description: 'For fetching alerts list.',
    });

    Alert.remoteMethod('archiveAlert', {
        accepts: {
            arg: 'data',
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
        http: {path: '/archive-an-alert', verb: 'put'},
        description: 'Archives an Alert'
    });

    Alert.createNew = async (params) => {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._userId = userId;
            let dbParams = {userId, triggerTime: params.triggerTime, code: params.code, title: params.title, message: params.message, extraCtx: params.extraCtx, module: params.module};
            let alertRes = await Alert._create(dbParams);
            if(params.link) {
                if(params.link.to == 'pledgebook') {
                    let pledgebookTableName = await Alert.app.models.Pledgebook.getPledgebookTableName(params._userId);
                    await Alert._linkToPledgebookBill(pledgebookTableName, params.link.uniqueIdentifier, alertRes.id);
                }
            }
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Alert._create = (dbParams) => {
        return new Promise((resolve, reject) => {
            Alert.create(dbParams, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        })
    }

    Alert._linkToPledgebookBill = (pledgebookTableName, uniqueIdentifier, alertId) => {
        return new Promise((resolve, reject) => {
            let query = `UPDATE ${pledgebookTableName} SET Alert=${alertId} WHERE UniqueIdentifier=${uniqueIdentifier}`;
            Alert.dataSource.connector.query(query, (err, result) => {
                if(err) {
                    reject ( err );
                } else {
                    resolve( result );
                }
            });
        })
    }

    Alert.updateAlert = async (params) => {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            await Alert._updateAlert(params);
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Alert._updateAlert = (params) => {
        return new Promise(async (resolve, reject) => {
            Alert.updateAll({id: params.alertId}, {title: params.title, message: params.message, triggerTime: params.triggerTime}, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    Alert.deleteAlert = async (params) => {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            await Alert._deleteAlert(params);
            await Alert._unLinkFromPledgebook(params);
            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Alert._deleteAlert = (params) => {
        return new Promise( (resolve, reject) => {
            Alert.deleteById(params.alertId, (err, res) => {
                if(err)
                    return reject(err);
                else
                    return resolve(res);
            });
        });
    }

    Alert._unLinkFromPledgebook = (params) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._userId = userId;
            let pledgebookTableName = await Alert.app.models.Pledgebook.getPledgebookTableName(params._userId);
            let query = `UPDATE ${pledgebookTableName} SET Alert=NULL WHERE UniqueIdentifier=${params.link.uniqueIdentifier}`;
            Alert.dataSource.connector.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    Alert.getAlertsList = async (accessToken, params) => {
        try {
            if(!accessToken)
                throw 'Access Token is missing';
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let alertsList = await Alert._getAlertList(userId, params);
            return {STATUS: 'SUCCESS', ALERTS: alertsList};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Alert._getAlertList = (userId, params) => {
        return new Promise( (resolve, reject) => {
            let sql = `SELECT * FROM alerts WHERE user_id=${userId} AND archived=0 AND trigger_time <= UTC_TIMESTAMP() ORDER BY trigger_time DESC LIMIT 100`;
            Alert.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    Alert.archiveAlert = async (params) => {
        try {
            if(!params.accessToken)
                throw 'Access Token is missing';
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let status = await Alert._archiveAlert(params);
            return {STATUS: 'SUCCESS', ARCHIVED_STATUS: status};
        } catch(e) {
            return {STATUS: 'ERROR', ARCHIVED_STATUS: false, ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Alert._archiveAlert = (params) => {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE alerts SET has_read=1, archived=1 WHERE id=${params.id}`;
            Alert.dataSource.connector.query(sql, (err, resp) => {
                if(err)
                    return reject(err);
                else
                    return resolve(true);
            });
        });
    }
};
