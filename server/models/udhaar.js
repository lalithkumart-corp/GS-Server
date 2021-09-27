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

    Udhaar.remoteMethod('fetchCustomerBillHistoryAPIHandler', {
        accepts: [{
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Accesstoken',
            },
            {
                arg: 'customerId', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let customerId = req && req.query.customer_id;
                    return customerId;
                },
                description: 'customerId',
            },
            {
                arg: 'include_only', type: 'string', http: (ctx) =>  {
                    let req = ctx && ctx.req;
                    let include_only = "all";
                    if(req && req.query && req.query.include_only)
                        include_only = req.query.include_only;
                    return include_only;
                },
                description: "Require only pending or closed or all..."
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            }
        },
        http: {path: '/fetch-customer-history', verb: 'get'},
        description: 'For fetching customer total bill history'
    })

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
            let billNo = apiParams.billNo;
            if(apiParams.billSeries)
                billNo = apiParams.billSeries + '.' + apiParams.billNo;
            let queryValues = [apiParams._uniqId, billNo, apiParams.amount, dateformat(apiParams.udhaarCreationDate, 'yyyy-mm-dd HH:MM:ss', true), apiParams.accountId, apiParams.customerId, apiParams.notes];
            Udhaar.dataSource.connector.query(sql, queryValues, async (err, res) => {
                if(err){
                    reject(err);
                } else {
                    await Udhaar.app.models.UdhaarSettings.updateNextBillNumber(apiParams._userId, (parseInt(apiParams.billNo)+1));
                    Udhaar.app.models.FundTransaction.prototype.add(apiParams, 'udhaar');
                    resolve(true);
                }
            });
        });
    }


    Udhaar.fetchCustomerBillHistoryAPIHandler = async (accessToken, customerId, include_only, cb) => {
        try {
            let billList = await Udhaar.fetchHistory({accessToken: accessToken, customerId: customerId, includeOnly: include_only});
            return {STATUS: 'success', RESPONSE: billList, STATUS_MSG: ''};
        } catch(e) {
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Udhaar.fetchHistory = (params) => {        
        return new Promise( async (resolve, reject) => {
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let sql = SQL.CUSTOMER_BILL_HISTORY.replace(/REPLACE_USERID/g, params._userId);
            if(params.includeOnly == "pending")
                sql +=  ` AND status=1`;
            else if(params.includeOnly == "closed")
                sql += ` AND status=0`;
            console.log(sql);
            Udhaar.dataSource.connector.query(sql, [params.customerId], (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

let SQL = {
    CREATE_UDHAAR: `INSERT INTO udhaar_REPLACE_USERID (unique_identifier, bill_no, amount, date, account_id, customer_id, notes)
                        VALUES(?,?,?,?,?,?,?)`,
    CUSTOMER_BILL_HISTORY: `SELECT                         
                                udhaar_REPLACE_USERID.unique_identifier AS udhaarUid,
                                udhaar_REPLACE_USERID.bill_no AS udhaarBillNo,
                                udhaar_REPLACE_USERID.amount AS udhaarAmt,
                                udhaar_REPLACE_USERID.date AS udhaarDate,
                                udhaar_REPLACE_USERID.account_id AS udhaarAccId,
                                udhaar_REPLACE_USERID.notes AS udhaarNotes,
                                udhaar_REPLACE_USERID.trashed AS udhaarTrashedFlag
                            FROM
                                udhaar_REPLACE_USERID
                                    LEFT JOIN
                                customer ON udhaar_REPLACE_USERID.customer_id = customer.CustomerId
                            WHERE
                                udhaar_REPLACE_USERID.customer_id = ?`
};
