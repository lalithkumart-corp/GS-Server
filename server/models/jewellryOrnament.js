'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');
let sh = require('shorthash');

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

    JewellryOrnament.handleOrnData = async (params) => {
        try {
            let hashKey = JewellryOrnament._generateHashKey(params);
            let ornRow = await JewellryOrnament._isAlreadyExists(hashKey);
            if(!ornRow)
                ornRow = await JewellryOrnament._create(params, hashKey);
            return {
                id: ornRow.id
            }
        } catch(e) {
            throw e;
        }
    }

    JewellryOrnament._create = async (params, hashKey) => {
        try {
            let result = await JewellryOrnament.create({
                userId: params._userId,
                metal: params.metal,
                itemName: params.productName,
                itemCategory: params.productCategory,
                itemSubCategory: params.productSubCategory,
                dimension: params.productDimension,
                hashKey: hashKey
            });
            return result;
        } catch(e) {
            throw e;
        }
    }

    JewellryOrnament._generateHashKey = (params) => {
        let categ = (params.metal || '').toLowerCase();
        let item = (params.productName || '').toLowerCase();
        let productCateg = (params.productCategory || '').toLowerCase();
        let productSubCategory = (params.productSubCategory || '').toLowerCase();
        let dimension = (params.productDimension || '').toLowerCase();
        return sh.unique( categ + item + productCateg + productSubCategory + dimension);
    }

    JewellryOrnament._isAlreadyExists = (hashKey, optional) => {
        return new Promise( (resolve, reject) => {
            let whereCondition = {hashKey: hashKey}

            if(optional) {
                if(optional.ignoreCustId)
                    whereCondition.customerId = {neq: optional.ignoreCustId};
                if(optional.onlyActive)
                    whereCondition.status = {neq: 0};
                if(optional.userId)
                    whereCondition.userId = optional.userId;
            }

            JewellryOrnament.findOne({where: whereCondition}, (err, result) => {
                if(err) {
                    //TODO: Log the error
                    reject(err);
                } else {
                    if(result)
                        resolve(result);
                    else
                        resolve(false);
                }
            });
        });
    }
};

let SQL = {
    FETCH_LIST: `SELECT
                    id,
                    metal,
                    item_name AS name,
                    item_category AS category,
                    item_subcategory AS subCategory,
                    dimension,
                    code,
                    hashkey
                FROM 
                    orn_list_jewellery 
                WHERE 
                    user_id = ?`,
    FETCH_LIST_OLD: `SELECT
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