'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
let dateformat = require('dateformat');

const FUND_HOUSE_ID_MAP = {
    shop: 1,
    bank: 2,
}

module.exports = function(FundTransaction) {
    FundTransaction.remoteMethod('cashInApi', {
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
        http: {path: '/cash-in', verb: 'post'},
        description: 'Transaction - CashIn.',
    });
    FundTransaction.remoteMethod('cashOutApi', {
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
        http: {path: '/cash-out', verb: 'post'},
        description: 'Transaction - CashOut.',
    });

    FundTransaction.remoteMethod('fetchTransactionsApi', {
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
        http: {path: '/fetch-transactions', verb: 'get'},
        description: 'For fetching fund transactions.',
    });

    FundTransaction.cashInApi = (apiParams, cb) => {
        FundTransaction._cashInApi(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    FundTransaction._cashInApi = (apiParams) => {
        return new Promise( async (resolve, reject) => {
            let userId =await  utils.getStoreOwnerUserId(apiParams.accessToken);
            let queryValues = [userId, FUND_HOUSE_ID_MAP[apiParams.fundHouse], dateformat(apiParams.transactionDate, 'yyyy-mm-dd HH:MM:ss'), apiParams.amount, apiParams.remarks];
            FundTransaction.dataSource.connector.query(SQL.CASH_TRANSACTION, queryValues, (err, res) => {
                if(err){
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    FundTransaction.cashOutApi = (apiParams, cb) => {
        FundTransaction._cashOutApi(apiParams).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    FundTransaction._cashOutApi = (apiParams) => {
        return new Promise( async (resolve, reject) => {
            let userId =await  utils.getStoreOwnerUserId(apiParams.accessToken);
            let queryValues = [userId, FUND_HOUSE_ID_MAP[apiParams.fundHouse], dateformat(apiParams.transactionDate, 'yyyy-mm-dd HH:MM:ss'), (-apiParams.amount), apiParams.remarks];
            FundTransaction.dataSource.connector.query(SQL.CASH_TRANSACTION, queryValues, (err, res) => {
                if(err){
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    FundTransaction.fetchTransactionsApi = (accessToken, params, cb) => {
        FundTransaction._fetchTransactionsApi(accessToken, params).then(
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

    FundTransaction._fetchTransactionsApi = (accessToken, params) => {
        return new Promise(async (resolve, reject) => {
            let userId =await  utils.getStoreOwnerUserId(accessToken);
            FundTransaction.dataSource.connector.query(SQL.TRANSACTION_LIST, [userId, dateformat(params.startDate, 'yyyy-mm-dd HH:MM:ss'), dateformat(params.endDate, 'yyyy-mm-dd HH:MM:ss')], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }
}

let SQL = {
    CASH_TRANSACTION: `INSERT INTO fund_transactions (user_id, fund_house_id, transaction_date, amount, remarks) VALUES (?,?,?,?,?)`,
    TRANSACTION_LIST: `SELECT 
                            fund_houses.name AS fund_house_name,
                            fund_transactions.*
                        FROM
                            fund_transactions
                                LEFT JOIN
                            fund_houses ON fund_transactions.fund_house_id = fund_houses.id
                        WHERE user_id=? AND (created_date BETWEEN ? AND ?);`
}