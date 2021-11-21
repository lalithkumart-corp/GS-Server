'use strict';
let app = require('../server');
let utils = require('../utils/commonUtils');
let _ = require('lodash');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');

module.exports = function(JwlInvoice) {
    JwlInvoice.prototype.insertInvoiceData = async (payload) => {
        try {
            let invoiceNoFull = payload.apiParams.invoiceNo;
            if(payload.apiParams.invoiceSeries)
                invoiceNoFull = `${payload.apiParams.invoiceSeries}.${payload.apiParams.invoiceNo}`;
            let sql = SQL.INSERT_INVOICE_DETAIL.replace(/INVOICE_TABLE/g, `jewellery_invoice_details_${payload._userId}`);
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
            let result = await utils.executeSqlQuery(JwlInvoice.dataSource, sql, queryVal);
            return result;
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'JwlInvoice', methodName: 'insertInvoiceData', cause: e, message: 'Exception in sql query execution'}));
            console.log(e);
            throw e;
        }
    }
}

let SQL = {
    INSERT_INVOICE_DETAIL: `INSERT INTO INVOICE_TABLE (ukey, invoice_no, cust_id, action, paid_amt, balance_amt, payment_mode, raw_payment_data, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
}