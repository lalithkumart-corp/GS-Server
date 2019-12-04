'use strict';
let _ = require('lodash');
let sh = require('shorthash');
let utils = require('../utils/commonUtils');
let app = require('../server.js');

module.exports = function(Customer) {

    Customer.getMetaData = async (accessToken, identifiers, params, cb) => {
        let metaData = {};
        Customer.metaData = null;
        let userId = await utils.getStoreUserId(accessToken);
        for(let identifier of identifiers) {
            switch(identifier) {
                case 'all':
                    let allData = await Customer._getMetaDataFromDB('all', userId, params);
                    metaData.customers = {
                        list: allData.results,
                        count: allData.totalCount
                    };
                    break;
                case 'customerNames':
                    let customerNames = await Customer._getMetaDataFromDB('name', userId, params);
                    metaData.customerNames = customerNames.results;
                    break;
                case 'guardianNames':
                    let guardianNames = await Customer._getMetaDataFromDB('gaurdianName', userId, params);
                    metaData.guardianNames = guardianNames.results;
                    break;
                case 'address':
                    let address = await Customer._getMetaDataFromDB('address', userId, params);
                    metaData.address = address.results;
                    break;
                case 'place':
                    let place = await Customer._getMetaDataFromDB('place', userId, params);
                    metaData.place = place.results;
                    break;
                case 'city':
                    let city = await Customer._getMetaDataFromDB('city', userId, params);
                    metaData.city = city.results;
                    break;
                case 'mobile':
                    let mobile = await Customer._getMetaDataFromDB('mobile', userId, params);
                    metaData.mobile = mobile.results;
                    break;                
                case 'pincode':
                    let pincode = await Customer._getMetaDataFromDB('pincode', userId, params);
                    metaData.pincode = pincode.results;
                    break;
                case 'otherDetails':
                    let otherDetails = await Customer._getMetaDataFromDB('otherDetails', userId, params);
                    metaData.otherDetails = otherDetails;
                    break;
            }
        }
        return metaData;
    }

    Customer.remoteMethod('getMetaData', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    var req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    return access_token;
                },
                description: 'Arguments goes here',
            },{
                arg: 'identifiers', type: 'array', http: (ctx) => {
                    var req = ctx && ctx.req;
                    let identifiers = req && req.query.identifiers;
                    identifiers = identifiers ? JSON.parse(identifiers) : undefined;
                    return identifiers;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'params', type: 'object', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let offsetStart = req && req.query.offsetStart || 0;
                    let limit = req && req.query.limit || null;
                    let filters = req.query.filters || null;
                    let cname = null;
                    let fgname = null;
                    let hashKey = null;
                    if(filters) {
                        filters = JSON.parse(filters);
                        cname = filters.cname || null;
                        fgname = filters.fgname || null;
                        hashKey = filters.hashKey || null;
                    }
                    
                    return {
                        start: offsetStart,
                        limit: limit,
                        cname: cname,
                        fgname: fgname,
                        hashKey: hashKey
                    }
                }
            }, {
                arg: 'filters', type: 'object'
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/metadata', verb: 'get'},
        description: 'For fetching metadata from Customer Data.',
    });

    Customer.handleCustomerData = async (params) => {
        //TODO: Valide the input arguments
        let hashKey = Customer.generateHashKey(params);
        let customerData = await Customer.isAlreadyExists(hashKey);
        if(!customerData) {            
            params.hashKey = hashKey;
            customerData = await Customer.saveCustomerData(params);
        } else {
            // Customer Info should be updated from 'Customer Detail -> General Info" UI page
           // await Customer.checkForCustomerDataUpdate(customerData, params);  
        }
        return {
            customerId: customerData.customerId,
            record: customerData
        }
    }

    Customer.saveCustomerData = (params) => {
        return new Promise( (resolve, reject) => {
            let userId = params._userId;
            let dbInputValues = {
                userId: userId,
                hashKey: params.hashKey,
                name: params.cname,
                imageId: (params.userPicture)?(params.userPicture.id):null,
                gaurdianName: params.gaurdianName,
                address: params.address,
                place: params.place,
                city: params.city,
                pincode: params.pinCode || null,
                mobile: params.mobile || null,
                otherDetails: params.moreDetails,
                createdAt: new Date(),
                modifiedAt: new Date()
            }
            Customer.create(dbInputValues, (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        });
    }

    Customer._getMetaDataFromDB = (identifier, userId, params) => {
        return new Promise( (resolve, reject) => {
            // let dataSource = Customer.dataSource;
            if(identifier == 'otherDetails') {
                Customer.app.models.customerMetadataList.getList(userId, params)
                .then(
                    (success) => {
                        let bucket = [];
                        _.each(success, (anItem, index) => {
                            bucket.push(anItem);
                        });
                        return resolve(bucket);
                    },
                    (err) => {
                        return reject(err);
                    }
                )
            } else {
                if(Customer.metaData) {
                    let bucket = [];
                    _.each(Customer.metaData, (anItem, index) => {
                        if(identifier == 'all')
                            bucket.push(anItem);
                        else
                            bucket.push(anItem[identifier]);
                    });
                    return resolve(bucket);
                }                

                let promise1 = new Promise( (resolve, reject) => {
                    Customer.dataSource.connector.query(Customer.getQuery('all', {userId: userId, ...params}), (err, result) => {                
                        if(err) {
                            return reject(err);
                        } else {
                            Customer.metaData = Customer.parseMetaData(result);
                            let bucket = [];
                            _.each(result, (anItem, index) => {
                                if(identifier == 'all')
                                    bucket.push(anItem);
                                else
                                    bucket.push(anItem[identifier]);
                            });
                            return resolve(bucket);
                        }
                    });
                });

                let promise2 = new Promise( (resolve, reject) => {
                    Customer.dataSource.connector.query(Customer.getQuery('countQuery', {userId: userId, ...params}), (err, res) => {
                        if(err) {
                            return reject(err);
                        } else {
                            return resolve(res[0].count);
                        }
                    });
                });

                Promise.all([promise1, promise2])
                    .then(
                        (results) => {
                            let obj = {
                                results: results[0],
                                totalCount: results[1]
                            }
                            resolve(obj);
                        },
                        (errors) => {
                            console.log(errors);
                            reject(errors);
                        }
                    )
                    .catch(
                        (e) => {
                            console.log(e);
                            reject(e);
                        }
                    )

                /* dataSource.connector.query(sql[identifier], [], (err, list) => {
                    if (err){                    
                        reject(err);
                    } else {                    
                        let bucket = [];
                        _.each(list, (anItem, index) => {
                            bucket.push(anItem[identifier]);
                        });
                        resolve(bucket);
                    }
                }); */
            }
        });
    }

    Customer.parseMetaData = (rawResult) => {
        _.each(rawResult, (aRes, index) => {
            if(aRes.userImagePath)
                aRes.userImagePath = `http://${app.get('domain')}:${app.get('port')}${aRes.userImagePath.replace('client', '')}`;
                aRes.mobile = ''+aRes.mobile;
                aRes.pincode = ''+aRes.pincode;
        });
        return rawResult;
    }

    Customer.getQuery = (identifier, params) => {
        let sql = '';
        let whereCondition = '';
        switch(identifier) {
            case 'all':
                whereCondition = Customer._getWhereCondition(params);
                sql = `SELECT 
                            customer.CustomerId AS customerId,
                            customer.UserId AS userId,
                            customer.Name AS name,
                            customer.GaurdianName AS gaurdianName,
                            customer.Address AS address,
                            customer.Place AS place,
                            customer.City AS city,
                            customer.Pincode AS pincode,
                            customer.Mobile AS mobile,
                            customer.HashKey AS hashKey,
                            customer.OtherDetails AS otherDetails,
                            image.Id AS imageTableId,
                            image.Path AS userImagePath,
                            image.Format AS userImageFormat,
                            image.Optional AS userImageOptionals,
                            image.StorageMode AS userImageStorageMode
                        FROM customer
                            LEFT JOIN 
                        image ON customer.ImageId = image.Id
                           ${whereCondition}
                        ORDER BY customer.Name ASC`;
                    if(params.limit)
                        sql += ` LIMIT ${params.limit}`;
                    if(params.start)
                        sql += ` OFFSET ${params.start}`;
                break;
            case 'countQuery': 
                whereCondition = Customer._getWhereCondition(params);
                sql = `SELECT
                            COUNT(*) AS count
                        FROM customer
                            LEFT JOIN 
                        image ON customer.ImageId = image.Id
                            ${whereCondition}`;
                break;
        }
        return sql;
    }

    Customer._getWhereCondition = (params) => {
        let whereCondition = '';
        let filters = [];
        if(params.userId)
            filters.push(`customer.UserId=${params.userId}`);
        if(params.cname)
            filters.push(`customer.Name LIKE '${params.cname}%'`);
        if(params.fgname)
            filters.push(`customer.GaurdianName LIKE '${params.fgname}%'`);
        if(params.hashKey)
            filters.push(`customer.HashKey = '${params.hashKey}'`);
        if(filters.length)
            whereCondition = ` WHERE ${filters.join(' AND ')}`;
        return whereCondition;
    }

    Customer.generateHashKey = (params) => {
        let cname = (params.cname)?params.cname.toLowerCase():params.cname;
        let gaurdianName = (params.gaurdianName)?params.gaurdianName.toLowerCase():params.gaurdianName;
        let address = (params.address)?params.address.toLowerCase():params.address;
        let place = (params.place)?params.place.toLowerCase():params.place;
        let city = (params.city)?params.city.toLowerCase():params.city;
        let pincode = (params.pincode)?params.pincode.toLowerCase():params.pincode;        

        return sh.unique( cname + gaurdianName + address + place + city + pincode)        
    }

    Customer.isAlreadyExists = (hashKey) => {
        return new Promise( (resolve, reject) => {
            Customer.findOne({where: {hashKey: hashKey}}, (err, result) => {
                if(err) {
                    //TODO: Log the error
                    reject(err);
                } else {
                    if(result)
                        resolve(result);
                    else
                        resolve(false);
                }
            });
        });
    }

    Customer.checkForCustomerDataUpdate = async (dbCustomerData, params) => {
        // No Need to update the "Other Details" section. The "Other Details" data shoud be updated only from the "Customer Detail -> Notes" UI page.
        /*return new Promise( (resolve, reject) => {
            let otherDetailsDB = dbCustomerData.otherDetails;
            let incomingOtherDetails = params.moreDetails;
            let changes = false;
            _.each(incomingOtherDetails, (anObj, index) => {
                let matchFound = false;
                _.each(otherDetailsDB, (innerObj, key) => {
                    if(innerObj.key == anObj.key) {
                        matchFound = true;
                        changes = true;
                        innerObj.val = anObj.val;
                    }
                });
                if(!matchFound) {
                    changes = true;
                    otherDetailsDB.push(anObj);
                }
            });
            if(changes) {
                Customer.updateAll({customerId: dbCustomerData.customerId}, {otherDetails: otherDetailsDB}, (err, result) => {
                    if(err) {
                        return reject(err);
                    } else {    
                        return resolve(err);
                    }
                });
            } else {
                return resolve();
            }
        });*/    
    }

    Customer.updateCustomerAPIHandler = async (customerDetail) => {
        try{                        
            customerDetail.picture.id = customerDetail.picture.imageId || null;
            await Customer.updateDetails(customerDetail);
            return {STATUS: 'SUCCESS', MSG: 'Updated the Customer detail successfully'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Customer.remoteMethod('updateCustomerAPIHandler', {
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
        http: {path: '/update-customer-detail', verb: 'post'},
        description: 'Updated the customer general information'
    });  

    Customer.updateDetails = async (params) => {
        try{
            //TODO: DELETE the existing image
            let response = await Customer.updateAll({customerId: params.customerId}, {name: params.cname, imageId: params.picture.id, gaurdianName: params.gaurdianName, address: params.address, place: params.place, city: params.city, mobile: params.mobile, secMobile: params.secMobile, pincode: params.pinCode, otherDetails: params.otherDetails});
            return response;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }
};

let sql = {
    Name: `SELECT DISTINCT Name from customer`,
    GaurdianName: `SELECT DISTINCT GaurdianName FROM customer`,
    Address: `SELECT DISTINCT Address FROM customer`,
    Place: `SELECT DISTINCT Place FROM customer`,
    City: `SELECT DISTINCT City FROM customer`,
    Mobile: `SELECT DISTINCT Mobile FROM customer`,
    Pincode: `SELECT DISTINCT Pincode FROM customer`,
    OtherDetails: `` //TODO:
}
