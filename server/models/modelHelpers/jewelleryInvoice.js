/* eslint-disable camelcase */
/* eslint-disable indent */
/* eslint-disable strict */
let _ = require('lodash');

class JewelleryInvoiceHelper {
    constructor() {

    }
    dbRespToApiRespKeyMapper(dbResp, identifier) {
        let apiResp = null;
        switch (identifier) {
            case 'invoice_list':
                apiResp = this.invoiceListMapper(dbResp);
                break;
        }
        return apiResp;
    }
    invoiceListMapper(dbResp) {
        let arr  = [];
        _.each(dbResp, (aRow, index) => {
            arr.push({
                invoiceRef: aRow.ukey,
                invoiceNo: aRow.invoice_no,
                custId: aRow.cust_id,
                paidAmt: aRow.paid_amt,
                balanceAmt: aRow.balance_amt,
                paymentMode: aRow.payment_mode,
                createdDate: aRow.created_date,
                modifiedDate: aRow.modified_date,
                prodIds: aRow.prod_ids,
                customerName: aRow.Name,
                customerMobile: aRow.Mobile,
            });
        });
        return arr;
    }
}

module.exports = JewelleryInvoiceHelper;
