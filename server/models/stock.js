'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');
module.exports = function(Stock) {
    Stock.fetchList = async (accessToken, filters) => {
        try {
            let params = { filters };
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
            sql = sql.replace(/STOCK_TABLE/g, `stock_${params._userId}`);
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
        let filterList = [];
        // if(params._userId)
        //     filterList.push(`STOCK_TABLE.user_id = ${params._userId}`);
        if(params.filters) {
            if(params.filters.supplier)
                filterList.push(`suppliers.name like '${params.filters.supplier}%'`);
            if(params.filters.itemName)
                filterList.push(`orn_list_jewellery.item_name like '${params.filters.itemName}%'`);
            if(params.filters.itemCategory)
                filterList.push(`orn_list_jewellery.item_category like '${params.filters.itemCategory}%'`);
            if(params.filters.itemSubCategory)
                filterList.push(`orn_list_jewellery.item_subcategory like '${params.filters.itemSubCategory}%'`);
            if(params.filters.dimension)
                filterList.push(`orn_list_jewellery.dimension like '${params.filters.dimension}%'`);
        }
        if(filterList.length)
            return ` WHERE ${filterList.join(' AND ')}`;
        return '';
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
                arg: 'filters', type: 'object', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let filters = req && req.query.filters;
                    filters = filters ? JSON.parse(filters) : {};
                    return filters;
                },
                description: 'filters Arguments goes here',
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

    Stock.remoteMethod('fetchProductIdsApiHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    return access_token;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'filters', type: 'object', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let filters = req && req.query.filters;
                    filters = filters ? JSON.parse(filters) : {};
                    return filters;
                },
                description: 'filters Arguments goes here',
        }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/fetch-product-ids', verb: 'get'},
        description: 'For fetching productIds.',
    });

    Stock.remoteMethod('fetchItemByProdId', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    return access_token;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'prodId', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let prodId = req && req.query.prod_id;
                    return prodId;
                },
                description: 'prodId Arguments goes here',
        }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/fetch-by-prod-id', verb: 'get'},
        description: 'For fetching stock item by Prod Id',
    });

    Stock.insertApiHandler = async (data) => {
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._stockTableName = Stock._getStockTableName(params._userId);;
            //if(!params.ornamentId) {
                let obj =  await Stock.app.models.JewellryOrnament.handleOrnData(params);
                params.ornamentId = obj.id;
                params.productCodeTableId = obj.productCodeTableId;
                params.productCodeSeries = obj.productCodeSeries;
                params.productCodeNumber = obj.productCodeNumber;
            //}
            if(!params.touchId)
                params.touchId = await Stock.app.models.Touch.getId(params.productPureTouch);
            if(!params.supplierId)
                params.supplierId = await Stock.app.models.Supplier.getId(params.dealerStoreName);
            params.soldQty = 0;
            params.avlQty = params.productQty;
            await Stock._insert(params);
            await Stock.app.models.ProductCode.incrementSerialNumber(params.productCodeTableId);
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
                            pr_code, pr_number,
                            prod_id,
                            touch_id, i_touch,
                            quantity, 
                            gross_wt, net_wt, pure_wt,
                            labour_charge, labour_charge_unit, calc_labour_amt,
                            metal_rate, amount,
                            cgst_percent, cgst_amt,
                            sgst_percent, sgst_amt,
                            igst_percent, igst_amt,
                            total,
                            supplierId, personName,
                            sold_qty, avl_qty
                        ) VALUES (
                            ${params._userId}, ${params.ornamentId},
                            "${params.productCodeSeries}", ${params.productCodeNumber},
                            "${params.productCodeSeries}${params.productCodeNumber}",
                            ${params.touchId}, ${params.productITouch},
                            ${params.productQty},
                            ${params.productGWt}, ${params.productNWt}, ${params.productPWt},
                            ${params.productLabourCharges}, "${params.productLabourCalcUnit}", ${params.productCalcLabourAmt},
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

    Stock.fetchProductIdsApiHandler = async (accessToken, filters) => {
        try {
            let params = {filters};
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let list = await Stock._fetchProductIds(params);
            return {STATUS: 'SUCCESS', LIST: list};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock._fetchProductIds = (params) => {
        return new Promise((resolve, reject) => {
            let sql = SQL.FETCH_PRODUCT_IDS.replace('STOCK_TABLE', `stock_${params._userId}`);
            Stock.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    let obj = [];
                    _.each(res, (row, index) => {
                        obj.push(row.prod_id);
                    });
                    return resolve(obj);
                }
            });
        });
    }

    Stock.fetchItemByProdId = async (accessToken, prodId) => {
        try {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let item = await Stock._fetchItemByProdId(prodId, _userId);
            return {STATUS: 'SUCCESS', ITEM: item};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock._fetchItemByProdId = (prodId, _userId) => {
        return new Promise((resolve, reject) => {
            let sql = SQL.FETCH_ITEM_BY_PRODID.replace(/STOCK_TABLE/g, `stock_${_userId}`);
            Stock.dataSource.connector.query(sql, [prodId], (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(result[0]);
                }
            });
        });
    }
};

let SQL = {
    FETCH_LIST: `SELECT
                    STOCK_TABLE.id AS Id,
                    orn_list_jewellery.metal AS Metal,
                    orn_list_jewellery.item_name AS ItemName,
                    orn_list_jewellery.item_category AS ItemCategory,
                    orn_list_jewellery.item_subcategory AS ItemSubCategory,
                    orn_list_jewellery.dimension AS Dimension,
                    STOCK_TABLE.pr_code AS ItemCode,
                    STOCK_TABLE.pr_number AS ItemCodeNumber,
                    suppliers.name AS Supplier,
                    STOCK_TABLE.personName AS SupplierPersonName,
                    touch.purity AS PTouchValue,
                    touch.name AS PTouchName,
                    STOCK_TABLE.i_touch AS ITouchValue,
                    STOCK_TABLE.quantity AS Qty,
                    STOCK_TABLE.gross_wt AS GWt,
                    STOCK_TABLE.net_wt AS NWt,
                    STOCK_TABLE.pure_wt AS PWt,
                    STOCK_TABLE.metal_rate AS MetalRate,
                    STOCK_TABLE.amount AS Amount,
                    STOCK_TABLE.cgst_percent AS CgstPercent,
                    STOCK_TABLE.cgst_amt AS CgstAmt,
                    STOCK_TABLE.sgst_percent AS SgstPercent,
                    STOCK_TABLE.sgst_amt AS SgstAmt,
                    STOCK_TABLE.igst_percent AS IgstPercent,
                    STOCK_TABLE.igst_amt AS IgstAmt,
                    STOCK_TABLE.total AS Total,
                    STOCK_TABLE.sold_qty AS SoldQty,
                    STOCK_TABLE.avl_qty AS AvlQty
                FROM
                    STOCK_TABLE
                    LEFT JOIN orn_list_jewellery ON STOCK_TABLE.ornament = orn_list_jewellery.id
                    LEFT JOIN suppliers ON STOCK_TABLE.supplierId = suppliers.id
                    LEFT JOIN touch ON STOCK_TABLE.touch_id = touch.id
                ORDER BY STOCK_TABLE.created_date DESC;`,
    FETCH_LIST_OLD: `SELECT
                    dealer_purchase_bill.id AS PurchaseBillId,
                    suppliers.name AS SupplierName,
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
                `,
    FETCH_PRODUCT_IDS: `SELECT prod_id from STOCK_TABLE WHERE avl_qty <> 0`,
    FETCH_ITEM_BY_PRODID: `SELECT
                                STOCK_TABLE.id,
                                pr_code,
                                pr_number,
                                prod_id,
                                i_touch,
                                touch.purity AS pure_touch,
                                quantity,
                                gross_wt, net_wt, pure_wt,
                                labour_charge, labour_charge_unit, calc_labour_amt,
                                metal_rate, amount,
                                cgst_percent, cgst_amt, sgst_amt, sgst_percent,
                                total,
                                sold_qty, avl_qty,
                                suppliers.name,
                                ornament,
                                orn_list_jewellery.metal as metal,
                                orn_list_jewellery.item_name as item_name,
                                orn_list_jewellery.item_category as item_category,
                                orn_list_jewellery.item_subcategory as item_subcategory,
                                orn_list_jewellery.dimension as dimension
                            FROM
                                STOCK_TABLE
                                LEFT JOIN suppliers ON suppliers.id = STOCK_TABLE.supplierId
                                LEFT JOIN orn_list_jewellery ON orn_list_jewellery.id = STOCK_TABLE.ornament
                                LEFT JOIN touch ON touch.id = STOCK_TABLE.touch_id
                            WHERE prod_id=?`
}