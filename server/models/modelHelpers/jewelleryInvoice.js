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
                itemMetalType: aRow.item_metal_type,
                custId: aRow.cust_id,
                paidAmt: aRow.paid_amt,
                balanceAmt: aRow.balance_amt,
                paymentMode: aRow.payment_mode,
                invoiceDate: aRow.invoice_date,
                isReturned: aRow.is_returned,
                returnChargesVal: aRow.return_charges_val,
                createdDate: aRow.created_date,
                modifiedDate: aRow.modified_date,
                prodIds: aRow.prod_ids,
                huids: aRow.huids,
                customerName: aRow.Name,
                customerGaurdianName: aRow.GaurdianName,
                customerMobile: aRow.Mobile,
                customerAddr: aRow.Address,
            });
        });
        return arr;
    }
}

module.exports = JewelleryInvoiceHelper;
