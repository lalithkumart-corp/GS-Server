'use strict';
let utils = require('../utils/commonUtils');
let app = require('../server.js');

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

    Pledgebook.getPendingBillsAPIHandler = (accessToken, params, cb) => {
        Pledgebook.getPendingBills(accessToken, params)
            .then(
                (success) => {
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

    Pledgebook.insertNewBillAPIHandler = async (data, cb) => {
        try {
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            let parsedArg = Pledgebook.parseInputData(params);            
            params._userId = await utils.getStoreUserId(params.accessToken);
            let pledgebookTableName = await Pledgebook.getPledgebookTableName(params._userId);
            let validation = await Pledgebook.doValidation(params._userId, parsedArg, pledgebookTableName);
            if(validation.status) {
                parsedArg.picture.id = await Pledgebook.app.models.Image.handleImage(parsedArg.picture); //Save customer picture in Image table
                parsedArg.customerId = await Pledgebook.app.models.Customer.handleCustomerData(parsedArg, params._userId); //Save customer information in Customer Table
                await Pledgebook.saveBillDetails(parsedArg, pledgebookTableName); //Save ImageId, CustomerID, ORNAMENT and other Bill details in Pledgebook
                await Pledgebook.app.models.PledgebookSettings.updateLastBillDetail(parsedArg, params._userId);
                return {STATUS: 'success', STATUS_MSG: 'Successfully inserted new bill'};
            } else {
                throw validation.errors;
            }
        } catch(e) {
            return {STATUS: 'error', ERROR: e};
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
                params.picture.id,
                params.orn,
                params.billRemarks,
                1,
                {},
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
            let params = data.requestParams;
            params.accessToken = data.accessToken;
            if(!params.accessToken)
                throw 'Access Token is missing';
            params._userId = await utils.getStoreUserId(params.accessToken);
            params._pledgebookTableName = await Pledgebook.getPledgebookTableName(params._userId);
            await Pledgebook.redeemUpdateDB(params);
            return {STATUS: 'success', RESPONSE: {}, STATUS_MSG: ''};
        } catch(e) {
            return {STATUS: 'error', ERROR: e};
        }
    }    

    Pledgebook.redeemUpdateDB = (params) => {
        return new Promise( (resolve, reject) => {
            let query = Pledgebook.getQuery('redeem', params, params._pledgebookTableName);
            Pledgebook.dataSource.connector.query(query, (err, result) => {
                if (err) {
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

    Pledgebook.getPledgebookTableName = async (userId) => {
        let tableName = app.get('pledgebookTableName')+ '_' + userId;
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
                                CustomerId, ImageId, 
                                Orn, Remarks, 
                                Status, History,
                                CreatedDate, ModifiedDate) 
                            VALUES
                                (?, ?,
                                ?, ?, 
                                ?, ?, 
                                ?, ?, 
                                ?, ?, 
                                ?, ?);`
                break;
            case 'normal':
                query = `SELECT                         
                                *,                        
                                ${pledgebookTableName}.Id AS PledgeBookID,
                                image.ID AS ImageTableID
                            FROM
                                ${pledgebookTableName}
                                    LEFT JOIN
                                customer ON ${pledgebookTableName}.CustomerId = customer.CustomerId
                                    LEFT JOIN
                                image ON ${pledgebookTableName}.ImageId = image.Id`;
                
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
                            image ON ${pledgebookTableName}.ImageId = image.Id`;
                query = Pledgebook.appendFilters(params, query);
                break;
            case 'billAlreadyExist':
                query = `SELECT 
                            *
                        FROM
                            ${pledgebookTableName}
                        WHERE
                            BillNo = ?;`
            case 'redeem':
            /* UPDATE gs.pledgebook_4
                        SET Status = CASE BillNo 
                                            WHEN 'K.1' THEN 0 
                                            WHEN 'K.2' THEN 0 
                                            ELSE Status
                                            END
                        WHERE BillNo IN('K.1', 'K.2'); */
                if(params.ids.length == 1) { //UPDATE `gs`.`pledgebook_4` SET `Status`='0' WHERE `Id`='8';
                    query = `UPDATE ${pledgebookTableName} SET Status= 0 WHERE Id = ${params.ids[0]}`; 
                } else {
                    query = `UPDATE ${pledgebookTableName} SET STATUS = CASE Id`;
                    for(let i=0; i<params.ids.length; i++) {
                        query += ` WHEN '${params.ids[i]}' THEN 0`;
                    }
                    query += ` ELSE Status 
                            END
                            WHERE Id IN (${params.ids.join(', ')})`;
                }                                 
        }
        return query;
    }

    Pledgebook.appendFilters = (params, query) => {
        let filterQueries = [];        
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
        if(params.filters.date)
            filterQueries.push(`Date between '${params.filters.date.startDate}' and '${params.filters.date.endDate}'`);
        if(filterQueries.length != 0)
            query += ' where ' + filterQueries.join(' AND ');
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

    Pledgebook.doValidation = (userId, params, pledgebookTableName) => {
        return new Promise( async (resolve, reject) => {
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
                    let isAlreadyExist = await Pledgebook.isBillNoAlreadyExist(userId, params.billNoWithSeries, pledgebookTableName);
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

    Pledgebook.isBillNoAlreadyExist = (userId, billNoWithSeries, pledgebookTableName) => {
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
};
