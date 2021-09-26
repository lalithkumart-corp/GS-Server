'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
let dateformat = require('dateformat');

module.exports = function(Udhaar) {
    Udhaar.remoteMethod('createApi', {
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
                source: 'body'
            }
        },
        http: {path: '/create-udhaar', verb: 'post'},
        description: 'Udhaar - Creation.',
    });

    Udhaar.createApi = (apiParams, cb) => {
        Udhaar._createApi(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }
    Udhaar._createApi = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            apiParams._userId = await  utils.getStoreOwnerUserId(apiParams.accessToken);
            let sql = SQL.CREATE_UDHAAR.replace(/REPLACE_USERID/g, apiParams._userId);
            apiParams._uniqId = (+ new Date());
            let queryValues = [apiParams._uniqId, apiParams.billNo, apiParams.amount, dateformat(apiParams.udhaarCreationDate, 'yyyy-mm-dd HH:MM:ss', true), apiParams.accountId, apiParams.customerId, apiParams.notes];
            Udhaar.dataSource.connector.query(sql, queryValues, (err, res) => {
                if(err){
                    reject(err);
                } else {
                    await Udhaar.app.models.UdhaarSettings.updateNextBillNumber(apiParams._userId, apiParams.billNo);
                    Udhaar.app.models.FundTransaction.prototype.add(apiParams, 'udhaar');
                    resolve(true);
                }
            });
        });
    }
}

let SQL = {
    CREATE_UDHAAR: `INSERT INTO udhaar_REPLACE_USERID (unique_identifier, bill_no, amount, date, account_id, customer_id, notes)
                        VALUES(?,?,?,?,?,?,?)`
};
