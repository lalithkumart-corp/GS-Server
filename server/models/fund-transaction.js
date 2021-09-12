'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');
let dateformat = require('dateformat');

const account_id_MAP = {
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

    FundTransaction.remoteMethod('updateCashInDataApi', {
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
        http: {path: '/update-cash-in', verb: 'put'},
        description: 'Transaction update - CashIn.',
    });

    FundTransaction.remoteMethod('updateCashOutDataApi', {
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
        http: {path: '/update-cash-out', verb: 'put'},
        description: 'Transaction update - CashOut.',
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

    FundTransaction.remoteMethod('fetchTransactionsApiV2', {
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
        http: {path: '/fetch-transactions-v2', verb: 'get'},
        description: 'For fetching fund transactions.',
    });


    FundTransaction.remoteMethod('fetchConsolidatedTransactionsApi', {
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
        http: {path: '/fetch-consolidated-transactions', verb: 'get'},
        description: 'For fetching fund transactions.',
    });

    FundTransaction.remoteMethod('fetchTransactionsByBillIdApi', {
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
                    let loan_uid = req && req.query.loan_uid;
                    let closed_uid = req && req.query.closed_uid;
                    return {loan_uid, closed_uid};
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
        http: {path: '/fetch-transactions-by-bill', verb: 'get'},
        description: 'For fetching fund transactions.',
    });

    FundTransaction.remoteMethod('fetchCategorySuggestionsApi', {
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
                arg: 'mode', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let mode = req && req.query.mode;
                    return mode;
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
        http: {path: '/fetch-category-suggestions', verb: 'get'},
        description: 'For fetching fund transactions.',
    });

    FundTransaction.remoteMethod('getOpeningBalanceApi', {
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
                arg: 'dateVal', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let date = req && req.query.date;
                    return date;
                },
                description: 'Date Argument goes here',
            }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/get-opening-balance', verb: 'get'},
        description: 'For getting the Opening Balance by date.',
    });

    FundTransaction.remoteMethod('deleteTransactionsApi', {
        accepts: {
            arg: 'data',
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
        http: {path: '/delete-by-transactionid', verb: 'del'},
        description: 'Delete transactions by ID'
    });
    FundTransaction.remoteMethod('addCashInForBill', {
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
        http: {path: '/cash-in-for-bill', verb: 'post'},
        description: 'Transaction - CashIn.',
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
            let userId = await  utils.getStoreOwnerUserId(apiParams.accessToken);
            let queryValues = [userId, apiParams.fundHouse, dateformat(apiParams.transactionDate, 'yyyy-mm-dd HH:MM:ss', true), apiParams.amount, 0, apiParams.category, apiParams.remarks, apiParams.paymentMode];
            FundTransaction.dataSource.connector.query(SQL.CASH_TRANSACTION_IN, queryValues, (err, res) => {
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

            let destAccDetail = apiParams.destinationAccountDetail;
            let queryValues = [userId, apiParams.myFundAccountId, dateformat(apiParams.transactionDate, 'yyyy-mm-dd HH:MM:ss', true), 0, apiParams.amount, apiParams.category, apiParams.remarks,
                apiParams.paymentMode, destAccDetail.toAccountId, destAccDetail.accNo, destAccDetail.ifscCode, destAccDetail.upiId];
            FundTransaction.dataSource.connector.query(SQL.CASH_TRANSACTION_OUT, queryValues, (err, res) => {
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

    FundTransaction.fetchTransactionsApiV2 = (accessToken, params, cb) => {
        FundTransaction._fetchTransactionsApiV2(accessToken, params).then(
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
        let filterPart = '';
        let orderClause = '';
        let limitOffsetClause = '';
        let filters = [];
        switch(identifier) {
            case 'FETCH_TRANSACTION_LIST':
            case 'FETCH_TRANSACTION_LIST_V2':
                filters.push('deleted = 0');
                if(params._userId)
                    filters.push(`FUND_TRNS_TBL_NAME.user_id=${params._userId}`);
                if(params.accounts) {
                    params.accounts = params.accounts.map((anAccount) => `'${anAccount}'`);
                    let joinedAccounts = params.accounts.join(', ');
                    filters.push(`fund_accounts.id in (${joinedAccounts})`);
                }
                if(params.category && params.category.length > 0) {
                    params.category = params.category.map((aCategory) => `'${aCategory}'`);
                    let joinedCategories = params.category.join(', ');
                    filters.push(`category in (${joinedCategories})`);
                }
                if(params.startDate && params.endDate)
                    filters.push(`(transaction_date BETWEEN '${params.startDate}' AND '${params.endDate}')`);
                
                if(params.orderCol && params.orderBy) {
                    if(params.orderCol == 'TRN_DATE')
                        orderClause = ` ORDER BY transaction_date ${params.orderBy}`;
                    else if(params.orderCol == 'CREATED_DATE')
                        orderClause = ` ORDER BY created_date ${params.orderBy}`;
                    else if(params.orderCol == 'MODIFIED_DATE')
                        orderClause = ` ORDER BY modified_date ${params.orderBy}`;
                } else {
                    orderClause = ` ORDER BY transaction_date ASC`;
                }

                let limit = params.offsetEnd - params.offsetStart;
                limitOffsetClause = ` LIMIT ${limit} OFFSET ${params.offsetStart}`;
                break;
            case 'TRANSACTION_LIST_COLLECTIONS':
                filters.push('deleted = 0');
                if(params._userId)
                    filters.push(`fund_transactions.user_id=${params._userId}`);
                if(params.startDate && params.endDate)
                    filters.push(`(transaction_date BETWEEN '${params.startDate}' AND '${params.endDate}')`);
                break;
            case 'FETCH_TRANSACTION_LIST_BY_BILL':
                if(params._userId)
                    filters.push(`fund_transactions.user_id=${params._userId}`);
                if(params.loan_uid) {
                    if(params.closed_uid)
                        filters.push(`(fund_transactions.gs_uid=${params.loan_uid} OR fund_transactions.gs_uid=${params.closed_uid})`);
                    else
                        filters.push(`fund_transactions.gs_uid=${params.loan_uid}`);
                }
                break;
        }

        if(filters.length > 0)
            filterPart = ` WHERE ${filters.join(' AND ')}`;

        sql = sql.replace('WHERE_CLAUSE', filterPart);

        sql = sql.replace('ORDER_CLAUSE', orderClause);

        sql = sql.replace('LIMIT_OFFSET_CLAUSE', limitOffsetClause);

        // TABLE NAME REPLACEMENT
        if(identifier == 'FETCH_TRANSACTION_LIST') sql = sql.replace(/FUND_TRNS_TBL_NAME/g, 'fund_transactions');
        else if(identifier == 'FETCH_TRANSACTION_LIST_V2') sql = sql.replace(/FUND_TRNS_TBL_NAME/g, 'gs_temp_table');

        return sql;
    }

    FundTransaction._fetchTransactionsApi = (accessToken, params) => {
        return new Promise(async (resolve, reject) => {
            params._userId =await  utils.getStoreOwnerUserId(accessToken);

            let promiseTasks = [];

            promiseTasks.push(FundTransaction.fetchPaginatedList(params));
            
            if(params.fetchFundOverview) {
                promiseTasks.push(FundTransaction.fetchListCollections(params));
                promiseTasks.push(FundTransaction.fetchOpeningBalanceFromDB(params._userId, params.startDate));
                promiseTasks.push(FundTransaction.fetchClosingBalanceFromDB(params._userId, params.endDate));
                promiseTasks.push(FundTransaction.fetchCashInOutTotalsFromDB(params));
            }
            //  else {
            //     let limit = params.offsetEnd - params.offsetStart;
            //     let offset = params.offsetStart;
            //     promiseTasks.push(FundTransaction.fetchPageWiseOpeningBalanceFromDB(params._userId, params.startDate, params.endDate, limit, offset));
            // }

            Promise.all(promiseTasks).then(
                (results) => {
                    let obj = FundTransaction.constructTransactionListApiResponse(results, params);
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

    FundTransaction._fetchTransactionsApiV2 = (accessToken, params) => {
        return new Promise(async (resolve, reject) => {
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let res = await FundTransaction.fetchRecordsWithHelpOfProcedure(params);
            
            let promiseTasks = [];
            if(params.fetchFundOverview) {
                promiseTasks.push(FundTransaction.fetchListCollections(params));
                promiseTasks.push(FundTransaction.fetchOpeningBalanceFromDB(params._userId, params.startDate));
                promiseTasks.push(FundTransaction.fetchClosingBalanceFromDB(params._userId, params.endDate));
                promiseTasks.push(FundTransaction.fetchCashInOutTotalsFromDB(params));
            }

            Promise.all(promiseTasks).then(
                (results) => {
                    let obj = {
                        results: res
                    }
                    if(params.fetchFundOverview) {
                        obj.collections = FundTransaction._constructCollections(results[0]);
                        obj.openingBalance = results[1] || 0;
                        obj.closingBalance = results[2].closing_balance || 0;
                        obj.totalCashIn = results[3].total_cash_in || 0;
                        obj.totalCashOut = results[3].total_cash_out || 0;
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
    };

    FundTransaction._constructCollections = (collRes) => {
            let collections = {
            count: collRes.length,
            fundAccounts: [],
            categories: [],
            totalCashIn: 0,
            totalCashOut: 0,
        };
        try {
            if(collections.count > 0) {
                _.each(collRes, (aColl, index) => {
                    if(aColl.fundAccountId) {
                        let existsArr = collections.fundAccounts.filter((anObj, index) => {
                            if(anObj.id == aColl.fundAccountId)
                                return true;
                        });
                        if(existsArr.length == 0)
                            collections.fundAccounts.push({id: aColl.fundAccountId, name: aColl.name});
                    }
                    if(aColl.category && collections.categories.indexOf(aColl.category) == -1)
                        collections.categories.push(aColl.category);
                    if(aColl.cash_in)
                        collections.totalCashIn += aColl.cash_in;
                    if(aColl.cash_out)
                        collections.totalCashOut += aColl.cash_out;
                });
            }
        } catch(e) {
            console.error(e);
        }
        return collections;
    }

    FundTransaction.fetchCategorySuggestionsApi = (accessToken, mode, cb) => {
        FundTransaction._fetchCategorySuggestionsApi(accessToken, mode).then(
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

    FundTransaction._fetchCategorySuggestionsApi = (accessToken, mode) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let amountCondition = 'cash_in > 0';
            if(mode == 'cash-out')
                amountCondition = 'cash_out > 0'
            let sql = SQL.CATEGORY_LIST;
            sql += ` WHERE user_id=${userId} AND ${amountCondition}`;
            FundTransaction.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    let arr = [];
                    _.each(res, (anObj, index) => {
                        if(anObj.category && arr.indexOf(anObj.category) == -1)
                            arr.push(anObj.category);
                    });
                    return resolve(arr);
                }
            });
        });
    }

    FundTransaction.prototype.add = (params, moduleIdentifier) => {
        return new Promise(async (resolve, reject) => {
            try {
                switch(moduleIdentifier) {
                    case 'pledgebook':
                        await FundTransaction.addGirviEntry(params);
                        break;
                    case 'redeem':
                        await FundTransaction.addRedeemEntry(params);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return resolve(true); // this is backend job, so allways returning true.
            }
        });
    }

    FundTransaction.addGirviEntry = (params) => {
        return new Promise((resolve, reject) => {
            let parsedArg = params.parsedArg;
            let mode = null;
            let fromAcc = null;
            let toAcc = null;
            let accountNo = null;
            let upiId = null;
            let ifscCode = null;
            if(parsedArg.paymentDetails) {
                let pd = parsedArg.paymentDetails;
                mode = pd.mode;
                if(pd.mode == 'cash') {
                    fromAcc = pd.cash.fromAccountId;
                } else if(pd.mode == 'cheque') {
                    fromAcc = pd.cheque.fromAccountId;
                } else if(pd.mode == 'online') {
                    fromAcc = pd.online.fromAccountId;
                    toAcc = pd.online.toAccount.toAccountId;
                    accountNo = pd.online.toAccount.accNo;
                    upiId = pd.online.toAccount.upiId;
                    ifscCode = pd.online.toAccount.ifscCode;
                }
            }

            let qv = [parsedArg._userId, parsedArg.customerId, fromAcc, parsedArg.uniqueIdentifier, parsedArg.date, parsedArg.interestValue, parsedArg.amount, 'Girvi', parsedArg.billNoWithSeries,
            mode, toAcc, accountNo, ifscCode, upiId];
            FundTransaction.dataSource.connector.query(SQL.INTERNAL_GIRVI_TRANSACTION, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    FundTransaction.addRedeemEntry = (params) => {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<params.data.length; i++) {
                    let datum = params.data[i];
                    // let qv = [params._userId, 1, datum.redeemUID, datum.closedDate, datum.paidAmount, 0, 'Redeem', datum.billNo];

                    let mode = null;
                    let toAcc = null;
                    if(datum.paymentDetails) {
                        let pd = datum.paymentDetails;
                        mode = pd.mode;
                        toAcc = pd[mode].toAccountId;
                    }
                    let qv = [params._userId, toAcc, datum.redeemUID, datum.customerId, datum.closedDate, datum.paidAmount, 0, 'Redeem', datum.billNo, mode];
                    
                    await FundTransaction._addRedeemEntry(qv);
                }
                return resolve(true);
            } catch(e) {
                return reject(e);
            }
        });
    }

    FundTransaction._addRedeemEntry = (qv) => {
        return new Promise((resolve, reject) => {
            FundTransaction.dataSource.connector.query(SQL.INTERNAL_REDEEM_TRANSACTION, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    FundTransaction.prototype.update = (params, moduleIdentifier) => {
        return new Promise(async (resolve, reject) => {
            try {
                switch(moduleIdentifier) {
                    case 'pledgebook':
                        await FundTransaction.updateGirviEntry(params);
                        break;
                    case 'redeem':
                        await FundTransaction.updateRedeemEntry(params);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return resolve(true); // this is backend job, so allways returning true.
            }
        });
    }

    FundTransaction.updateGirviEntry = (params) => {
        return new Promise((resolve, reject) => {
            let parsedArg = params.parsedArg;
            let mode = null;
            let fromAcc = null;
            let toAcc = null;
            let accountNo = null;
            let upiId = null;
            let ifscCode = null;
            if(parsedArg.paymentDetails) {
                let pd = parsedArg.paymentDetails;
                mode = pd.mode;
                if(pd.mode == 'cash') {
                    fromAcc = pd.cash.fromAccountId;
                } else if(pd.mode == 'cheque') {
                    fromAcc = pd.cheque.fromAccountId;
                } else if(pd.mode == 'online') {
                    fromAcc = pd.online.fromAccountId;
                    toAcc = pd.online.toAccount.toAccountId;
                    accountNo = pd.online.toAccount.accNo;
                    upiId = pd.online.toAccount.upiId;
                    ifscCode = pd.online.toAccount.ifscCode;
                }
            };

            let qv = [parsedArg.customerId, fromAcc, parsedArg.date, parsedArg.interestValue, parsedArg.amount, 'Girvi', mode, toAcc, accountNo, ifscCode, upiId, parsedArg.uniqueIdentifier, parsedArg._userId];

            FundTransaction.dataSource.connector.query(SQL.INTERNAL_GIRVI_TRANSACTION_UPDATE, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    FundTransaction.updateRedeemEntry = (params) => {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<params.data.length; i++) {
                    let datum = params.data[i];
                    // let qv = [params._userId, 1, datum.redeemUID, datum.closedDate, datum.paidAmount, 0, 'Redeem', datum.billNo];

                    let mode = null;
                    let toAcc = null;
                    if(datum.paymentDetails) {
                        let pd = datum.paymentDetails;
                        mode = pd.mode;
                        toAcc = pd[mode].toAccountId;
                    }
                    let qv = [ datum.customerId, toAcc, datum.closedDate, datum.paidAmount, datum.billNo,  mode,   datum.redeemUID, params._userId];
                    await FundTransaction._updateRedeemEntry(qv);
                }
                return resolve(true);
            } catch(e) {
                return reject(e);
            }
        });
    }

    FundTransaction._updateRedeemEntry = (qv) => {
        return new Promise((resolve, reject) => {
            FundTransaction.dataSource.connector.query(SQL.INTERNAL_REDEEM_TRANSACTION_UPDATE, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }


    FundTransaction.prototype.removeEntry = (params, moduleIdentifier) => {
        return new Promise(async (resolve, reject) => {
            try {
                switch(moduleIdentifier) {
                    case 'redeem':
                        await FundTransaction.markRedeemEntryAsDeleted(params);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return resolve(true); // this is backend job, so allways returning true.
            }
        });
    }

    FundTransaction.markRedeemEntryAsDeleted = (params) => {
        return new Promise(async (resolve, reject) => {
            try {
                for(let i=0; i<params.data.length; i++) {
                    let datum = params.data[i];
                    let params2 = {_userId: params._userId, closedBillReference: datum.closedBillReference};
                    await FundTransaction._markRedeemEntryAsDeleted(params2);
                }
                return resolve(true);
            } catch(e) {
                return reject(e);
            }
        });
    }

    FundTransaction._markRedeemEntryAsDeleted = (params) => {
        return new Promise( async (resolve, reject) => {
            let qv = [params._userId, params.closedBillReference];
            FundTransaction.dataSource.connector.query(SQL.MARK_AS_DELETED, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    FundTransaction.getOpeningBalanceApi = (accessToken, dateVal, cb) => {
        FundTransaction._getOpeningBalanceApi(accessToken, dateVal).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundTransaction._getOpeningBalanceApi = (accessToken, dateVal) => {
        return new Promise( async (resolve, reject) => {
            try {
                let userId = await utils.getStoreOwnerUserId(accessToken);
                let openingBal = await FundTransaction.fetchOpeningBalanceFromDB(userId, dateVal);
                return resolve(openingBal);
            } catch(e) {
                return reject(e);
            }
        });
    }

    FundTransaction.fetchOpeningBalanceFromDB = (userId, dateVal) => {
        return new Promise( async (resolve, reject) => {
            FundTransaction.dataSource.connector.query(SQL.OPENING_BALANCE, [userId, dateVal], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    if(res && res.length >0)
                        resolve(res[0].opening_balance);
                    else
                        resolve(0);
                }
            });
        });
    }

    FundTransaction.fetchClosingBalanceFromDB = (userId, dateVal) => {
        return new Promise( async (resolve, reject) => {
            FundTransaction.dataSource.connector.query(SQL.CLOSING_BALANCE, [userId, dateVal], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    if(res && res.length >0)
                        resolve({
                            closing_balance: res[0].closing_balance
                        });
                    else
                        resolve(0);
                }
            });
        });
    }

    FundTransaction.fetchCashInOutTotalsFromDB = (params) => {
        return new Promise( async (resolve, reject) => {
            FundTransaction.dataSource.connector.query(SQL.CASH_IN_OUT_TOTALS, [params._userId, params.startDate, params.endDate], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    if(res && res.length >0)
                        resolve({
                            total_cash_in: res[0].total_cash_in,
                            total_cash_out: res[0].total_cash_out
                        });
                    else
                        resolve(0);
                }
            });
        });
    }


    FundTransaction.deleteTransactionsApi = (params, cb) => {
        FundTransaction._deleteTransactionsApi(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundTransaction._deleteTransactionsApi = (params) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            FundTransaction.dataSource.connector.query(SQL.DELETE_TRANSACTIONS, [params.transactionIds, userId], (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            })
        });
    }

    FundTransaction.addCashInForBill = (params, cb) => {
        FundTransaction._addCashInForBill(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundTransaction._addCashInForBill = (params) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            let mode = null;
            let toAcc = null;
            if(params.paymentDetails) {
                let pd = params.paymentDetails;
                mode = pd.mode;
                toAcc = pd[mode].toAccountId;
            }
            let queryValues = [userId, params.customerId, toAcc, params.uniqueIdentifier, dateformat(params.dateVal, 'yyyy-mm-dd HH:MM:ss', true), params.paymentDetails.value, 0, params.category, params.remarks, mode];
            FundTransaction.dataSource.connector.query(SQL.ADD_CASH_FOR_BILL, queryValues, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    FundTransaction.fetchTransactionsByBillIdApi = (accessToken, params, cb) => {
        FundTransaction._fetchTransactionsByBillIdApi(accessToken, params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundTransaction._fetchTransactionsByBillIdApi = (accessToken, params) => {
        return new Promise(async (resolve, reject) => {
            if(!params.loan_uid)
                return reject('Bill ID is not passed.');
            params._userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.TRANSACTION_LIST;
            sql = FundTransaction._appendFilters(sql, params, 'FETCH_TRANSACTION_LIST_BY_BILL');
            FundTransaction.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    FundTransaction.updateCashInDataApi = (params, cb) => {
        FundTransaction._updateCashInDataApi(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundTransaction._updateCashInDataApi = (params) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            let queryValues = [params.accountId, dateformat(params.transactionDate, 'yyyy-mm-dd HH:MM:ss', true), params.amount, params.category, params.remarks, params.paymentMode, params.transactionId, userId];
            FundTransaction.dataSource.connector.query(SQL.UPDATE_TRANSACTION_FOR_CASH_IN, queryValues, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    FundTransaction.updateCashOutDataApi = (params, cb) => {
        FundTransaction._updateCashOutDataApi(params).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    FundTransaction._updateCashOutDataApi = (params) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(params.accessToken);
            let destAccDetail = params.destinationAccountDetail;
            let queryValues = [params.accountId, dateformat(params.transactionDate, 'yyyy-mm-dd HH:MM:ss', true), params.amount, params.category, params.remarks, 
                params.paymentMode, destAccDetail.toAccountId, destAccDetail.accNo, destAccDetail.ifscCode, destAccDetail.upiId, params.transactionId, userId];
            FundTransaction.dataSource.connector.query(SQL.UPDATE_TRANSACTION_FOR_CASH_OUT, queryValues, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    FundTransaction.fetchPaginatedList = (params) => {
        return new Promise((resolve, reject) => {
            let sql = SQL.TRANSACTION_LIST;
            sql = FundTransaction._appendFilters(sql, params, 'FETCH_TRANSACTION_LIST');
            FundTransaction.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    FundTransaction.fetchListCollections = (params) => {
        return new Promise((resolve, reject) => {
            let totalSql = SQL.TRANSACTION_LIST_COLLECTIONS;
            totalSql = FundTransaction._appendFilters(totalSql, params, 'TRANSACTION_LIST_COLLECTIONS');
            FundTransaction.dataSource.connector.query(totalSql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    FundTransaction.constructTransactionListApiResponse = (results, reqParams) => {
        let resp = {
            results: results[0]
        };
        if(reqParams.fetchFundOverview) {
            resp.collections = FundTransaction._constructCollections(results[1]);
            resp.openingBalance = results[2] || 0;
            resp.closingBalance = results[3].closing_balance || 0;
            resp.totalCashIn = results[4].total_cash_in || 0;
            resp.totalCashOut = results[4].total_cash_out || 0;
        }
        return resp;
    }

    FundTransaction.fetchBalanceValByDateAndLimitRange = (userId, dateVal, endDate, limit, offset) => {
        return new Promise((resolve, reject) => {
            let sql = `SELECT
                            SUM(cash_in - cash_out) AS FundBalance
                        FROM (
                            SELECT
                                cash_in,
                                cash_out
                            FROM
                                fund_transactions
                            WHERE
                                user_id = ${userId}
                                AND transaction_date > '${dateVal}'
                                AND deleted = 0
                            ORDER BY transaction_date ASC
                            LIMIT ${offset}) AS t`;
            FundTransaction.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    if(res && res.length >0)
                        resolve(res[0].FundBalance);
                    else
                        resolve(0);
                }
            })
        });
    }

    FundTransaction.fetchPageWiseOpeningBalanceFromDB = async (userId, startDate, endDate, limit, offset) => {
        let bal1 = await FundTransaction.fetchOpeningBalanceFromDB(userId, startDate);
        let bal2 = await FundTransaction.fetchBalanceValByDateAndLimitRange(userId, startDate, endDate, limit, offset);
        return bal1+bal2;
    }

    FundTransaction.checkTempTableLoclStatus = () => {
        return new Promise((resolve, reject) => {
            let sql = SQL.TEMP_TABLE_LOCK_STATUS;
            sql = sql.replace(/WHERE_CLAUSE/g, `WHERE table_name="gs_temp_table"`);
            FundTransaction.dataSource.connector.query(sql, (err, res) => {
                if(err) return reject(err);
                else return resolve(res[0].is_locked);
            });
        });
    }

    FundTransaction.setLockStatus = (status) => {
        return new Promise((resolve, reject) => {
            let sql = SQL.SET_TEMP_TABLE_LOCK_STATUS;
            sql = sql.replace(/WHERE_CLAUSE/g, `WHERE table_name="gs_temp_table"`);
            FundTransaction.dataSource.connector.query(sql, [status], (err, res) => {
                if(err) console.log(err);
                return resolve(true);
            });
        });
    }

    FundTransaction.invokeStoredProcedure = (params) => {
        return new Promise((resolve, reject) => {
            let stDate = params.startDate.replace(/Z/, '').replace(/T/, ' ');
            let endDate = params.endDate.replace(/Z/, '').replace(/T/, ' ');
            FundTransaction.dataSource.connector.query(`CALL my_proc_1('${stDate}', '${endDate}', ${params._userId})`, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });        
        });
    };

    FundTransaction.fetchRecordsFromTempTable = (params) => {
        return new Promise((resolve, reject) => {
            let sql = SQL.TRANSACTION_LIST_V2;
            sql = FundTransaction._appendFilters(sql, params, 'FETCH_TRANSACTION_LIST_V2');
            FundTransaction.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        })
    }

    FundTransaction.fetchRecordsWithHelpOfProcedure = (params) => {
        return new Promise(async (resolve, reject) => {

            let isLocked = await FundTransaction.checkTempTableLoclStatus();
            if(isLocked) {
                params._retryAttemptForProcedureCall = params._retryAttemptForProcedureCall || 0;
                params._retryAttemptForProcedureCall++;
                if(params._retryAttemptForProcedureCall < 10) {
                    setTimeout(() => {
                        return FundTransaction.fetchRecordsWithHelpOfProcedure(params);
                    }, 1000);
                } else {
                    await FundTransaction.setLockStatus(0);
                    return FundTransaction.fetchRecordsWithHelpOfProcedure(params);
                }
            } else {
                await FundTransaction.setLockStatus(1);
                await FundTransaction.invokeStoredProcedure(params);
                let res = await FundTransaction.fetchRecordsFromTempTable(params);
                FundTransaction.setLockStatus(0);
                return resolve(res);
            } 
        });
    }
}

let SQL = {
    CASH_TRANSACTION_IN: `INSERT INTO fund_transactions (user_id, account_id, transaction_date, cash_in, cash_out, category, remarks, cash_in_mode) VALUES (?,?,?,?,?,?,?,?)`,
    CASH_TRANSACTION_OUT: `INSERT INTO fund_transactions (user_id, account_id, transaction_date, cash_in, cash_out, category, remarks, cash_out_mode, cash_out_to_bank_id, cash_out_to_bank_acc_no, cash_out_to_bank_ifsc, cash_out_to_upi) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    INTERNAL_GIRVI_TRANSACTION: `INSERT INTO fund_transactions (user_id, customer_id, account_id, gs_uid, transaction_date, cash_in, cash_out, category, remarks, cash_out_mode, cash_out_to_bank_id, cash_out_to_bank_acc_no, cash_out_to_bank_ifsc, cash_out_to_upi) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE account_id=VALUES(account_id), transaction_date=VALUES(transaction_date), cash_in=VALUES(cash_in), cash_out=VALUES(cash_out), cash_out_mode=VALUES(cash_out_mode), cash_out_to_bank_id=VALUES(cash_out_to_bank_id), cash_out_to_bank_acc_no=VALUES(cash_out_to_bank_acc_no), cash_out_to_bank_ifsc=VALUES(cash_out_to_bank_ifsc), cash_out_to_upi=VALUES(cash_out_to_upi) `,
    INTERNAL_REDEEM_TRANSACTION: `INSERT INTO fund_transactions (user_id, customer_id, account_id, gs_uid, transaction_date, cash_in, cash_out, category, remarks, cash_in_mode) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE account_id=VALUES(account_id), transaction_date=VALUES(transaction_date), cash_in=VALUES(cash_in), cash_out=VALUES(cash_out), cash_in_mode=VALUES(cash_in_mode)`,
    INTERNAL_GIRVI_TRANSACTION_UPDATE: `UPDATE fund_transactions SET customer_id=?, account_id=?, transaction_date=?, cash_in=?, cash_out=?, remarks=?, cash_out_mode=?, cash_out_to_bank_id=?, cash_out_to_bank_acc_no=?, cash_out_to_bank_ifsc=?, cash_out_to_upi=? WHERE gs_uid=? AND user_id=?`,
    INTERNAL_REDEEM_TRANSACTION_UPDATE: `UPDATE fund_transactions SET customer_id=?, account_id=?, transaction_date=?, cash_out=?, remarks=?, cash_in_mode=? WHERE gs_uid=? AND user_id=? `,
    ADD_CASH_FOR_BILL: `INSERT INTO fund_transactions (user_id, customer_id, account_id, gs_uid, transaction_date, cash_in, cash_out, category, remarks, cash_in_mode) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    UPDATE_TRANSACTION_FOR_CASH_IN: `UPDATE fund_transactions SET account_id=?, transaction_date=?, cash_in=?, category=?, remarks=?, cash_in_mode=? WHERE id=? AND user_id=?`,
    UPDATE_TRANSACTION_FOR_CASH_OUT: `UPDATE fund_transactions SET account_id=?, transaction_date=?, cash_out=?, category=?, remarks=?, cash_out_mode=?, cash_out_to_bank_id=?, cash_out_to_bank_acc_no=?, cash_out_to_bank_ifsc=?, cash_out_to_upi=? WHERE id=? AND user_id=?`,
    MARK_AS_DELETED: `UPDATE fund_transactions SET deleted=1 WHERE user_id=? AND gs_uid=?`,
    TRANSACTION_LIST: `SELECT 
                            fund_accounts.name AS fund_house_name,
                            FUND_TRNS_TBL_NAME.*
                        FROM
                            FUND_TRNS_TBL_NAME
                                LEFT JOIN
                            fund_accounts ON FUND_TRNS_TBL_NAME.account_id = fund_accounts.id
                        WHERE_CLAUSE
                        ORDER_CLAUSE
                        LIMIT_OFFSET_CLAUSE`,
    TRANSACTION_LIST_COLLECTIONS: `SELECT
                                        category,
                                        fund_accounts.name,
                                        fund_accounts.id AS fundAccountId,
                                        cash_in,
                                        cash_out
                                    FROM
                                        fund_transactions
                                            LEFT JOIN
                                        fund_accounts ON fund_transactions.account_id = fund_accounts.id
                                    WHERE_CLAUSE
                                    ORDER_CLAUSE
                                    LIMIT_OFFSET_CLAUSE`,
    CATEGORY_LIST: `SELECT DISTINCT category from fund_transactions`,
    OPENING_BALANCE: `SELECT SUM(cash_in-cash_out) AS opening_balance from fund_transactions WHERE user_id = ? AND transaction_date < ? AND deleted = 0`,
    CLOSING_BALANCE: `SELECT SUM(cash_in-cash_out) AS closing_balance from fund_transactions WHERE user_id = ? AND transaction_date < ? AND deleted = 0`,
    CASH_IN_OUT_TOTALS: `SELECT SUM(cash_in) AS total_cash_in, SUM(cash_out) AS total_cash_out from fund_transactions WHERE user_id = ? AND (transaction_date BETWEEN ? AND ?) AND deleted = 0`,
    DELETE_TRANSACTIONS: `DELETE FROM fund_transactions WHERE id IN (?) AND user_id=?`,
    TEMP_TABLE_LOCK_STATUS: `SELECT is_locked FROM temporary_table_manager WHERE_CLAUSE`,
    SET_TEMP_TABLE_LOCK_STATUS: `UPDATE temporary_table_manager SET is_locked=? WHERE_CLAUSE`,
    TRANSACTION_LIST_V2: `SELECT 
                            fund_accounts.name AS fund_house_name,
                            FUND_TRNS_TBL_NAME.*
                        FROM
                            FUND_TRNS_TBL_NAME
                                LEFT JOIN
                            fund_accounts ON FUND_TRNS_TBL_NAME.account_id = fund_accounts.id
                        WHERE_CLAUSE
                        ORDER_CLAUSE
                        LIMIT_OFFSET_CLAUSE`,
}