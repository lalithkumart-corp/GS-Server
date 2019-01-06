'use strict';
let utils = require('../utils/commonUtils');

module.exports = function(Pledgebook) {

    Pledgebook.addRecordHandler = async (access_token, params, cb) => {
        try {
            let userId = await utils.getStoreUserId(access_token);
            let pledgebookTableName = await Pledgebook.getPledgebookTableName(userId);
            params.picture.id = await Pledgebook.app.models.Image.handleImage(params.picture); //Save customer picture in Image table
            params.customerId = await Pledgebook.app.models.Customer.handleCustomerData(params, userId); //Save customer information in Customer Table
            await Pledgebook.saveBillDetails(params, pledgebookTableName); //Save ImageId, CustomerID, ORNAMENT and other Bill details in Pledgebook
            await Pledgebook.app.models.PledgebookSettings.updateLastBillDetail(params, userId);
            return {STATUS: 'success', STATUS_MSG: 'Successfully inserted new bill'};
        } catch(e) {
            return {STATUS: 'error', ERROR: e};
        }        
    }

    Pledgebook.remoteMethod('addRecordHandler', {
        accepts: [
            {
                arg: 'access_token',
                type: 'string'
            },{
                arg: 'params',
                type: 'object',
                default: {
                    
                },
                http: {
                    source: 'body',
                },
            }],
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

    Pledgebook.saveBillDetails = (params, pledgebookTableName) => {
        return new Promise( (resolve, reject) => {
            let billNo = params.billNo;
            if(params.billSeries !== "")
                billNo = params.billSeries + "." + billNo;
            // let dbInputValues = {
            //     UniqueIdentifier: (+ new Date()),
            //     BillNo: billNo,
            //     Amount: params.amount,
            //     Date: params.date,
            //     CustomerId: params.customerId,
            //     Orn: params.orn,
            //     ImageId: params.picture.id,
            //     Remarks: params.billRemarks,
            //     CreatedDate: new Date().toISOString().replace('T', ' ').slice(0,23),
            //     ModifiedDate: new Date().toISOString().replace('T', ' ').slice(0,23),
            // };
            let dbInputValues = [
                (+ new Date()),
                billNo,
                params.amount,
                params.date,
                params.customerId,                
                params.picture.id,
                JSON.stringify(params.orn),
                params.billRemarks,
                new Date().toISOString().replace('T', ' ').slice(0,23),
                new Date().toISOString().replace('T', ' ').slice(0,23),
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

    Pledgebook.getPendingBills = (accessToken, params, cb) => {
        Pledgebook.getPendingBillsHandler(accessToken, params)
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

    Pledgebook.remoteMethod('getPendingBills', {
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

    Pledgebook.getPendingBillsHandler = (accessToken, params) => {
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

    Pledgebook.getPledgebookTableName = async (userId) => {        
        let tableName = 'Pledgebook_' + userId;
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
                                CreatedDate, ModifiedDate) 
                            VALUES
                                (?, ?,
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
};

// let sql = {
//     GetPendingBills: `SELECT 
//                     *, pledgebook.Id AS PledgeBookID, image.ID AS ImageTableID
//                 FROM
//                     pledgebook
//                         LEFT JOIN
//                     customer ON pledgebook.CustomerId = customer.CustomerId
//                         LEFT JOIN
//                     image ON pledgebook.ImageId = image.Id
//                 ORDER BY PledgeBookID DESC
//                 LIMIT ? , ?`
// }