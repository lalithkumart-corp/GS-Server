'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
let dateformat = require('dateformat');

const PENDING_UDHAAR_LIST = 'PENDING_UDHAAR_LIST';
const PENDING_UDHAAR_LIST_COUNT = 'PENDING_UDHAAR_LIST_COUNT';

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
    });

    Udhaar.remoteMethod('getPendingUdhaarBillsAPIHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
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
        http: {path: '/get-pending-udhaar-bills', verb: 'get'},
        description: 'For fetching pending Udhaar bills.',
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

    Udhaar.getPendingUdhaarBillsAPIHandler = (accessToken, apiParams, cb) => {
        Udhaar._getPendingUdhaarBillsAPIHandler(accessToken, apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }
    Udhaar._getPendingUdhaarBillsAPIHandler = (accessToken, apiParams) => {
        return new Promise(async (resolve, reject) => {
            apiParams._userId = await utils.getStoreOwnerUserId(accessToken);

            let promise1 = new Promise((resolve, reject) => {
                let query = Udhaar._constructQuery(PENDING_UDHAAR_LIST, apiParams);
                Udhaar.dataSource.connector.query(query, (err, res) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(res);
                });
            });

            let promise2 = new Promise((resolve, reject) => {
                let query = Udhaar._constructQuery(PENDING_UDHAAR_LIST_COUNT, apiParams);
                Udhaar.dataSource.connector.query(query, (err, res) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(res);
                });
            });

            Promise.all([promise1, promise2])
            .then(
                (results) => {
                    let obj = {
                        list: results[0],
                        count: results[1][0]['count']
                    }
                    resolve(obj);
                },
                (error) => {
                    reject(error);
                }
            )
            .catch(
                (exception) => {
                    reject(exception);
                }
            )
        });
    }

    Udhaar._constructQuery = (identifier, params) => {
        let filterPart = '';
        let whereCondList = [];
        let orderClause = '';
        let limitOffsetClause = '';
        let sql = '';
        switch(identifier) {
            case PENDING_UDHAAR_LIST:
            case PENDING_UDHAAR_LIST_COUNT:
                sql = SQL[identifier];
                let filters = params.filters;
                if(filters.startDate && filters.endDate)
                    whereCondList.push(`udhaar_REPLACE_USERID.date BETWEEN '${filters.startDate}' AND '${filters.endDate}'`);
                if(filters.customerName)
                    whereCondList.push(`customer.Name LIKE '${filters.customerName}%' `);
                if(filters.guardianName)
                    whereCondList.push(`customer.GuardianName LIKE '${filters.guardianName}%' `);
                if(filters.place)
                    whereCondList.push(`customer.Place LIKE '${filters.place}%' `);
                if(filters.address)
                    whereCondList.push(`customer.Address LIKE '${filters.address}%' `);
                if(filters.mobile)
                    whereCondList.push(`customer.Mobile LIKE '${filters.mobile}%' `);
                
                if (whereCondList.length > 0)
                    filterPart = ` WHERE ${whereCondList.join(' AND ')}`;

                if (identifier == PENDING_UDHAAR_LIST) {
                    // LIMIT
                    if (params.limit !== undefined && params.offset !== undefined)
                      limitOffsetClause = ` LIMIT ${params.limit} OFFSET ${params.offsetStart}`;
          
                    // ORDER BY
                    orderClause = 'ORDER BY udhaar_REPLACE_USERID.date DESC';
                }
                break;
        }
        sql = sql.replace('WHERE_CLAUSE', filterPart);

        sql = sql.replace('ORDER_CLAUSE', orderClause);

        sql = sql.replace('LIMIT_OFFSET_CLAUSE', limitOffsetClause);

        sql = sql.replace(/REPLACE_USERID/g, params._userId);
        return sql;
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
                                udhaar_REPLACE_USERID.customer_id = ?`,
    PENDING_UDHAAR_LIST: `SELECT                         
                                udhaar_REPLACE_USERID.unique_identifier AS udhaarUid,
                                udhaar_REPLACE_USERID.bill_no AS udhaarBillNo,
                                udhaar_REPLACE_USERID.amount AS udhaarAmt,
                                udhaar_REPLACE_USERID.date AS udhaarDate,
                                udhaar_REPLACE_USERID.account_id AS udhaarAccId,
                                udhaar_REPLACE_USERID.notes AS udhaarNotes,
                                udhaar_REPLACE_USERID.trashed AS udhaarTrashedFlag,
                                customer.Name AS customerName,
                                customer.GaurdianName AS guardianName,
                                customer.Address AS address,
                                customer.Place AS place,
                                customer.City AS city,
                                customer.Pincode AS pincode,
                                customer.Mobile AS mobile,
                                customer.SecMobile AS secMobile
                            FROM
                                udhaar_REPLACE_USERID
                                    LEFT JOIN
                                customer ON udhaar_REPLACE_USERID.customer_id = customer.CustomerId
                            WHERE_CLAUSE`,
    PENDING_UDHAAR_LIST_COUNT: `SELECT
                                    COUNT(*) AS count
                                FROM
                                    udhaar_REPLACE_USERID
                                        LEFT JOIN
                                    customer ON udhaar_REPLACE_USERID.customer_id = customer.CustomerId
                                WHERE_CLAUSE`
};
