'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');

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
}

let SQL = {
    INSERT_INVOICE_DETAIL: `INSERT INTO INVOICE_TABLE (ukey, invoice_no, cust_id, action, paid_amt, balance_amt, raw_data, invoice_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    INVOICE_DATA: `SELECT invoice_data FROM INVOICE_TABLE WHERE ukey IN (?)`
}