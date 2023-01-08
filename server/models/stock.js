'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
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
            // console.log(sql);
            Stock.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    Stock._getFilterQueryPart = (params, requireOnlyTotals=false) => {
        let filterList = [];
        let sql = '';
        if(params.filters) {
            if(params.filters.metalCategory){
                let t1 = [];
                _.each(params.filters.metalCategory, (aCateg, index) => {
                    t1.push(`orn_list_jewellery.metal = '${aCateg}'`);
                })
                if(t1.length)
                    filterList.push(`(${t1.join(' OR ')})`);
                else
                    filterList.push(`orn_list_jewellery.metal NOT IN ('G', 'S')`);
            }
            if(params.filters.prodId)
                filterList.push(`STOCK_TABLE.prod_id like '${params.filters.prodId.replace('-','')}%'`);
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
            if(params.filters.date)
                filterList.push(`(STOCK_TABLE.date BETWEEN '${params.filters.date.startDate}' AND '${params.filters.date.endDate}')`);
            if(params.filters.showOnlyAvlStockItems)
                filterList.push(`STOCK_TABLE.avl_qty <> 0`);
        }
        if(filterList.length)
            sql = ` WHERE ${filterList.join(' AND ')}`;

        sql += ' ORDER BY STOCK_TABLE.created_date DESC';
    
        if(!requireOnlyTotals) {
            let limit = (params.filters.offsetEnd - params.filters.offsetStart);
            sql += ` LIMIT ${limit} OFFSET ${params.filters.offsetStart}`;
        }
        return sql;
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

    Stock.remoteMethod('fetchTotals', {
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
        http: {path: '/fetch-totals', verb: 'get'},
        description: 'For fetching stock total count.',
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

    Stock.remoteMethod('updateApiHandler', {
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
        description: 'For Updating stock item.',
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

    Stock.remoteMethod('fetchItemsByProdIds', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    if(!access_token && req && req.headers.authorization)
                        access_token = req.headers.authorization || req.headers.Authorization;
                    return access_token;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'prodIds', type: 'array', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let prodIds = req && req.query.prod_ids;
                    return JSON.parse(prodIds);
                },
                description: 'prodIds Arguments goes here',
        }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/fetch-by-prod-ids', verb: 'get'},
        description: 'For fetching stock item by Prod Id',
    });

    Stock.remoteMethod('fetchSoldOutItemList', {
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
        http: {path: '/fetch-sold-out-item-list', verb: 'get'},
        description: 'For testing purpose.',
    });

    Stock.remoteMethod('fetchSoldOutItemTotals', {
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
        http: {path: '/fetch-sold-out-item-total', verb: 'get'},
        description: 'For testing purpose.',
    });

    Stock.remoteMethod('sellItemApiHandler', {
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
        http: {path: '/sell-item', verb: 'post'},
        description: 'For testing purpose.',
    });

    Stock.insertApiHandler = async (data) => {
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);

            // CHECK FOR USER ACTIVE STATUS
            let isActiveUser = await utils.getAppStatus(params._userId);
            if(!isActiveUser)
                throw 'User is Not Active';

            params._stockTableName = Stock._getStockTableName(params._userId);
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
            params._uid = (Date.now() + Math.random()).toString(36).replace('.', '');
            await Stock._insert(params);
            await Stock.app.models.ProductCode.incrementSerialNumber(params.productCodeTableId);
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully inserted item in Stock'};
        } catch(e) {
            console.log(e);
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

    Stock.updateApiHandler = async (data) => {
        // productCodeNo
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);

            // CHECK FOR USER ACTIVE STATUS
            let isActiveUser = await utils.getAppStatus(params._userId);
            if(!isActiveUser)
                throw 'User is Not Active';

            params._stockTableName = Stock._getStockTableName(params._userId);

            let obj =  await Stock.app.models.JewellryOrnament.handleOrnData(params, {updateAPI: true});
            params.ornamentId = obj.id;
            params.productCodeTableId = obj.productCodeTableId;
            params.productCodeSeries = obj.productCodeSeries;
            params.productCodeNumber = obj.productCodeNumber;

            if(!params.touchId)
                params.touchId = await Stock.app.models.Touch.getId(params.productPureTouch);
            if(!params.supplierId)
                params.supplierId = await Stock.app.models.Supplier.getId(params.dealerStoreName);
            params.soldQty = 0;
            params.avlQty = params.productQty;
            await Stock._update(params);
            if(obj.isNewSerialNo)
                await Stock.app.models.ProductCode.incrementSerialNumber(params.productCodeTableId);
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully updated item in Stock'};
        } catch(e) {
            console.log(e);
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock._update = (params) => {
        return new Promise((resolve, reject) => {
            params._tableName = Stock._getStockTableName();
            let query = Stock._constructQuery('update', params);
            Stock.dataSource.connector.query(query, (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        });
    }

    Stock.fetchTotals = async (accessToken, filters) => {
        try {
            let params = { filters };
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let obj = await Stock._fetchTotals(params);
            return {STATUS: 'SUCCESS', TOTALS: obj};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock._fetchTotals = async (params) => {
        try {
            let returnVal = {count: 0, netWt: 0, soldNetWt: 0, avlNetWt: 0};
            let sql = SQL.FETCH_COUNT;
                sql += Stock._getFilterQueryPart(params, true);
                sql = sql.replace(/STOCK_TABLE/g, `stock_${params._userId}`);
            let result = await utils.executeSqlQuery(Stock.dataSource, sql);
            if(result && result.length>0) {
                let rs = result[0];
                returnVal.count = rs.Count;
                returnVal.netWt = rs.NetWt;
                returnVal.soldNetWt = rs.SoldNetWt;
                returnVal.avlNetWt = rs.AvlNetWt;
            }
            return returnVal;
        } catch(e) {
            console.log(e);
            logger.error(GsErrorCtrl.create({className: 'Stock', methodName: '_fetchTotals', cause: e, message: 'Exception in sql query execution'}));
            throw e;
        }
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
                            uid,
                            date, user_id, ornament,
                            pr_code, pr_number, huid,
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
                            sold_qty, avl_qty,
                            avl_g_wt, avl_n_wt, avl_p_wt,
                            sold_g_wt, sold_n_wt, sold_p_wt
                        ) VALUES (
                            "${params._uid}",
                            "${params.date}", ${params._userId}, ${params.ornamentId},
                            "${params.productCodeSeries}", ${params.productCodeNumber}, "${params.productHUID}",
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
                            ${params.soldQty}, ${params.avlQty},
                            ${params.productGWt}, ${params.productNWt}, ${params.productPWt},
                            0, 0, 0
                        )`;
                break;
            case 'update':
                sql += `UPDATE 
                            ${params._stockTableName} 
                        SET 
                            date="${params.date}",
                            ornament=${params.ornamentId},
                            pr_code="${params.productCodeSeries}",
                            pr_number="${params.productCodeNumber}",
                            huid="${params.productHUID}",
                            prod_id="${params.productCodeSeries}${params.productCodeNumber}",
                            touch_id=${params.touchId},
                            i_touch=${params.productITouch},
                            quantity=${params.productQty}, 
                            gross_wt=${params.productGWt},
                            net_wt=${params.productNWt},
                            pure_wt=${params.productPWt},
                            labour_charge=${params.productLabourCharges},
                            labour_charge_unit="${params.productLabourCalcUnit}",
                            calc_labour_amt=${params.productCalcLabourAmt},
                            metal_rate=${params.metalPrice},
                            amount=${params.calcAmtWithLabour},
                            cgst_percent=${params.productCgstPercent || 0},
                            cgst_amt=${params.productCgstAmt || 0},
                            sgst_percent=${params.productSgstPercent || 0},
                            sgst_amt=${params.productSgstAmt || 0},
                            igst_percent=${params.productIgstPercent || 0},
                            igst_amt=${params.productIgstAmt || 0},
                            total=${params.productTotalAmt},
                            supplierId=${params.supplierId},
                            personName="${params.dealerPersonName}",
                            sold_qty=${params.soldQty},
                            avl_qty=${params.avlQty},
                            avl_g_wt=${params.productGWt},
                            avl_n_wt=${params.productNWt},
                            avl_p_wt=${params.productPWt}
                        WHERE
                            uid="${params._uid}"
                        `;
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

    Stock.fetchItemsByProdIds = async (accessToken, prodIds) => {
        try {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let itemArr = await Stock._fetchItemsByProdIds(prodIds, _userId);
            return {STATUS: 'SUCCESS', ITEMS: itemArr};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock._fetchItemsByProdIds = (prodIdArr, _userId) => {
        return new Promise((resolve, reject) => {
            let sql = SQL.FETCH_ITEM_BY_PRODID.replace(/STOCK_TABLE/g, `stock_${_userId}`);
            Stock.dataSource.connector.query(sql, [prodIdArr], (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        });
    }

    Stock.sellItemApiHandler = async (data) => {
        try {
            console.log(data);
            data._userId = await utils.getStoreOwnerUserId(data.accessToken);
            data._uniqString = (Date.now() + Math.random()).toString(36).replace('.', '');
            let isAvl = await Stock.checkItemAvlQty(data.apiParams.newProds);
            if(!isAvl)
                throw new Error('Please check item quantity. Item might have been already sold. Please check "Sold Out Items" stock list');
            // let invoiceDetailResp = await Stock.insertInvoiceData(data);
            let invoiceDetailResp = await Stock.app.models.JewelleryInvoice.prototype.insertInvoiceData(data);
            if(!invoiceDetailResp)
                throw new Error('Invoice creation failed. Please check Logs.');
            
            await Stock.insertInSellingDetail(data);
            await Stock.updateQtyInStockTable(data);
            
            if(data.apiParams.oldOrnaments && data.apiParams.oldOrnaments.netWt)
                await Stock.insertIntoOldOrnamentsTable(data);
            
            let newNumber = parseInt(data.apiParams.invoiceNo) + 1;
            await Stock.app.models.JewelleryBillSetting.prototype.incrementSerialAndNumber(data._userId, newNumber, 'gst');

            return {STATUS: 'SUCCESS'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock.checkItemAvlQty = async (items) => {
        try {
            let flag = true;
            let groupObj = {};

            //grouping by prod_id
            _.each(items, (anItem, index) => {
                groupObj[anItem.prodId] = groupObj[anItem.prodId] || 0;
                groupObj[anItem.prodId]++;
            });

            //check in Database
            let sql = `SELECT * FROM stock_1 WHERE `;
            let bucket = [];
            _.each(groupObj, (val, index) => {
                bucket.push(`(prod_id='${index}' AND avl_qty>=${val})`);
            });
            sql += bucket.join(' OR ');
            let result = await utils.executeSqlQuery(Stock.dataSource, sql);
            if(result.length !== Object.keys(groupObj).length)
                flag = false;
            return flag;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    Stock.insertInvoiceData = async (payload) => {
        try {
            let invoiceNoFull = payload.apiParams.invoiceNo;
            if(payload.apiParams.invoiceSeries)
                invoiceNoFull = `${payload.apiParams.invoiceSeries}.${payload.apiParams.invoiceNo}`;
            let sql = SQL.INSERT_INVOICE_DETAIL.replace(/INVOICE_TABLE/g, `invoice_details_${payload._userId}`);
            let queryVal = [
                    payload._uniqString,
                    invoiceNoFull,
                    payload.apiParams.customerId,
                    'SOLD',
                    payload.apiParams.paymentFormData.paid,
                    payload.apiParams.paymentFormData.balance,
                    payload.apiParams.paymentFormData.paymentMode,
                    JSON.stringify(payload.apiParams.paymentFormData),
                    JSON.stringify(payload.apiParams)
                ];
            let result = await utils.executeSqlQuery(Stock.dataSource, sql, queryVal);
            return result;
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'Stock', methodName: 'insertInvoiceData', cause: e, message: 'Exception in sql query execution'}));
            console.log(e);
            throw e;
        }
    }

    Stock.insertInSellingDetail = async (payload) => {
        try {
            let sql = SQL.INSERT_INTO_STOCK_SOLD.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${payload._userId}`);
            let bucket = [];
            _.each(payload.apiParams.newProds, (anItem, index) => {
                let temp = [];
                temp.push(`"${payload.apiParams.date}"`);
                temp.push(`"${anItem.prodId}"`);
                temp.push(payload.apiParams.metalRate);
                temp.push(payload.apiParams.retailRate);
                temp.push(anItem.ornamentId);
                temp.push(anItem.qty);
                temp.push(anItem.grossWt || 0);
                temp.push(anItem.netWt || 0);
                temp.push(anItem.pureWt || 0);
                temp.push(anItem.wastagePercent || 0);
                temp.push(anItem.wastageVal || 0);
                temp.push(anItem.makingCharge || 0);
                temp.push(anItem.cgstPercent || 0);
                temp.push(anItem.sgstPercent || 0);
                temp.push(anItem.discount || 0);
                temp.push(anItem.price || 0);
                temp.push(`"${payload._uniqString}"`);
                bucket.push(`(${temp.join(',')})`);
            });
            sql += bucket.join(' , ');
            console.log('INSERT IN STOCK');
            console.log(sql);
            let result = await utils.executeSqlQuery(Stock.dataSource, sql);
            return true;
        } catch(e) {
            console.log(e);
            logger.error(GsErrorCtrl.create({className: 'Stock', methodName: 'insertInSellingDetail', cause: e, message: 'Exception in sql query execution'}));
            throw e;
        }
    }

    Stock.updateQtyInStockTable = async (payload) => {
        try {
            let newProds = payload.apiParams.newProds;
            for(let i=0; i<newProds.length; i++) {
                let anItem = newProds[i];
                let sql = `UPDATE stock_${payload._userId} SET 
                            sold_qty=sold_qty+${anItem.qty}, 
                            sold_g_wt=sold_g_wt+${parseFloat(anItem.grossWt)},
                            sold_n_wt=sold_n_wt+${parseFloat(anItem.netWt)},
                            sold_p_wt=sold_p_wt+${parseFloat(anItem.pureWt)},
                            avl_qty=avl_qty-${anItem.qty}, 
                            avl_g_wt=avl_g_wt-${parseFloat(anItem.grossWt)},
                            avl_n_wt=avl_n_wt-${parseFloat(anItem.netWt)},
                            avl_p_wt=avl_p_wt-${parseFloat(anItem.pureWt)},
                            invoice_ref="${payload._uniqString}" 
                        WHERE 
                            prod_id="${anItem.prodId}"`;
                console.log('Updating the avl + sold details in stock table');
                console.log(sql);
                let result = await utils.executeSqlQuery(Stock.dataSource, sql);
            }
            return true;
        } catch(e) {
            console.log(e);
            logger.error(GsErrorCtrl.create({className: 'Stock', methodName: 'updateQtyInStockTable', cause: e, message: 'Exception in sql query execution'}));
            throw e;
        }
    }

    Stock.insertIntoOldOrnamentsTable = async (data) => {
        try {
            let sql = SQL.INSERT_INTO_OLD_ITEM_STOCK;
            sql = sql.replace(/OLD_ITEMS_STOCK_TABLE/g, `old_items_stock_${data._userId}`);
            let oldOrnaments = data.apiParams.oldOrnaments;
            let queryParams = [oldOrnaments.itemType, oldOrnaments.grossWt, oldOrnaments.netWt, oldOrnaments.wastageVal, oldOrnaments.pricePerGram, oldOrnaments.netAmount, data._uniqString];
            await utils.executeSqlQuery(Stock.dataSource, sql, queryParams);
        } catch(e) {
            console.log(e);
            logger.error(GsErrorCtrl.create({className: 'Stock', methodName: 'insertIntoOldOrnamentsTable', cause: e, message: 'Exception in sql query execution'}));
            throw e;
        }
    }

    Stock.fetchSoldOutItemList = async (accessToken, filters) => {
        try {
            let params = {accessToken: accessToken, filters: filters};
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let list = await Stock._fetchSoldOutItemList(params)
            return {STATUS: 'SUCCESS', LIST: list};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }
    Stock._fetchSoldOutItemList = async (params) => {
        try {
            let sql = SQL.FETCH_SOLD_OUT_ITEMS_LIST;
            sql += Stock._getFilterQueryPartForSoldOutItems(params);
            sql = sql.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${params._userId}`);
            sql = sql.replace(/INVOICE_DETAIL_TABLE/g, `jewellery_invoice_details_${params._userId}`);
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            let res = await utils.executeSqlQuery(Stock.dataSource, sql);
            //TODO:
            return res;
        } catch(e) {
            console.log(e);
            logger.error(GsErrorCtrl.create({className: 'Stock', methodName: '_fetchSoldOutItemList', cause: e, message: 'Exception in sql query execution'}));
            throw e;
        }
    }
    
    Stock._getFilterQueryPartForSoldOutItems = (params, requireOnlyTotals=false) => {
        let sql = '';
        let filterList = [];
        if(params.filters && params.filters) {
            if(!params.filters.include_archived)
                filterList.push(`(STOCK_SOLD_TABLE.archived=0)`);
            if(params.filters.date)
                filterList.push(`(STOCK_SOLD_TABLE.date BETWEEN '${params.filters.date.startDate}' AND '${params.filters.date.endDate}')`);
        }
        if(filterList.length)
            sql = ` WHERE ${filterList.join(' AND ')}`;

        sql += ' ORDER BY STOCK_SOLD_TABLE.created_date DESC';
        
        if(!requireOnlyTotals && params.filters) {
            let limit = (params.filters.offsetEnd - params.filters.offsetStart);
            sql += ` LIMIT ${limit} OFFSET ${params.filters.offsetStart}`;
        }
        return sql;
    }

    Stock.fetchSoldOutItemTotals = async (accessToken, filters) => {
        try {
            let params = {accessToken: accessToken, filters: filters};
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.FETCH_SOLD_OUT_ITEMS_COUNT;
            sql += Stock._getFilterQueryPartForSoldOutItems(params, true);
            sql = sql.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${params._userId}`);
            sql = sql.replace(/INVOICE_DETAIL_TABLE/g, `jewellery_invoice_details_${params._userId}`);
            sql = sql.replace(/REPLACE_USERID/g, params._userId);
            let res = await utils.executeSqlQuery(Stock.dataSource, sql);
            let count = 0;
            if(res && res.length>0)
                count = res[0].Count;
            return {STATUS: 'SUCCESS', COUNT: count};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Stock._fetchSoldItemsByInvoiceId = async (userId, invoiceId) => {
        try {
            let sql = SQL.FETCH_SOLD_ITEMS_BY_INVOICE_ID;
            sql = sql.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${userId}`);
            let res = await utils.executeSqlQuery(Stock.dataSource, sql, [invoiceId]);
            return res;
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    // When invoice gets deleted, then add the qty and weight back for the specific item in table
    Stock._putBackFromInvoice = async (userId, itemDetail) => {
        try {
            let queryParams = [
                itemDetail.qty,
                itemDetail.grossWt,
                itemDetail.netWt,
                itemDetail.pureWt,
                itemDetail.qty,
                itemDetail.grossWt,
                itemDetail.netWt,
                itemDetail.pureWt,
                new Date().toISOString().replace('T',' ').replace('Z', ''),
                itemDetail.prodId
            ]
            let sql = SQL.UPDATE_STOCK_ITEM_QTY;
            sql = sql.replace(/STOCK_TABLE/g, `stock_${userId}`);
            let res = await utils.executeSqlQuery(Stock.dataSource, sql, queryParams);
            return res;
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    Stock._archiveSoldItemByInvoiceRef = async (userId, invoiceRef) => {
        try {
            let sql = SQL.MARK_ARCHIVED_SOLD_STOCK_TABLE_ITEM;
            sql = sql.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${userId}`);
            await utils.executeSqlQuery(Stock.dataSource, sql, [invoiceRef]);
            return true;
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    Stock._archiveOldOrnamentRecByInvoiceRef = async (userId, invoiceRef) => {
        try {
            let sql = SQL.MARK_ARCHIVED_OLD_ORN_TABLE_ITEM;
            sql = sql.replace(/OLD_ITEMS_STOCK_TABLE/g, `old_items_stock_${userId}`);
            await utils.executeSqlQuery(Stock.dataSource, sql, [invoiceRef]);
            return true;
        } catch(e) {
            console.log(e);
            return null;
        }
    }
};

let SQL = {
    FETCH_COUNT: `SELECT
                    COUNT(*) AS Count,
                    SUM(net_wt) AS NetWt,
                    SUM(sold_n_wt) AS SoldNetWt,
                    SUM(avl_n_wt) AS AvlNetWt
                FROM STOCK_TABLE
                    LEFT JOIN orn_list_jewellery ON STOCK_TABLE.ornament = orn_list_jewellery.id
                    LEFT JOIN suppliers ON STOCK_TABLE.supplierId = suppliers.id
                    LEFT JOIN touch ON STOCK_TABLE.touch_id = touch.id`,
    FETCH_LIST: `SELECT
                    STOCK_TABLE.id AS Id,
                    STOCK_TABLE.uid AS UID,
                    orn_list_jewellery.metal AS Metal,
                    orn_list_jewellery.item_name AS ItemName,
                    orn_list_jewellery.item_category AS ItemCategory,
                    orn_list_jewellery.item_subcategory AS ItemSubCategory,
                    orn_list_jewellery.dimension AS Dimension,
                    STOCK_TABLE.pr_code AS ItemCode,
                    STOCK_TABLE.pr_number AS ItemCodeNumber,
                    STOCK_TABLE.huid AS ItemHUID,
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
                    STOCK_TABLE.labour_charge AS LabourCharge,
                    STOCK_TABLE.labour_charge_unit AS LabourChargeUnit,
                    STOCK_TABLE.calc_labour_amt AS LabourAmtCalc,
                    STOCK_TABLE.total AS Total,
                    STOCK_TABLE.sold_qty AS SoldQty,
                    STOCK_TABLE.sold_g_wt AS SoldGWt,
                    STOCK_TABLE.sold_n_wt AS SoldNWt,
                    STOCK_TABLE.sold_p_wt AS SoldPWt,
                    STOCK_TABLE.avl_qty AS AvlQty,
                    STOCK_TABLE.avl_g_wt AS AvlGWt,
                    STOCK_TABLE.avl_n_wt AS AvlNWt,
                    STOCK_TABLE.avl_p_wt AS AvlPWt,
                    STOCK_TABLE.date AS Date
                FROM
                    STOCK_TABLE
                    LEFT JOIN orn_list_jewellery ON STOCK_TABLE.ornament = orn_list_jewellery.id
                    LEFT JOIN suppliers ON STOCK_TABLE.supplierId = suppliers.id
                    LEFT JOIN touch ON STOCK_TABLE.touch_id = touch.id`,
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
                                huid,
                                i_touch,
                                touch.purity AS pure_touch,
                                touch.name AS touch_name,
                                quantity, avl_qty, sold_qty,
                                gross_wt, net_wt, pure_wt,
                                avl_g_wt, avl_n_wt, avl_p_wt,
                                sold_g_wt, sold_n_wt, sold_p_wt,
                                labour_charge, labour_charge_unit, calc_labour_amt,
                                metal_rate, amount,
                                cgst_percent, cgst_amt, sgst_amt, sgst_percent,
                                total,
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
                            WHERE prod_id IN (?)`,
    INSERT_INTO_STOCK_SOLD: `INSERT INTO STOCK_SOLD_TABLE (
                                date, prod_id, metal_rate, retail_rate, ornament, qty, 
                                gross_wt, net_wt, pure_wt,
                                wastage, wastage_val, labour,
                                cgst_percent, sgst_percent, discount, total,
                                invoice_ref
                            ) 
                            VALUES `,
    INSERT_INTO_OLD_ITEM_STOCK: `INSERT INTO OLD_ITEMS_STOCK_TABLE (item_type, gross_wt, net_wt, wastage_val, applied_retail_rate, price, invoice_ref)
                            VALUES(?,?,?,?,?,?,?)`,
    INSERT_INVOICE_DETAIL: `INSERT INTO INVOICE_TABLE (ukey, invoice_no, cust_id, action, paid_amt, balance_amt, payment_mode, raw_payment_data, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    FETCH_SOLD_OUT_ITEMS_COUNT: `SELECT
                                    COUNT(*) AS Count
                                FROM
                                STOCK_SOLD_TABLE
                                LEFT JOIN INVOICE_DETAIL_TABLE ON STOCK_SOLD_TABLE.invoice_ref = INVOICE_DETAIL_TABLE.ukey
                                LEFT JOIN customer_REPLACE_USERID ON INVOICE_DETAIL_TABLE.cust_id = customer_REPLACE_USERID.CustomerId`,
    FETCH_SOLD_OUT_ITEMS_LIST: `SELECT
                            customer_REPLACE_USERID.CustomerId AS CustomerId,
                            date AS InvoicingDate,
                            customer_REPLACE_USERID.Name AS CustomerName,
                            customer_REPLACE_USERID.GaurdianName AS GaurdianName,
                            customer_REPLACE_USERID.Address AS Address,
                            customer_REPLACE_USERID.City AS City,
                            customer_REPLACE_USERID.Mobile AS Mobile,
                            customer_REPLACE_USERID.SecMobile AS SecMobile,
                            prod_id AS ProdId,
                            metal_rate AS MetalRate,
                            retail_rate AS RetailRate,
                            orn_list_jewellery.metal as metal,
                            orn_list_jewellery.item_name as item_name,
                            orn_list_jewellery.item_category as item_category,
                            orn_list_jewellery.item_subcategory as item_subcategory,
                            orn_list_jewellery.dimension as dimension,
                            qty AS Qty,
                            gross_wt,
                            net_wt,
                            wastage,
                            labour,
                            cgst_percent,
                            sgst_percent,
                            discount,
                            total,
                            STOCK_SOLD_TABLE.created_date AS created_date,
                            INVOICE_DETAIL_TABLE.payment_mode AS PaymentMode,
                            INVOICE_DETAIL_TABLE.paid_amt AS PaidAmt,
                            INVOICE_DETAIL_TABLE.balance_amt AS BalAmt,
                            INVOICE_DETAIL_TABLE.ukey AS InvoiceRef,
                            INVOICE_DETAIL_TABLE.invoice_no AS InvoiceNo
                        FROM
                            STOCK_SOLD_TABLE
                            LEFT JOIN INVOICE_DETAIL_TABLE ON STOCK_SOLD_TABLE.invoice_ref = INVOICE_DETAIL_TABLE.ukey
                            LEFT JOIN customer_REPLACE_USERID ON INVOICE_DETAIL_TABLE.cust_id = customer_REPLACE_USERID.CustomerId
                            LEFT JOIN orn_list_jewellery ON STOCK_SOLD_TABLE.ornament = orn_list_jewellery.id`,
    FETCH_SOLD_ITEMS_BY_INVOICE_ID: `SELECT * FROM STOCK_SOLD_TABLE WHERE invoice_ref=?`,
    UPDATE_STOCK_ITEM_QTY: `UPDATE STOCK_TABLE SET sold_qty=sold_qty-?,
                                        sold_n_wt=sold_n_wt-?,
                                        sold_g_wt=sold_g_wt-?,
                                        sold_p_wt=sold_p_wt-?,
                                        avl_qty=avl_qty+?,
                                        avl_n_wt=avl_n_wt+?,
                                        avl_g_wt=avl_g_wt+?,
                                        avl_p_wt=avl_p_wt+?,
                                        modified_date=?
                                    WHERE prod_id=?`,
    MARK_ARCHIVED_SOLD_STOCK_TABLE_ITEM: `UPDATE STOCK_SOLD_TABLE SET archived=1 where invoice_ref=?`,
    MARK_ARCHIVED_OLD_ORN_TABLE_ITEM: `UPDATE OLD_ITEMS_STOCK_TABLE SET archived=1 where invoice_ref=?`
}