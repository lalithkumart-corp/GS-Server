'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');

module.exports = function(Stock) {
    Stock.fetchList = async (accessToken, params) => {
        try {
            params = params || {};
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let list = await Stock._fetchList(params);
            return {STATUS: 'SUCCESS', STOCK_LIST: list};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock._fetchList = (params) => {
        return new Promise( (resolve, reject) => {
            let sql = SQL.FETCH_LIST;
            sql += Stock._getFilterQueryPart(params);
            Stock.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    Stock._getFilterQueryPart = (params) => {
        // let query = WHERE
        // stock.user_id = ?
        let filterList = [];
        if(params._userId)
            filterList.push(`stock.user_id = ${params._userId}`);
        if(params.supplier)
            filterList.push(`suppliers.name like '${params.supplier}%'`);
        return ` WHERE ${filterList.join(' AND ')}`;
    }

    Stock.remoteMethod('fetchList', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    return access_token;
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
        http: {path: '/fetch-list', verb: 'get'},
        description: 'For fetching stock list.',
    });

    Stock.remoteMethod('insertApiHandler', {
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
        http: {path: '/insert', verb: 'post'},
        description: 'For testing purpose.',
    });

    Stock.insertApiHandler = async (data) => {
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._stockTableName = Stock._getStockTableName(params._userId);;
            if(!params.ornamentId) {
                let obj =  await Stock.app.models.JewellryOrnament.handleOrnData(params);
                params.ornamentId = obj.id;
            }
            if(!params.touchId)
                params.touchId = await Stock.app.models.Touch.getId(params.productPureTouch);
            if(!params.supplierId)
                params.supplierId = await Stock.app.models.Supplier.getId(params.dealerStoreName);
            params.soldQty = 0;
            params.avlQty = params.productQty;
            await Stock._insert(params);
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully inserted item in Stock'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock._insert = (params) => {
        return new Promise((resolve, reject) => {
            params._tableName = Stock._getStockTableName();
            let query = Stock._constructQuery('insert', params);
            Stock.dataSource.connector.query(query, (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        });
    }

    Stock._getStockTableName = (userId) => {
        let tableName = 'stock_' + userId;
        return tableName;
    }

    Stock._constructQuery = (identifier, params) => {
        let sql = '';
        switch(identifier) {
            case 'insert':
                sql += `INSERT INTO ${params._stockTableName}
                        (
                            user_id, ornament,
                            touch_id, i_touch,
                            quantity, 
                            gross_wt, net_wt, pure_wt,
                            metal_rate, amount,
                            cgst_percent, cgst_amt,
                            sgst_percent, sgst_amt,
                            igst_percent, igst_amt,
                            total,
                            supplierId, personName,
                            sold_qty, avl_qty
                        ) VALUES (
                            ${params._userId}, ${params.ornamentId},
                            ${params.touchId}, ${params.productITouch},
                            ${params.productQty},
                            ${params.productGWt}, ${params.productNWt}, ${params.productPWt},
                            ${params.metalPrice}, ${params.calcAmtWithLabour},
                            ${params.productCgstPercent || 0}, ${params.productCgstAmt || 0},
                            ${params.productSgstPercent || 0}, ${params.productSgstAmt || 0},
                            ${params.productIgstPercent || 0}, ${params.productIgstAmt || 0},
                            ${params.productTotalAmt},
                            ${params.supplierId}, "${params.dealerPersonName}",
                            ${params.soldQty}, ${params.avlQty}
                        )`;
                break;
        }
        return sql;
    }
};

let SQL = {
    FETCH_LIST: `SELECT
                    dealer_purchase_bill.id AS PurchaseBillId,
                    suppliers.name AS SuplierName,
                    metal.name AS Metal,
                    orn_list_jewellery.code AS ProductCode,
                    item_category.name AS Name,
                    item_subcategory.name AS ItemCategory,
                    stock.quantity AS PurchasedQty,
                    stock.sold_qty AS SoldQty,
                    stock.avl_qty AS AvlQty,
                    stock.metal_rate AS MetalRate,
                    touch.name AS Touch,
                    stock.gross_wt AS GrossWt,
                    stock.net_wt AS NetWt,
                    stock.pure_wt AS PureWt
                FROM
                    stock
                    LEFT JOIN dealer_purchase_bill ON stock.purchase_bill = dealer_purchase_bill.id
                    LEFT JOIN suppliers ON dealer_purchase_bill.supplier_id = suppliers.id
                    LEFT JOIN orn_list_jewellery ON stock.ornament = orn_list_jewellery.id
                    LEFT JOIN metal ON orn_list_jewellery.metal = metal.id
                    LEFT JOIN item_category ON orn_list_jewellery.item_category = item_category.id
                    LEFT JOIN item_subcategory ON orn_list_jewellery.item_subcategory = item_subcategory.id
                    LEFT JOIN touch ON stock.touch_id = touch.id
                `
}