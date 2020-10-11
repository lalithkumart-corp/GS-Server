'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');

module.exports = function(JewellryOrnament) {
    JewellryOrnament.fetchList = async (accessToken) => {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let resp = await JewellryOrnament._fetchOrnListFromDB(userId);
            return {STATUS: 'SUCCESS', RESPONSE: resp};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    JewellryOrnament._fetchOrnListFromDB = (userId) => {
        return new Promise((resolve, reject) => {
            JewellryOrnament.dataSource.connector.query(SQL.FETCH_LIST, [userId], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    let resp = [];
                    _.each(res, (anOrnObj, index) => {
                        resp.push(anOrnObj);             
                    });
                    return resolve(resp);
                }
            });
        });
    }

    JewellryOrnament.remoteMethod('fetchList', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
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
        http: {path: '/fetch-orn-list', verb: 'get'},
        description: 'For fetching JewellryOrnament list.',
    });
};

let SQL = {
    FETCH_LIST: `SELECT
                    orn_list_jewellery.id AS id,
                    metal.name AS metal,
                    item_category.name AS itemCategory,
                    item_subcategory.name AS itemSubCategory,
                    code AS itemCode
                FROM
                    orn_list_jewellery
                    LEFT JOIN metal ON orn_list_jewellery.metal = metal.id
                    LEFT JOIN item_category ON orn_list_jewellery.item_category = item_category.id
                    LEFT JOIN item_subcategory ON orn_list_jewellery.item_subcategory = item_subcategory.id
                WHERE
                    orn_list_jewellery.user_id = ?`
}