'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');
let sh = require('shorthash');
const { getStoreOwnerUserId } = require('../utils/commonUtils');

module.exports = function(JewellryOrnament) {

    JewellryOrnament.remoteMethod('createApiHandler', {
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
        http: {path: '/create-new-orn', verb: 'post'},
        description: 'For inserting new ornament in DB.',
    });

    JewellryOrnament.remoteMethod('updateApiHandler', {
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
        http: {path: '/update-orn', verb: 'post'},
        description: 'For updating the ornament in DB.',
    });

    JewellryOrnament.remoteMethod('deleteApiHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    return access_token;
                },
                description: 'Accesstoken value',
            }, {
                arg: 'ornId', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let ornId = req && req.query.orn_id;
                    return ornId;
                },
                description: 'Ornament Id',
            }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/delete-orn', verb: 'delete'},
        description: 'For Deleting the ornament in DB.',
    });

    JewellryOrnament.remoteMethod('fetchList', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    return access_token;
                },
                description: 'Accesstoken value',
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

    JewellryOrnament.createApiHandler = async (data, cb) => {
        try {
            //data = JewellryOrnament.normalizeData(data, 'create');
            if(!data.accessToken)
                throw 'Access Token is missing';
            data._userId = await getStoreOwnerUserId(data.accessToken);
            let productCodeRow = await JewellryOrnament.app.models.ProductCode.getCodeId(data.productCode, data._userId);
            data.productCodeTableId = productCodeRow.id;
            data._hashKey = JewellryOrnament._generateHashKey(data);
            data._isAlreadyExists = await JewellryOrnament._isAlreadyExists(data._hashKey, {userId: data._userId});
            if(!data._isAlreadyExists) {
                await JewellryOrnament._create(data);
            } else {
                throw new Error('Item already exists with same details');
            }
            return { STATUS: 'SUCCESS', MSG: 'Inserted new Item Successfully'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    JewellryOrnament.updateApiHandler = async (data, cb) => {
        try {
            //data = JewellryOrnament.normalizeData(data, 'update');
            if(!data.accessToken)
                throw 'Access Token is missing';
            data._userId = await getStoreOwnerUserId(data.accessToken);
            let productCodeRow = await JewellryOrnament.app.models.ProductCode.getCodeId(data.productCode, data._userId);
            data.productCodeTableId = productCodeRow.id;
            data._hashKey = JewellryOrnament._generateHashKey(data);
            data._isAlreadyExists = await JewellryOrnament._isAlreadyExists(data._hashKey, {userId: data._userId, ignoreOrnId: data.id});
            if(!data._isAlreadyExists)
                await JewellryOrnament._update(data);
            else
                throw new Error('Item With Same Detail already exists');
            return { STATUS: 'SUCCESS', MSG: 'Updated the Item Successfully'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    JewellryOrnament.deleteApiHandler = async (accessToken, ornId) => {
        try {
            if(!accessToken)
                throw 'Access Token is missing';
            let _userId = await getStoreOwnerUserId(accessToken);
            await JewellryOrnament._delete(ornId, _userId);
            return { STATUS: 'SUCCESS', MSG: 'Deleted the specific item Successfully'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    JewellryOrnament.normalizeData = (data, remoteMethodName) => {
        switch(remoteMethodName) {
            case 'create':
                //Placeholder. Can add some logic In Future if necessary.
                break;
            default:
                console.log('Do Nothing.');
                break;
        }
        return data;
    }

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

    JewellryOrnament.handleOrnData = async (params, options) => {
        try {
            params = JSON.parse(JSON.stringify(params));

            let productCodeRow = await JewellryOrnament.app.models.ProductCode.getCodeId(params.productCodeSeries, params._userId);
            if(options && options.updateAPI && params.productCodeNo && params.productCodeSeries) {
                productCodeRow = {
                    id: productCodeRow.id,
                    nextSerial: params.productCodeNo,
                    isNewSerialNo: false
                }
            } else {
                productCodeRow.isNewSerialNo = true;
            }

            params.productCodeTableId = productCodeRow.id;
            let hashKey = JewellryOrnament._generateHashKey({...params});
            let ornRow = await JewellryOrnament._isAlreadyExists(hashKey);
            if(!ornRow)
                ornRow = await JewellryOrnament._create(params, hashKey);
            return {
                id: ornRow.id,
                productCodeTableId: productCodeRow.id,
                productCodeSeries: params.productCodeSeries,
                productCodeNumber: productCodeRow.nextSerial,
                isNewSerialNo: productCodeRow.isNewSerialNo
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
                //code: params.productCode,
                codeId: params.productCodeTableId,
                hashKey: hashKey || params._hashKey
            });
            return result;
        } catch(e) {
            throw e;
        }
    }

    JewellryOrnament._update = async (params, hashKey) => {
        return new Promise( (resolve, reject) => {
            try {
                let queryValues = [params.metal, params.productName,
                                    params.productCategory, params.productSubCategory,
                                    params.productDimension, params.productCodeTableId,
                                    params._hashKey, params.id
                                ];
                JewellryOrnament.dataSource.connector.query(SQL.UPDATE_ORN_ITEM, queryValues, (err, result) => {
                    if(err) {
                        return reject(err);
                    } else {
                        return resolve(true);
                    }
                });
            } catch(e) {
                return reject(e);
            }     
        });
    }

    JewellryOrnament._delete = async (ornId, userId) => {
        return new Promise( (resolve, reject) => {
            try {
                JewellryOrnament.dataSource.connector.query(SQL.DELETE_ORN_ITEM, [ornId, userId], (err, result) => {
                    if(err) {
                        return reject(err);
                    } else {
                        return resolve(true);
                    }
                })
            } catch(e) {
                return reject(e);
            }
        });
    }

    JewellryOrnament._generateHashKey = (params) => {
        let categ = (params.metal || '').toLowerCase();
        let item = (params.productName || '').toLowerCase();
        let productCateg = (params.productCategory || '').toLowerCase();
        let productSubCategory = (params.productSubCategory || '').toLowerCase();
        let dimension = (params.productDimension || '').toLowerCase();
        let productId = params.productCodeTableId || 0;
        return sh.unique( categ + item + productCateg + productSubCategory + dimension + productId);
    }

    JewellryOrnament._isAlreadyExists = (hashKey, optional) => {
        return new Promise( (resolve, reject) => {
            let whereCondition = {hashKey: hashKey}

            if(optional) {
                if(optional.ignoreOrnId) // in "Update-orn" scenario
                    whereCondition.id = {neq: optional.ignoreOrnId};
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
                    orn_list_jewellery.id AS id,
                    metal,
                    item_name AS itemName,
                    item_category AS itemCategory,
                    item_subcategory AS itemSubCategory,
                    dimension AS itemDim,
                    product_code.code AS itemCode,
                    hashkey
                FROM 
                    orn_list_jewellery 
                    LEFT JOIN product_code ON orn_list_jewellery.code_id=product_code.id
                WHERE 
                    orn_list_jewellery.user_id = ?`,
    UPDATE_ORN_ITEM: `UPDATE orn_list_jewellery SET metal=?, item_name=?, item_category=?, item_subcategory=?, dimension=?, code_id=?, hashkey=? WHERE id=?`,
    DELETE_ORN_ITEM: `DELETE FROM orn_list_jewellery WHERE id=? AND user_id=?`,
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