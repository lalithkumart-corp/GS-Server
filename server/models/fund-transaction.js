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
            let queryValues = [userId, FUND_HOUSE_ID_MAP[apiParams.fundHouse], dateformat(apiParams.transactionDate, 'yyyy-mm-dd HH:MM:ss'), apiParams.amount, apiParams.category, apiParams.remarks];
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
            let queryValues = [userId, FUND_HOUSE_ID_MAP[apiParams.fundHouse], dateformat(apiParams.transactionDate, 'yyyy-mm-dd HH:MM:ss'), (-apiParams.amount), apiParams.category, apiParams.remarks];
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

    FundTransaction._appendFilters = (sql, params, identifier) => {
        let filters = [];
        switch(identifier) {
            case 'FETCH_TRANSACTION_LIST':
                if(params._userId)
                    filters.push(`user_id=${params._userId}`);
                if(params.fundHouse)
                    filters.push(`fund_houses.name like '${params.fundHouse}%'`);
                if(params.category)
                    filters.push(`category like '${params.category}%'`);
                if(params.startDate && params.endDate)
                    filters.push(`(created_date BETWEEN '${params.startDate}' AND '${params.endDate}')`);
                
                let orderPart = '';
                if(params.orderCol && params.orderBy) {
                    if(params.orderCol == 'TRN_DATE')
                        orderPart = ` ORDER BY transaction_date ${params.orderBy}`;
                    else if(params.orderCol == 'CREATED_DATE')
                        orderPart = ` ORDER BY created_date ${params.orderBy}`;
                    else if(params.orderCol == 'MODIFIED_DATE')
                        orderPart = ` ORDER BY modified_date ${params.orderBy}`;
                }

                if(filters.length > 0)
                    sql += ` WHERE ${filters.join(` AND `)}`;

                sql += orderPart;

                let limit = params.offsetEnd - params.offsetStart;
                sql += ` LIMIT ${limit} OFFSET ${params.offsetStart}`;
                break;
            case 'TRANSACTION_LIST_COLLECTIONS':
                if(params._userId)
                    filters.push(`user_id=${params._userId}`);
                if(params.startDate && params.endDate)
                    filters.push(`(created_date BETWEEN '${params.startDate}' AND '${params.endDate}')`);
                if(filters.length > 0)
                    sql += ` WHERE ${filters.join(` AND `)}`;
                break;
        }
        return sql;
    }

    FundTransaction._fetchTransactionsApi = (accessToken, params) => {
        return new Promise(async (resolve, reject) => {
            params._userId =await  utils.getStoreOwnerUserId(accessToken);
            console.log(params.startDate); // 2021-05-14T18:30:00.000Z
            console.log(dateformat(params.startDate, 'yyyy-mm-dd HH:MM:ss')); // 2021-05-15 00:00:00
            
            
            let sql = SQL.TRANSACTION_LIST;
            sql = FundTransaction._appendFilters(sql, params, 'FETCH_TRANSACTION_LIST');
            let fetchPaginatedList = new Promise((resolve, reject) => {
                FundTransaction.dataSource.connector.query(sql, (err, res) => {
                    if(err) {
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
            });

            let totalSql = SQL.TRANSACTION_LIST_COLLECTIONS;
            totalSql = FundTransaction._appendFilters(totalSql, params, 'TRANSACTION_LIST_COLLECTIONS');
            let fetchCollections = new Promise((resolve, reject) => {
                FundTransaction.dataSource.connector.query(totalSql, (err, res) => {
                    if(err) {
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
            });

            Promise.all([fetchPaginatedList, fetchCollections]).then(
                (results) => {
                    let obj = {
                        results: results[0],
                        collections: FundTransaction._constructCollections(results[1])
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
            );
        });
    }

    FundTransaction._constructCollections = (collRes) => {
        let collections = {
            count: collRes.length,
            fundHouses: [],
            categories: []
        };
        
        if(collections.count > 0) {
            _.each(collRes, (aColl, index) => {
                if(aColl.name && collections.fundHouses.indexOf(aColl.name) == -1)
                    collections.fundHouses.push(aColl.name);
                if(aColl.category && collections.categories.indexOf(aColl.category) == -1)
                    collections.categories.push(aColl.category);
            });
        }
        return collections;
    }
}

let SQL = {
    CASH_TRANSACTION: `INSERT INTO fund_transactions (user_id, fund_house_id, transaction_date, amount, category, remarks) VALUES (?,?,?,?,?,?)`,
    TRANSACTION_LIST: `SELECT 
                            fund_houses.name AS fund_house_name,
                            fund_transactions.*
                        FROM
                            fund_transactions
                                LEFT JOIN
                            fund_houses ON fund_transactions.fund_house_id = fund_houses.id`,
    TRANSACTION_LIST_COLLECTIONS: `SELECT
                                        category,
                                        fund_houses.name
                                    FROM
                                        fund_transactions
                                            LEFT JOIN
                                        fund_houses ON fund_transactions.fund_house_id = fund_houses.id`,
}