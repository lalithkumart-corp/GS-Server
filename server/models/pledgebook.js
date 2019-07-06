'use strict';
let utils = require('../utils/commonUtils');
let app = require('../server.js');
let _ = require('lodash');

module.exports = function(Pledgebook) {

    Pledgebook.remoteMethod('insertNewBillAPIHandler', {
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
        http: {path: '/add-new-billrecord', verb: 'post'},
        description: 'Adding a new record in pledgebook'
    });

    Pledgebook.remoteMethod('updateBillAPIHandler', {
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
        http: {path: '/update-billrecord', verb: 'post'},
        description: 'Updating the existing bill in pledgebook'
    });

    Pledgebook.getPendingBillsAPIHandler = (accessToken, params, cb) => {
        Pledgebook.getPendingBills(accessToken, params)
            .then(
                (success) => {
                    _.each(success.results, (aRec, index) => {
                        if(aRec.OrnImagePath)
                            aRec.OrnImagePath = `http://${app.get('domain')}:${app.get('port')}${aRec.OrnImagePath.replace('client', '')}`;
                        if(aRec.UserImagePath)
                            aRec.UserImagePath = `http://${app.get('domain')}:${app.get('port')}${aRec.UserImagePath.replace('client', '')}`;
                    });
                    cb(null, success);
                },
                (error) => {
                    cb(error, null);
                }
            )
            .catch(
                (exception) => {
                    cb(exception, null);
                }
            )        
    };    

    Pledgebook.remoteMethod('getPendingBillsAPIHandler', {
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
        http: {path: '/get-pending-bills', verb: 'get'},
        description: 'For fetching pending bills.',
    });

    Pledgebook.remoteMethod('redeemPendingBillAPIHandler', {
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
        http: {path: '/redeem-pending-bills', verb: 'post'},
        description: 'Updating bill in pledgebook'
    });

    Pledgebook.remoteMethod('reOpenClosedBillsAPIHandler', {
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
        http: {path: '/re-open-closed-bills', verb: 'post'},
        description: 'Re-opening a closed bill in pledgebook'
    });    

    Pledgebook.remoteMethod('getPendingBillNosAPIHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
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
        http: {path: '/get-pending-bill-nos', verb: 'get'},
        description: 'For fetching pending bills Numbers.',
    });

    Pledgebook.remoteMethod('getBillDetailsAPIHandler', {
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
                arg: 'billNoArray', type: 'array', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let billNoArray = req && req.query.bill_nos;
                    return JSON.parse(billNoArray);
                },
                description: 'For fetching the bill data based on bill Number'
            },
        {
            arg: 'fetchOnlyPending', type: 'string', http: (ctx) => {
                let req = ctx && ctx.req;
                let fetchOnlyPending = req && req.query.fetch_only_pending;
                if(typeof fetchOnlyPending == 'undefined')
                    fetchOnlyPending = false;
                return fetchOnlyPending;
            },
            description: 'Fetch bill only if its in pending state'
        }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/get-bill-details', verb: 'get'},
        description: 'For fetching bill data.',
    });

    Pledgebook.remoteMethod('fetchUserHistoryAPIHandler', {
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

    Pledgebook.insertNewBillAPIHandler = async (data, cb) => {
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            let parsedArg = Pledgebook.parseInputData(params);            
            parsedArg._userId = await utils.getStoreUserId(params.accessToken);
            let pledgebookTableName = await Pledgebook.getPledgebookTableName(parsedArg._userId);
            let validation = await Pledgebook.doValidation(parsedArg, pledgebookTableName);
            if(validation.status) {
                parsedArg.userPicture.id = parsedArg.userPicture.imageId;
                parsedArg.ornPicture.id = parsedArg.ornPicture.imageId;
                parsedArg.customerId = await Pledgebook.app.models.Customer.handleCustomerData(parsedArg); //Save customer information in Customer Table
                await Pledgebook.saveBillDetails(parsedArg, pledgebookTableName); //Save ImageId, CustomerID, ORNAMENT and other Bill details in Pledgebook
                await Pledgebook.app.models.PledgebookSettings.updateLastBillDetail(parsedArg);
                return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully inserted new bill'};
            } else {
                throw validation.errors;
            }
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }        
    }    

    Pledgebook.saveBillDetails = (params, pledgebookTableName) => {
        return new Promise( (resolve, reject) => {
            let dbInputValues = [
                params.uniqueIdentifier,
                params.billNoWithSeries,
                params.amount,
                params.date,
                params.customerId,
                params.orn,
                params.billRemarks,
                params.ornPicture.id,
                1,
                JSON.stringify({}),                
                params.createdDate,
                params.modifiedDate,
            ];
            let query = Pledgebook.getQuery('insert', dbInputValues, pledgebookTableName);
            Pledgebook.dataSource.connector.query(query, dbInputValues, (err, result) => {
                if(err) {
                    reject ( err );
                } else {
                    resolve( result );
                }
            });
        });        
    }

    Pledgebook.getPendingBills = (accessToken, params) => {
        return new Promise( async (resolve, reject) => {
            let queryValues = [params.offsetStart, params.offsetEnd];
            let userId = await utils.getStoreUserId(accessToken);
            let pledgebookTableName = await Pledgebook.getPledgebookTableName(userId);
            
            let query = Pledgebook.getQuery('normal', params, pledgebookTableName);            
            let promise1 = new Promise((resolve, reject) => {
                Pledgebook.dataSource.connector.query(query, queryValues, (err, result) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });


            let countQuery = Pledgebook.getQuery('countQuery', params, pledgebookTableName);
            let promise2 = new Promise((resolve, reject) => {
                Pledgebook.dataSource.connector.query(countQuery, queryValues, (err, result) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            Promise.all([promise1, promise2])
                .then(
                    (results) => {
                        let obj = {
                            results: results[0],
                            totalCount: results[1][0]['count']
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

    Pledgebook.redeemPendingBillAPIHandler = async (data) => {
        try {
            let params = {
                data: data.requestParams
            };
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            params._userId = await utils.getStoreUserId(params.accessToken);
            params._pledgebookTableName = await Pledgebook.getPledgebookTableName(params._userId);
            params._pledgebookClosedBillTableName = await Pledgebook.getPledgebookClosedTableName(params._userId);
            params._status = 0;
            await Pledgebook.updatePledgebookBillStatus(params);
            return {STATUS: 'success', RESPONSE: {}, STATUS_MSG: ''};
        } catch(e) {
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Pledgebook.updatePledgebookBillStatus = (params) => {
        return new Promise( (resolve, reject) => {
            let query = Pledgebook.getQuery('redeem-status-update', params, params._pledgebookTableName);
            Pledgebook.dataSource.connector.query(query, async (err, result) => {
                if (err) {
                    return reject(err);
                } else {
                    if(result.affectedRows > 0) {
                       await Pledgebook._insertRowInClosedBillList(params);
                        return resolve(true);
                    } else {
                        return reject({msg: 'Not Updated'});
                    }
                }
            });
        });        
    }    

    Pledgebook._insertRowInClosedBillList = (params) => {
        return new Promise( (resolve, reject) => {
            /*let dbInputValues = [];
            for(let i=0; i<params.data.length; i++) {
                let aRowObj = params.data[i];
                dbInputValues.push(aRowObj.pledgeBookUID, aRowObj.billNo, aRowObj.pledgedDate, aRowObj.closedDate,
                    aRowObj.principalAmt, aRowObj.noOfMonth, aRowObj.roi, aRowObj.interestPerMonth,
                    aRowObj.interestValue, aRowObj.estimatedAmount, aRowObj.discountValue, aRowObj.paidAmount,
                    aRowObj.handedTo);
            } */           
            let query = Pledgebook.getQuery('redeem-insert', params, params._pledgebookClosedBillTableName);            
            Pledgebook.dataSource.connector.query(query, (err, result) => {
                if(err) {
                    return reject(err);                    
                } else {
                    if(result.affectedRows > 0)                        
                        return resolve(true);                    
                    else
                        return reject({msg: 'Not insertedd record in Bill closed list table'});
                }
            });
        });
    }

    Pledgebook.reOpenBill = (params) => {
        return new Promise( (resolve, reject) => {
            let query = Pledgebook.getQuery('redeem-status-update', params, params._pledgebookTableName);
            Pledgebook.dataSource.connector.query(query, async (err, result) => {
                if (err) {
                    return reject(err);
                } else {
                    if(result.affectedRows > 0) {
                        let query = Pledgebook.getQuery('reopen-bill', params, params._pledgebookClosedBillTableName);
                        Pledgebook.dataSource.connector.query(query, (err, result) => {
                            if(err) {
                                return reject(err);
                            } else {
                                if(result.affectedRows > 0)
                                    return resolve(true);
                                else
                                    return reject({msg: 'Not removed the record from Bill closed list table'});
                            }
                        });                        
                    } else {
                        return reject({msg: 'Not Updated'});
                    }
                }
            });
        });
    }

    Pledgebook.getPledgebookTableName = async (userId) => {
        let tableName = app.get('pledgebookTableName')+ '_' + userId;
        return tableName;
    }

    Pledgebook.getPledgebookClosedTableName = async (userId) => {
        let tableName = app.get('pledgebookClosedBillListTableName')+ '_' + userId;
        return tableName;
    }

    Pledgebook.getQuery = (queryIdentifier, params, pledgebookTableName) => {
        let query = '';
        switch(queryIdentifier) {
            case 'insert':
                query = `INSERT INTO 
                            ${pledgebookTableName} 
                                (UniqueIdentifier, BillNo, 
                                Amount, Date, 
                                CustomerId, 
                                Orn, Remarks, 
                                OrnPictureId,
                                Status, History,                                
                                CreatedDate, ModifiedDate) 
                            VALUES
                                (?, ?,
                                ?, ?, 
                                ?, 
                                ?, ?, 
                                ?,
                                ?, ?,                                 
                                ?, ?);`
                break;
            case 'normal':
                query = `SELECT                         
                                *,                        
                                ${pledgebookTableName}.Id AS PledgeBookID,
                                image.Id AS ImageTableID,
                                image.Image AS UserImageBlob,
                                orn_images.Id AS OrnImageTableID,
                                image.Path AS UserImagePath,
                                image.Format AS UserImageFormat,
                                orn_images.Image AS OrnImageBlob,
                                orn_images.Path AS OrnImagePath,
                                orn_images.Format AS OrnImageFormat
                            FROM
                                ${pledgebookTableName}
                                    LEFT JOIN
                                customer ON ${pledgebookTableName}.CustomerId = customer.CustomerId
                                    LEFT JOIN
                                image ON customer.ImageId = image.Id
                                    LEFT JOIN
                                orn_images ON ${pledgebookTableName}.OrnPictureId = orn_images.Id`;
                
                query = Pledgebook.appendFilters(params, query);
                
                query += ` ORDER BY PledgeBookID DESC`;
                query += ` LIMIT ? , ?`;
                break;
            case 'countQuery':
                query = `SELECT                         
                            COUNT(*) AS count
                        FROM
                            ${pledgebookTableName}
                                LEFT JOIN
                            customer ON ${pledgebookTableName}.CustomerId = customer.CustomerId
                                LEFT JOIN
                            image ON customer.ImageId = image.Id`;
                query = Pledgebook.appendFilters(params, query);
                break;
            case 'byCustomerId':
                query = `SELECT                         
                            *,                        
                            ${pledgebookTableName}.Id AS PledgeBookID                           
                        FROM
                            ${pledgebookTableName}
                                LEFT JOIN
                            customer ON ${pledgebookTableName}.CustomerId = customer.CustomerId                              
                        WHERE
                            ${pledgebookTableName}.CustomerId = ?`;

                query += ` ORDER BY PledgeBookID DESC`;                
                break;
            case 'billAlreadyExist':
                query = `SELECT 
                            *
                        FROM
                            ${pledgebookTableName}
                        WHERE
                            BillNo = ?;`
                break;
            case 'redeem-status-update':
            /* UPDATE gs.pledgebook_4
                        SET Status = CASE BillNo 
                                            WHEN 'K.1' THEN 0 
                                            WHEN 'K.2' THEN 0 
                                            ELSE Status
                                            END
                        WHERE BillNo IN('K.1', 'K.2'); */
                if(params.data.length == 1) {
                    query = `UPDATE ${pledgebookTableName} SET Status= ${params._status} WHERE Id = ${params.data[0].pledgeBookID}`; 
                } else {
                    query = `SET SQL_SAFE_UPDATES = 0;`;
                    for(let i=0; i<params.data.length; i++) {
                        query += `UPDATE ${pledgebookTableName} SET STATUS = ${params._status} WHERE Id = '${params.data[i].pledgeBookID}'`;
                    }
                    query += `SET SQL_SAFE_UPDATES = 1;`;

                    /*
                    query = `UPDATE ${pledgebookTableName} SET STATUS = CASE Id`;
                    for(let i=0; i<params.ids.length; i++) {
                        query += ` WHEN '${params.ids[i]}' THEN 0`;
                    }
                    query += ` ELSE Status 
                            END
                            WHERE Id IN (${params.ids.join(', ')})`;
                    */
                }
                break;
            case 'redeem-insert':
                query = ''; //`SET SQL_SAFE_UPDATES = 0;`;
                for(let i=0; i<params.data.length; i++) {
                    let aRowObj = params.data[i];
                    query += `INSERT INTO 
                                ${pledgebookTableName} 
                                    (pledgebook_uid, bill_no, 
                                    pledged_date, closed_date, 
                                    principal_amt, no_of_month, 
                                    rate_of_interest, int_rupee_per_month, 
                                    interest_amt, actual_estimated_amt, 
                                    discount_amt, paid_amt, 
                                    handed_over_to_person) 
                                VALUES ('${aRowObj.pledgeBookUID}', '${aRowObj.billNo}', '${aRowObj.pledgedDate}', '${aRowObj.closedDate}',
                                    '${aRowObj.principalAmt}', '${aRowObj.noOfMonth}', '${aRowObj.roi}', '${aRowObj.interestPerMonth}',
                                    '${aRowObj.interestValue}', '${aRowObj.estimatedAmount}', '${aRowObj.discountValue}', '${aRowObj.paidAmount}',
                                    '${aRowObj.handedTo}');`;
                }
                //query += `SET SQL_SAFE_UPDATES = 1;`;
                break;
            case 'reopen-bill':
                query = ''; //`SET SQL_SAFE_UPDATES = 0;`;
                for(let i=0; i<params.data.length; i++) {
                    let aRowObj = params.data[i];
                    query += `DELETE FROM ${pledgebookTableName} WHERE pledgebook_uid='${aRowObj.pledgeBookUID}';`;
                }
                //query += `SET SQL_SAFE_UPDATES = 1;`;
                break;
            case 'pendingBillNumbers':
                query = `SELECT BillNo from ${pledgebookTableName} where Status=1`;
                break;
            case 'billDetails':                
                query = `SELECT                         
                            *,
                            ${pledgebookTableName}.Id AS PledgeBookID,
                            image.Id AS ImageTableID,
                            image.Image AS UserImageBlob,
                            orn_images.Id AS OrnImageTableID,
                            image.Path AS UserImagePath,
                            image.Format AS UserImageFormat,
                            orn_images.Image AS OrnImageBlob,
                            orn_images.Path AS OrnImagePath,
                            orn_images.Format AS OrnImageFormat

                        FROM
                            ${pledgebookTableName}
                                LEFT JOIN
                            customer ON ${pledgebookTableName}.CustomerId = customer.CustomerId
                                LEFT JOIN
                            image ON customer.ImageId = image.Id
                                LEFT JOIN
                            orn_images ON ${pledgebookTableName}.OrnPictureId = orn_images.Id
                        WHERE `;
                let filterPart = [];
                for(let i=0; i<params.length; i++) {
                    filterPart.push(`BillNo="${params[i]}"`);
                }
                query += filterPart.join(' OR ');                
                break;
            case 'update-bill':
                query = `UPDATE
                            ${pledgebookTableName}
                                SET
                            BillNo=?,
                            Amount=?,
                            Date=?,
                            CustomerId=?,
                            Orn=?,
                            Remarks=?,                            
                            OrnPictureId=?,
                            ModifiedDate=?
                                WHERE
                            UniqueIdentifier=?`;
                break;
        }
        return query;
    }

    Pledgebook.appendFilters = (params, query) => {
        let filterQueries = [];
        if(params.filters) {
            if(params.filters.billNo !== "")
                filterQueries.push(`BillNo like '${params.filters.billNo}%'`);
            if(params.filters.amount !== "")
                filterQueries.push(`amount >= ${params.filters.amount}`);
            if(params.filters.cName !== "")
                filterQueries.push(`Name like '${params.filters.cName}%'`);
            if(params.filters.gName !== "")
                filterQueries.push(`GaurdianName like '${params.filters.gName}%'`);
            if(params.filters.address !== "")
                filterQueries.push(`Address like '%${params.filters.address}%'`);
            if(params.filters.include == 'pending')
                filterQueries.push(`Status=1`);
            else if(params.filters.include == 'closed')
                filterQueries.push(`Status=0`);
            if(params.filters.date)
                filterQueries.push(`Date between '${params.filters.date.startDate}' and '${params.filters.date.endDate}'`);            
            if(filterQueries.length != 0)
                query += ' where ' + filterQueries.join(' AND ');
        }
        return query;
    }

    Pledgebook.parseInputData = (params = {}) => {
        let parsedArg = JSON.parse(JSON.stringify(params));
        let billNo = params.billNo;
        if(params.billSeries !== "")
            billNo = params.billSeries + "." + billNo;
        parsedArg.accessToken = params.accessToken;
        parsedArg.billNoWithSeries = billNo;
        parsedArg.uniqueIdentifier= (+ new Date());
        parsedArg.orn = JSON.stringify(params.orn);
        parsedArg.createdDate = new Date().toISOString().replace('T', ' ').slice(0,23);
        parsedArg.modifiedDate= new Date().toISOString().replace('T', ' ').slice(0,23);
        return parsedArg;
    }

    Pledgebook.parseInputDataForUpdate = (params = {}) => {
        let parsedArg = JSON.parse(JSON.stringify(params));
        let billNo = params.billNo;
        if(params.billSeries !== "")
            billNo = params.billSeries + "." + billNo;
        parsedArg.accessToken = params.accessToken;
        parsedArg.billNoWithSeries = billNo;
        parsedArg.orn = JSON.stringify(params.orn);
        parsedArg.modifiedDate= new Date().toISOString().replace('T', ' ').slice(0,23);
        return parsedArg;
    }

    Pledgebook.doValidation = (params, pledgebookTableName) => {
        return new Promise( async (resolve, reject) => {
            let userId = params._userId
            let returnVal = {
                status: 1,
                errors: []
            }
            const insertError = (error) => {
                returnVal.status = 0;
                returnVal.errors.push(error);
            }
            try{
                if(params.billNo) {
                    let isAlreadyExist = await Pledgebook._isBillNoAlreadyExist(userId, params.billNoWithSeries, pledgebookTableName);
                    if(isAlreadyExist)
                        insertError('Bill Number already Exists');
                } else {
                    insertError('Bill Number is missing');
                }                
            } catch(e) {
                insertError(e);
            } finally {
                resolve(returnVal);
            }
        });        
    }

    Pledgebook._isBillNoAlreadyExist = (userId, billNoWithSeries, pledgebookTableName) => {
        return new Promise( (resolve, reject) => {
            let query = Pledgebook.getQuery('billAlreadyExist', {}, pledgebookTableName);
            Pledgebook.dataSource.connector.query(query, [billNoWithSeries], (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    if(result.length > 0)
                        resolve(true);
                    else
                        resolve(false);
                }
            });
        });
    }

    Pledgebook.getPendingBillNosAPIHandler = async (accessToken, cb) => {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let list = await Pledgebook._getPendingBillNumbers(accessToken);
            return {STATUS: 'SUCCESS', list};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }
    Pledgebook._getPendingBillNumbers = (accessToken) => {
        return new Promise( async (resolve, reject) => {
            let _userId = await utils.getStoreUserId(accessToken);
            let pledgebookTableName = await Pledgebook.getPledgebookTableName(_userId);
            let query = Pledgebook.getQuery('pendingBillNumbers', {}, pledgebookTableName);
            Pledgebook.dataSource.connector.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    let theBuffer = [];
                    _.each(result, (anResultItem, index) => {
                        theBuffer.push(anResultItem.BillNo);
                    });
                    resolve(theBuffer);
                }                    
            });
        });
    }

    Pledgebook.getBillDetailsAPIHandler = async (accessToken, billNoArray, fetchOnlyPending, cb) => {
        try {            
            if(!accessToken)
                throw 'Access Token is missing';
            let billDetails = await Pledgebook._getBillDetails(accessToken, billNoArray, fetchOnlyPending);
            return {STATUS: 'SUCCESS', billDetails};
        } catch(e) {
            return { STATUS: 'ERROR', MESSAGE: e}
        }
    }

    Pledgebook._getBillDetails = (accessToken, billNoArray, fetchOnlyPending) => {
        return new Promise ( async (resolve, reject) => {
            let _userId = await utils.getStoreUserId(accessToken);
            let pledgebookTableName = await Pledgebook.getPledgebookTableName(_userId);
            let query = Pledgebook.getQuery('billDetails', billNoArray, pledgebookTableName);
            if(fetchOnlyPending)
                query +=` AND STATUS=1`;
            Pledgebook.dataSource.connector.query(query, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });            
        });
    }

    Pledgebook.reOpenClosedBillsAPIHandler = async (data) => {
        try {
            let params = {
                data: data.requestParams
            };
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            params._userId = await utils.getStoreUserId(params.accessToken);
            params._pledgebookTableName = await Pledgebook.getPledgebookTableName(params._userId);
            params._pledgebookClosedBillTableName = await Pledgebook.getPledgebookClosedTableName(params._userId);
            params._status = 1;
            await Pledgebook.reOpenBill(params);
            return {STATUS: 'success', RESPONSE: {}, STATUS_MSG: ''};
        } catch(e) {
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Pledgebook.fetchUserHistoryAPIHandler = async (accessToken, customerId, cb) => {
        try {
            let billList = await Pledgebook.fetchHistory({accessToken: accessToken, customerId: customerId});
            return {STATUS: 'success', RESPONSE: billList, STATUS_MSG: ''};
        } catch(e) {
            return {STATUS: 'error', ERROR: e, MESSAGE: (e?e.message:'')};
        }
    }

    Pledgebook.fetchHistory = (data) => {        
        return new Promise( async (resolve, reject) => {
            data._userId = await utils.getStoreUserId(data.accessToken);
            data._pledgebookTableName = await Pledgebook.getPledgebookTableName(data._userId);
            let query = Pledgebook.getQuery('byCustomerId', data, data._pledgebookTableName);
            Pledgebook.dataSource.connector.query(query, [data.customerId], (err, result) => {
                if(err) {
                    reject(err);
                } else {                   
                    resolve(result);
                }
            });
        });
    }

    Pledgebook.updateBillAPIHandler = async (data) => {
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            let parsedArg = Pledgebook.parseInputDataForUpdate(params);            
            parsedArg._userId = await utils.getStoreUserId(params.accessToken);
            let pledgebookTableName = await Pledgebook.getPledgebookTableName(parsedArg._userId);                        
            parsedArg.ornPicture.id = parsedArg.ornPicture.imageId;
            parsedArg.customerId = await Pledgebook.app.models.Customer.handleCustomerData(parsedArg); //Save customer information in Customer Table
            await Pledgebook.updateBillDetails(parsedArg, pledgebookTableName); //Save ImageId, CustomerID, ORNAMENT and other Bill details in Pledgebook                
            return {STATUS: 'SUCCESS', STATUS_MSG: 'Successfully Updated the bill'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }        
    }

    Pledgebook.updateBillDetails = (parsedArg, pledgebookTableName) => {
        return new Promise( (resolve, reject) => {
            let sql = Pledgebook.getQuery('update-bill', parsedArg, pledgebookTableName);
            let values = [
                parsedArg.billNoWithSeries,
                parsedArg.amount,
                parsedArg.date,
                parsedArg.customerId,
                parsedArg.orn,
                parsedArg.billRemarks,
                parsedArg.ornPicture.id,
                parsedArg.modifiedDate,
                parsedArg.uniqueIdentifier
            ]
            Pledgebook.dataSource.connector.query( sql, values, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    if(result.affectedRows > 0)
                        resolve(true);
                    else
                        reject({msg: 'Not Updated'});
                }
            });
        });        
    }
};
