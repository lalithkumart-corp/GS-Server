'use strict';
let app = require('../server');
let _ = require('lodash');
let utils = require('../utils/commonUtils');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
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

    Ornament.createOrn = async (params) => {
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await Ornament._insertInDB(params);
            return {
                STATUS: 'success',
                MSG: 'Inserted ornament in DB'
            }
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'Ornament', methodName: 'createOrn', cause: e, message: 'Exception caught while inserting new ornament in DB'}));
            return {
                STATUS: 'error',
                ERROR: e,
                ERR_MSG: e.message
            }
        }
    }

    Ornament.remoteMethod('createOrn', {
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
                source: 'body',
            },
        },
        http: {path: '/create', verb: 'post'},
        description: 'For Updating an ornament.',
    });

    Ornament.updateOrn = async (params) => {
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await Ornament._updateInDB(params);
            return {
                STATUS: 'success',
                MSG: 'Updated ornament in DB'
            }
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'Ornament', methodName: 'updateOrn', cause: e, message: 'Exception caught while updating existing ornament in DB'}));
            return {
                STATUS: 'error',
                ERROR: e,
                ERR_MSG: e.message
            }
        }
    }

    Ornament.remoteMethod('updateOrn', {
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
                source: 'body',
            },
        },
        http: {path: '/update-item', verb: 'post'},
        description: 'For Updating an ornament.',
    });

    Ornament.deleteOrn = async (params) => {
        try {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            await Ornament._deleteFromDB(params);
            return {
                STATUS: 'success',
                MSG: 'Successfully deleted the ornament from DB'
            }
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'Ornament', methodName: 'deleteOrn', cause: e, message: 'Exception caught while deleting an ornament from DB'}));
            return {
                STATUS: 'error',
                ERROR: e,
                ERR_MSG: e.message
            }
        }
    }

    Ornament.remoteMethod('deleteOrn', {
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
                source: 'body',
            },
        },
        http: {path: '/delete', verb: 'post'},
        description: 'For Updating an ornament.',
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
                        resp.push(anOrnObj);
                    });
                    resolve(resp);
                }
            });
        });        
    }

    Ornament._insertInDB = (params) => {
        return new Promise( (resolve, reject) => {
            Ornament.create({userId: params._userId, title: params.title, category: params.category}, (err, res) => {
                if(err) {
                    let e = GsErrorCtrl.create({className: 'Ornament', methodName: '_insertInDB', cause: err, message: 'Error occured while inserting an ornament in DB'});
                    reject(e);
                } else {
                    resolve(true);
                }
            });
        });
    }

    Ornament._updateInDB = (params) => {
        return new Promise( (resolve, reject) => {
            Ornament.update({id: params.id, userId: params._userId}, {title: params.title, category: params.category}, (err, res) => {
                if(err) {
                    let e = GsErrorCtrl.create({className: 'Ornament', methodName: '_updateInDB', cause: err, message: 'Error occured while updating the ornament in DB'});
                    reject(e);
                } else {
                    resolve(true);
                }
            });
        });
    }

    Ornament._deleteFromDB = (params) => {
        return new Promise( (resolve, reject) => {
            Ornament.destroyAll({id: params.id, userId: params._userId}, (err, res) => {
                if(err) {
                    let e = GsErrorCtrl.create({className: 'Ornament', methodName: '_deleteFromDB', cause: err, message: 'Error occured while deleting the ornament from DB'});
                    reject(e);
                } else {
                    resolve(true);
                }
            });
        });
    }
};
