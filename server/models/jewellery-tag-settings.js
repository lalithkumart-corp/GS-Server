'use strict';
let app = require('../server.js');
let utils = require('../utils/commonUtils');

module.exports = function(JewelleryTagSettings) {

    JewelleryTagSettings.getSettingsApiHandler = async (accessToken) => {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let tagSettings = await JewelleryTagSettings._getSettings(accessToken);
            return {STATUS: 'SUCCESS', TAG_SETTINGS: tagSettings};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }

    JewelleryTagSettings.remoteMethod('getSettingsApiHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken;
                    if(req && req.headers.authorization)
                        accessToken = req.headers.authorization;
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
        http: {path: '/get-settings', verb: 'get'},
        description: 'For fetching tag settings.',
    });

    JewelleryTagSettings.remoteMethod('updateTagPreferenceApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken;
                    if(req && req.headers.authorization)
                        accessToken = req.headers.authorization;
                    return accessToken;
                },
                description: 'Authorization from header',
            }, {
                arg: 'payload',
                type: 'object',
                default: {
                    
                },
                http: {
                    source: 'body',
                },
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/update-tag-selection', verb: 'put'},
        description: 'Updates tag selection'
    });

    JewelleryTagSettings._getSettings = (accessToken) => {
        return new Promise(async (resolve, reject) => {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            JewelleryTagSettings.dataSource.connector.query(SQL.GET_SETTINGS, [_userId], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res[0] || null);
                }
            });
        });
    }

    JewelleryTagSettings.updateTagPreferenceApi = async (accessToken, payload) => {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            await JewelleryTagSettings._updateTagPreference(accessToken, payload);
            return {STATUS: 'SUCCESS', MESSAGE: 'UPDATED SUCCESSFULLY'};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }

    JewelleryTagSettings._updateTagPreference = (accessToken, payload) => {
        return new Promise(async (resolve, reject) => {
            try {
                let _userId = await utils.getStoreOwnerUserId(accessToken);
                let records = await JewelleryTagSettings.find({where: {userId: _userId}});
                if(records && records.length > 0) {
                    await JewelleryTagSettings.updateAll({userId: _userId}, {selectedTagId: payload.selectedTemplateId, storeNameAbbr: payload.storeNameAbbr});
                } else {
                    await JewelleryTagSettings.create({userId: _userId, selectedTagId: payload.selectedTemplateId, storeNameAbbr: payload.storeNameAbbr});
                }
                return resolve(true);
            } catch(e) {
                return reject(false);
            }
        });
    }
};

let SQL = {
    GET_SETTINGS: `SELECT 
                        settings.selected_tag_template_id,
                        settings.store_name_abbr,
                        settings.customization
                    FROM
                        jewellery_tag_settings settings
                            LEFT JOIN
                        jewellery_tag_avl_template_list list ON settings.selected_tag_template_id = list.template_id
                    WHERE
                        settings.user_id = ?`
}
