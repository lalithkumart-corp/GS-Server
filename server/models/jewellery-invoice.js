'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
let JewelleryInvoiceHelper = require('./modelHelpers/jewelleryInvoice');

module.exports = function(JwlInvoice) {
    JwlInvoice.remoteMethod('getInvoiceDataByKey', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'invoiceKeys', type: 'array', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let invoiceKeysArrStr = req && req.query.invoice_keys;
                    let invoiceKeyArr = [];
                    if(invoiceKeysArrStr) invoiceKeyArr = JSON.parse(invoiceKeysArrStr);
                    return invoiceKeyArr;
                },
                description: 'Arguments goes here',
            }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/get-invoice-data', verb: 'get'},
        description: 'Jewellery Bill Invoice Date.',
    });

    JwlInvoice.remoteMethod('getInvoiceRecordByKey', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let authToken = null;
                    if(req && req.headers.authorization)
                        authToken = req.headers.authorization || req.headers.Authorization;
                    return authToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'invoiceKeys', type: 'array', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let invoiceKeysArrStr = req && req.query.invoice_keys;
                    let invoiceKeyArr = [];
                    if(invoiceKeysArrStr) invoiceKeyArr = JSON.parse(invoiceKeysArrStr);
                    return invoiceKeyArr;
                },
                description: 'Arguments goes here',
            }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/get-invoice-record', verb: 'get'},
        description: 'Jewellery Bill Invoice Record.',
    });

    JwlInvoice.remoteMethod('getCustomerInvoiceListApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
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
                source: 'body'
            }
        },
        http: {path: '/fetch-jewellery-cust-invoices-list', verb: 'get'},
        description: 'Jewellery - Customer Invoice List.',
    });

    JwlInvoice.remoteMethod('getCustomerInvoiceListCountApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
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
                source: 'body'
            }
        },
        http: {path: '/fetch-jewellery-cust-invoices-list-count', verb: 'get'},
        description: 'Jewellery - Customer Invoice List count',
    });

    JwlInvoice.remoteMethod('deleteInvoice', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let authToken = null;
                    if(req && req.headers.authorization)
                        authToken = req.headers.authorization || req.headers.Authorization;
                    return authToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'params',
                type: 'object',
                default: {
                    
                },
                http: {
                    source: 'body',
                },
        }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/delete', verb: 'del'},
        description: 'Delete an Invoice'
    });

    JwlInvoice.prototype.insertInvoiceData = async (payload) => {
        try {
            let invoiceNoFull = payload.apiParams.invoiceNo;
            if(payload.apiParams.invoiceSeries)
                invoiceNoFull = `${payload.apiParams.invoiceSeries}.${payload.apiParams.invoiceNo}`;
            let apiData = JSON.parse(JSON.stringify(payload.apiParams));
            if(apiData.invoiceData)
                apiData.invoiceData = 'Look into invoice_data column';
            let sql = SQL.INSERT_INVOICE_DETAIL.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${payload._userId}`);
            let queryVal = [
                    payload.apiParams.date,
                    payload._uniqString,
                    invoiceNoFull,
                    payload.apiParams.customerId,
                    'SOLD',
                    payload.apiParams.paymentFormData.paid,
                    payload.apiParams.paymentFormData.balance,
                    JSON.stringify(apiData),
                    JSON.stringify(payload.apiParams.invoiceData)
                ];
            let result = await utils.executeSqlQuery(JwlInvoice.dataSource, sql, queryVal);
            return result;
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'JwlInvoice', methodName: 'insertInvoiceData', cause: e, message: 'Exception in sql query execution'}));
            console.log(e);
            throw e;
        }
    }

    //for pdf bill content
    JwlInvoice.getInvoiceDataByKey = (accessToken, invoiceKeys, cb) => {
        JwlInvoice._getInvoiceDataByKey(accessToken, invoiceKeys).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    JwlInvoice._getInvoiceDataByKey = async (accessToken, invoiceKeys) => {
        try {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.INVOICE_DATA.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${_userId}`);
            let result = await utils.executeSqlQuery(JwlInvoice.dataSource, sql, [invoiceKeys]);
            if(result && result.length > 0) {
                return result.map((aDbRow) => JSON.parse(aDbRow.invoice_data));
                // return result[0].invoice_data;
            }
            else
                return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    // for customer invoice page in UI
    JwlInvoice.getInvoiceRecordByKey = (accessToken, invoiceKeys, cb) => {
        JwlInvoice._getInvoiceRecordByKey(accessToken, invoiceKeys).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    JwlInvoice._getInvoiceRecordByKey = async (accessToken, invoiceKeys) => {
        try {
            let _userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.INVOICE_RECORD.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${_userId}`);
            let result = await utils.executeSqlQuery(JwlInvoice.dataSource, sql, [invoiceKeys]);
            if(result && result.length > 0) {
                // return result.map((aDbRow) => JSON.parse(aDbRow.raw_data));
                return result;
            }
            else
                return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    JwlInvoice.getCustomerInvoiceListApi = async (accessToken, filters) => {
        try {
            let params = { filters };
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let list = await JwlInvoice._fetchJwlCustInvoiceList(params);
            return {STATUS: 'SUCCESS', CUST_INV_LIST: list};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    JwlInvoice._fetchJwlCustInvoiceList = (params) => {
        return new Promise( (resolve, reject) => {
            let sql = SQL.INVOICE_LIST;
            sql = JwlInvoice._injectFilterQuerypart(sql, params, 'list');
            // sql = sql.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${params._userId}`);
            // sql = sql.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${params._userId}`);
            sql = sql.replace(/REPLACE_USERID/g,  params._userId);
            JwlInvoice.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(new JewelleryInvoiceHelper().dbRespToApiRespKeyMapper(res, 'invoice_list'));
                }
            });
        });
    }

    JwlInvoice.getCustomerInvoiceListCountApi = async (accessToken, filters) => {
        try {
            let params = { filters };
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let cnt = await JwlInvoice._fetchJwlCustInvoiceListCount(params);
            return {STATUS: 'SUCCESS', CUST_INV_LIST_COUNT: cnt};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    JwlInvoice._fetchJwlCustInvoiceListCount = (params) => {
        return new Promise( (resolve, reject) => {
            let sql = SQL.INVOICE_LIST_TOTALS;
            params.filters.fetchTotalCount = true;
            sql = JwlInvoice._injectFilterQuerypart(sql, params, 'count');
            // sql = sql.replace(/STOCK_SOLD_TABLE/g, `stock_sold_${params._userId}`);
            // sql = sql.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${params._userId}`);
            sql = sql.replace(/REPLACE_USERID/g,  params._userId);
            JwlInvoice.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res[0].totalInvoiceList);
                }
            });
        });
    }

    JwlInvoice._injectFilterQuerypart = (sql, params) => {
        let whereClause = '';
        let {filters} = params;
        let whereConditionList = [];
        if(!filters.include_archived)
            whereConditionList.push('i.archived=0');
        if(filters.date && filters.date.startDate)
            whereConditionList.push(`i.invoice_date BETWEEN "${filters.date.startDate}" AND "${filters.date.endDate}"`);
        if(filters.invoiceNo)
            whereConditionList.push(`i.invoice_no LIKE "${filters.invoiceNo}%"`);
        if(filters.custName)
            whereConditionList.push(`c.Name LIKE "${filters.custName}%"`);
        if(filters.custGarudianName)
            whereConditionList.push(`c.GaurdianName LIKE "${filters.custGarudianName}%"`);
        if(filters.custAddr)
            whereConditionList.push(`c.Address LIKE "${filters.custAddr}%"`);
        
        if(filters.prodId)
            whereConditionList.push(`s.prod_id LIKE "${filters.prodId.toUpperCase()}%"`);

        if(filters.huid) 
            whereConditionList.push(`s.huid LIKE "${filters.huid.toUpperCase()}%"`);

        if(whereConditionList.length > 0)
            whereClause = ` WHERE ${whereConditionList.join(' AND ')}`
        
        sql = sql.replace(/WHERE_CLAUSE/g, whereClause);
        
        if(!filters.fetchTotalCount) {
            sql += ' ORDER BY i.invoice_date DESC';   
            sql += ` LIMIT ${filters.offsetEnd-filters.offsetStart} OFFSET ${filters.offsetStart}`;
        }

        return sql;
    }
    
    JwlInvoice.deleteInvoice = async (accessToken, params) => {
        try {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let invoiceRef = params.invoiceRef;
            let soldItemDetails = await JwlInvoice.app.models.Stock._fetchSoldItemsByInvoiceId(userId, invoiceRef);
            if(soldItemDetails && soldItemDetails.length>0) {
                for(let i=0; i<soldItemDetails.length; i++) {
                    let anItem = soldItemDetails[i];
                    let itemDetail = {
                        prodId: anItem.prod_id,
                        qty: anItem.qty,
                        grossWt: anItem.gross_wt,
                        netWt: anItem.net_wt,
                        pureWt: anItem.pure_wt
                    }
                   await JwlInvoice.app.models.Stock._putBackFromInvoice(userId, itemDetail);
                }
                await JwlInvoice.app.models.Stock._archiveSoldItemByInvoiceRef(userId, invoiceRef);
                await JwlInvoice.app.models.Stock._archiveOldOrnamentRecByInvoiceRef(userId, invoiceRef);
                await JwlInvoice._archiveByInvoiceRef(userId, invoiceRef);
            } else {
                throw new Error("Items not found in DB to update back the qty and weight");
            }
            return { STATUS: 'SUCCESS', MSG: 'Archived the invoice and updated QTY and WT of specific item in stock table.'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    JwlInvoice._archiveByInvoiceRef = async (userId, invoiceRef) => {
        try {
            let sql = SQL.MARK_ARCHIVED;
            sql = sql.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${userId}`);
            await utils.executeSqlQuery(JwlInvoice.dataSource, sql, [invoiceRef]);
            return true;
        } catch(e) {
            console.log(e);
            return null;
        }
    }
}

let SQL = {
    INSERT_INVOICE_DETAIL: `INSERT INTO INVOICE_TABLE (invoice_date, ukey, invoice_no, cust_id, action, paid_amt, balance_amt, raw_data, invoice_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    INVOICE_DATA: `SELECT invoice_data FROM INVOICE_TABLE WHERE ukey IN (?)`, // for pdf invoice
    INVOICE_RECORD: `SELECT * FROM INVOICE_TABLE WHERE ukey IN (?)`,
    INVOICE_LIST_OLD: `SELECT i.*, c.*,
                    (select group_concat(prod_id) as prdId from STOCK_SOLD_TABLE as s where s.invoice_ref=i.ukey group by s.invoice_ref) as prod_ids
                        FROM INVOICE_TABLE as i
                    LEFT JOIN customer_REPLACE_USERID as c ON i.cust_id = c.CustomerId`,
    INVOICE_LIST: `select 
                        i.invoice_date,
                        i.ukey,
                        i.invoice_no,
                        i.cust_id,
                        i.paid_amt,
                        i.balance_amt,
                        i.payment_mode,
                        i.created_date,
                        i.modified_date,
                        c.Name,
                        c.GaurdianName,
                        c.Address,
                        c.Mobile,
                        GROUP_CONCAT(s.prod_id) as prod_ids,
                        GROUP_CONCAT(s.huid) as huids
                    from
                        jewellery_invoice_details_REPLACE_USERID AS i
                            LEFT JOIN
                        customer_REPLACE_USERID AS c ON i.cust_id = c.CustomerId
                            LEFT JOIN
                        stock_sold_REPLACE_USERID AS s ON s.invoice_ref = i.ukey
                        WHERE_CLAUSE
                        GROUP BY i.invoice_date, i.ukey, i.invoice_no, i.cust_id, i.paid_amt, i.balance_amt, i.payment_mode, i.created_date, i.modified_date, c.Name, c.GaurdianName, c.Address, c.Mobile`,
    INVOICE_LIST_TOTALS_OLD: `SELECT count(*) as totalInvoiceList
                    from 
                        INVOICE_TABLE as i 
                        LEFT JOIN customer_REPLACE_USERID as c ON i.cust_id = c.CustomerId`,
    INVOICE_LIST_TOTALS: `select count(*) as totalInvoiceList from (select 
                        i.invoice_date,
                        i.ukey,
                        i.invoice_no,
                        i.cust_id,
                        i.paid_amt,
                        i.balance_amt,
                        i.payment_mode,
                        i.created_date,
                        i.modified_date,
                        c.Name,
                        c.GaurdianName,
                        c.Address,
                        c.Mobile,
                        GROUP_CONCAT(s.prod_id) as prod_ids,
                        GROUP_CONCAT(s.huid) as huids
                    from
                        jewellery_invoice_details_REPLACE_USERID AS i
                            LEFT JOIN
                        customer_REPLACE_USERID AS c ON i.cust_id = c.CustomerId
                            LEFT JOIN
                        stock_sold_REPLACE_USERID AS s ON s.invoice_ref = i.ukey
                        WHERE_CLAUSE
                        GROUP BY i.invoice_date, i.ukey, i.invoice_no, i.cust_id, i.paid_amt, i.balance_amt, i.payment_mode, i.created_date, i.modified_date, c.Name, c.GaurdianName, c.Address, c.Mobile) A`,
    MARK_ARCHIVED: `UPDATE INVOICE_TABLE SET archived=1 where ukey=?`
}
