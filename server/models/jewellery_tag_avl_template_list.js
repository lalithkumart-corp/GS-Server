'use strict';
let app = require('../server.js');
let utils = require('../utils/commonUtils');

module.exports = function(JewelleryTagAvlTemplates) {

    JewelleryTagAvlTemplates.remoteMethod('fetchListApiHandler', {
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
        http: {path: '/fetch-list', verb: 'get'},
        description: 'For fetching tag avl list.',
    });
    
    JewelleryTagAvlTemplates.fetchListApiHandler = async (accessToken) => {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let tagTemplates = await JewelleryTagAvlTemplates._getTemplateList(accessToken);
            return {STATUS: 'SUCCESS', TAG_TEMPLATES: tagTemplates};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    };

    JewelleryTagAvlTemplates._getTemplateList = async (accessToken) => {
        return new Promise(async (resolve, reject) => {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            JewelleryTagAvlTemplates.dataSource.connector.query(SQL.FETCH_TAG_TEMPLATES, [_userId], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

};
let SQL = {
    FETCH_TAG_TEMPLATES: `SELECT 
                            templates.template_id, 
                            templates.screenshot_url,
                            settings.selected_tag_template_id,
                            settings.customization
                        FROM
                            gsprod.jewellery_tag_avl_template_list templates 
                                LEFT JOIN
                            gsprod.jewellery_tag_settings settings ON (settings.selected_tag_template_id = templates.template_id AND settings.user_id = ?)`,
}
