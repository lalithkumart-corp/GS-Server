'use strict';
let _ = require('lodash');
let sh = require('shorthash');
let utils = require('../utils/commonUtils');
let app = require('../server.js');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
module.exports = function(Customer) {

    Customer.remoteMethod('createCustomerAPIHandler', {
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
        http: {path: '/create-new', verb: 'post'},
        description: 'Create New Customer'
    });

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

    Customer.remoteMethod('fetchByCustIdApiHanlder', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let authToken = null;
                    if(req && req.headers.authorization)
                        authToken = req.headers.authorization || req.headers.Authorization;
                    return authToken;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'custIdArr', type: 'array', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let custIdArr = req && req.query.custIdArr;
                    custIdArr = custIdArr ? JSON.parse(custIdArr) : [];
                    return custIdArr;
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
        http: {path: '/fetch-by-custid', verb: 'get'},
        description: 'For fetching customer detail.',
    });

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
                    let offsetStart = 0;
                    let limit = null;
                    let filters = null;
                    let cname = null;
                    let fgname = null;
                    let hashKey = null;
                    let mobile = null;
                    let onlyIsActive = false;
                    try {
                        offsetStart = req && req.query.offsetStart || 0;
                        limit = req && req.query.limit || null;
                        filters = req.query.filters || null;
                        if(filters) {
                            filters = JSON.parse(filters);
                            cname = filters.cname || null;
                            fgname = filters.fgname || null;
                            hashKey = filters.hashKey || null;
                            mobile = filters.mobile || null;
                            onlyIsActive = filters.onlyIsActive;
                        }
                    } catch(e) {
                        console.log(e);
                    }                                        
                    return {
                        start: offsetStart,
                        limit: limit,
                        cname: cname,
                        fgname: fgname,
                        hashKey: hashKey,
                        mobile: mobile,
                        onlyIsActive: onlyIsActive
                    }
                }
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

    Customer.remoteMethod('getCustomerBasicListApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    var req = ctx && ctx.req;
                    let access_token = req && req.query.access_token;
                    return access_token;                    
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
        }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/customer-basic-list', verb: 'get'},
        description: 'For fetching customer list.',
    });

    Customer.remoteMethod('updateBlackListAPI', {
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
        http: {path: '/update-blacklist', verb: 'post'},
        description: 'Updating the customer blacklist'
    });


    Customer.createCustomerAPIHandler = async (data) => {
        try {
            data._userId = await utils.getStoreOwnerUserId(data.accessToken);
            let obj = await Customer.handleCustomerData(data);
            return {STATUS: "SUCCESS", CUSTOMER_ROW: obj.record};
        } catch(e) {
            logger.error(GsErrorCtrl.create({className: 'Customer', methodName: 'createCustomerAPIHandler', cause: e, message: 'Exception in Create-new Customer API'}));
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }
    }

    Customer.getMetaData = async (accessToken, identifiers, params, cb) => {
        try{
            let metaData = {};
            Customer.metaData = null;
            let userId = await utils.getStoreOwnerUserId(accessToken);
            metaData = await Customer._getMetaData(userId, identifiers, params);
            // return Promise.resolve(metaData);
            return metaData;
        } catch(e) {
            console.log(e);
            return false;
        }
    }

    Customer._getMetaData = (userId, identifiers, params) => {
        return new Promise( async (resolve, reject) => {
            try {
                let metaData = {};
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
                return resolve(metaData);
            } catch(e) {
                return reject(e);
            }
            
        });
    }

    Customer.handleCustomerData = async (params) => {
        //TODO: Valide the input arguments
        let hashKey = Customer.generateHashKey(params);
        let customerData = await Customer.isAlreadyExists(hashKey, {onlyActive: true, _userId: params._userId});
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
                guardianRelation: params.guardianRelation,
                address: params.address,
                place: params.place,
                city: params.city,
                pincode: params.pinCode || null,
                mobile: params.mobile || null,
                otherDetails: params.moreDetails || [],
                createdAt: new Date(),
                modifiedAt: new Date()
            }
            // Customer.create(dbInputValues, (err, result) => {
            let qv = [
                dbInputValues.userId, dbInputValues.name,
                dbInputValues.gaurdianName, dbInputValues.guardianRelation, dbInputValues.imageId,
                dbInputValues.address, dbInputValues.place,
                dbInputValues.city, dbInputValues.pincode,
                dbInputValues.mobile, JSON.stringify(dbInputValues.otherDetails),
                dbInputValues.hashKey,
                dbInputValues.createdAt, dbInputValues.modifiedAt,
            ];
            let query = SQL.INSERT_NEW_CUSTOMER;
            query = query.replace(/REPLACE_USERID/g, params._userId);
            Customer.dataSource.connector.query(query, qv, (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve({...dbInputValues, customerId: result.insertId});
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
                    let query = Customer.getQuery('all', {userId: userId, ...params});
                    query = query.replace(/REPLACE_USERID/g, userId);
                    Customer.dataSource.connector.query(query, (err, result) => {                
                        if(err) {
                            return reject(err);
                        } else {
                            let parsedResult = Customer.parseMetaData(result);
                            Customer.metaData = parsedResult;
                            let bucket = [];
                            _.each(parsedResult, (anItem, index) => {
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
                    let qry = Customer.getQuery('countQuery', {userId: userId, ...params});
                    qry = qry.replace(/REPLACE_USERID/g, userId);
                    Customer.dataSource.connector.query(qry, (err, res) => {
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
        let formatted = [];
        _.each(rawResult, (aRes, index) => {
            let obj = {};
                
            obj.address = aRes.address;
            obj.city = aRes.city;
            obj.customerId = aRes.customerId;
            obj.custStatus = aRes.custStatus;
            obj.isBlacklisted = aRes.isBlacklisted;
            obj.guardianRelation = aRes.guardianRelation;
            obj.gaurdianName = aRes.gaurdianName;
            obj.hashKey = aRes.hashKey;
            obj.imageTableId = aRes.imageTableId;
            obj.mobile = aRes.mobile;
            obj.name = aRes.name;
            obj.otherDetails = aRes.otherDetails;
            obj.pincode = aRes.pincode;
            obj.place = aRes.place;
            obj.secMobile = aRes.secMobile;
            obj.userId = aRes.userId;
            obj.userImageFormat = aRes.userImageFormat;
            obj.userImageOptionals = aRes.userImageOptionals;
            obj.userImagePath = aRes.userImagePath;
            obj.userImageStorageMode = aRes.userImageStorageMode;
            
            if(obj.userImagePath)
                obj.userImagePath = utils.constructImageUrl(obj.userImagePath); //`http://${app.get('domain')}:${app.get('port')}${aRes.userImagePath.replace('client', '')}`;

            obj.mobile = aRes.mobile?aRes.mobile.toString():null;
            obj.pincode = aRes.pincode?aRes.pincode.toString():null;

            formatted.push(obj);
        });
        return formatted;
    }

    Customer.getQuery = (identifier, params) => {
        let sql = '';
        let whereCondition = '';
        let limitOffset = '';
        let whereClause = '';
        switch(identifier) {
            case 'all':
                whereCondition = Customer._getWhereCondition(params);
                sql = `SELECT 
                            customer_REPLACE_USERID.CustomerId AS customerId,
                            customer_REPLACE_USERID.UserId AS userId,
                            customer_REPLACE_USERID.Name AS name,
                            customer_REPLACE_USERID.GuardianRelation AS guardianRelation,
                            customer_REPLACE_USERID.GaurdianName AS gaurdianName,
                            customer_REPLACE_USERID.Address AS address,
                            customer_REPLACE_USERID.Place AS place,
                            customer_REPLACE_USERID.City AS city,
                            customer_REPLACE_USERID.Pincode AS pincode,
                            customer_REPLACE_USERID.Mobile AS mobile,
                            customer_REPLACE_USERID.HashKey AS hashKey,
                            customer_REPLACE_USERID.SecMobile AS secMobile,
                            customer_REPLACE_USERID.OtherDetails AS otherDetails,
                            customer_REPLACE_USERID.CustStatus AS custStatus,
                            customer_REPLACE_USERID.IsBlacklisted AS isBlacklisted,
                            image.Id AS imageTableId,
                            image.Path AS userImagePath,
                            image.Format AS userImageFormat,
                            image.Optional AS userImageOptionals,
                            image.StorageMode AS userImageStorageMode
                        FROM customer_REPLACE_USERID
                            LEFT JOIN 
                        image ON customer_REPLACE_USERID.ImageId = image.Id
                           ${whereCondition}
                        ORDER BY customer_REPLACE_USERID.Name ASC`;
                    if(params.limit)
                        sql += ` LIMIT ${params.limit}`;
                    if(params.start)
                        sql += ` OFFSET ${params.start}`;
                break;
            case 'customer-list-basic':
                sql = SQL.CUSTOMER_LIST_BASIC;
                whereClause = Customer._getWhereCondition(params);
                if(params.limit)
                    limitOffset = `LIMIT ${params.limit} OFFSET ${params.start||0}`;

                sql = sql.replace(/WHERE_CLAUSE/g, whereClause);    
                sql = sql.replace(/LIMIT_OFFSET_CLAUSE/g, limitOffset);

                break;
            case 'customer-list-detailed':
                sql = SQL.CUSTOMER_LIST_DETAILED;
                whereClause = Customer._getWhereCondition(params);
                if(params.limit)
                    limitOffset = `LIMIT ${params.limit} OFFSET ${params.start||0}`;

                sql = sql.replace(/WHERE_CLAUSE/g, whereClause);    
                sql = sql.replace(/LIMIT_OFFSET_CLAUSE/g, limitOffset);

                break;
            case 'countQuery': 
                whereCondition = Customer._getWhereCondition(params);
                sql = `SELECT
                            COUNT(*) AS count
                        FROM customer_REPLACE_USERID
                            LEFT JOIN 
                        image ON customer_REPLACE_USERID.ImageId = image.Id
                            ${whereCondition}`;
                break;
            case 'replace-customer-hashkey-map':
                sql = `UPDATE ${params.pledgebookTableName} SET CustomerId = '${params._customerIdForMergeInto}' where CustomerId = '${params._customerIdForMerge}'`;
                break;
            case 'disable-customer':
                sql = `UPDATE customer_REPLACE_USERID SET CustStatus = ${params.status} WHERE CustomerId = '${params.custId}' AND UserId=${params.userId}`;
                break;
            case 'update-sec-mobile':
                sql = `UPDATE customer_REPLACE_USERID SET SecMobile=? WHERE CustomerId=?`;
                break;
            case 'update-primary-mobile':
                sql = `UPDATE customer_REPLACE_USERID SET Mobile=? WHERE CustomerId=?`;
                break;
            case 'customer-obj':
                sql = SQL.CUST_BY_ID;
                break;
            case 'blacklist-update':
                sql = `UPDATE customer_REPLACE_USERID SET IsBlacklisted = ${params.isBlacklisted} WHERE CustomerId = '${params.custId}' AND UserId=${params.userId}`;
                break;
        }
        return sql;
    }

    Customer._getWhereCondition = (params) => {
        let whereCondition = '';
        let filters = [];
        if(params.userId)
            filters.push(`customer_REPLACE_USERID.UserId=${params.userId}`);
        if(params.customerIdArr && params.customerIdArr.length>0)
            filters.push(`customer_REPLACE_USERID.CustomerId IN (${params.customerIdArr.join(',')})`);
        if(params.cname)
            filters.push(`customer_REPLACE_USERID.Name LIKE '${params.cname}%'`);
        if(params.fgname)
            filters.push(`customer_REPLACE_USERID.GaurdianName LIKE '${params.fgname}%'`);
        if(params.hashKey)
            filters.push(`customer_REPLACE_USERID.HashKey = '${params.hashKey}'`);
        if(params.onlyIsActive)
            filters.push(`customer_REPLACE_USERID.CustStatus = 1`);
        if(params.ecludeBlacklistedCustomer)
            filters.push(`customer_REPLACE_USERID.IsBlacklisted = 0`);
        if(params.customerHashKey)
            filters.push(`customer_REPLACE_USERID.hashKey = '${params.customerHashKey}'`);
        if(params.customerId)
            filters.push(`customer_REPLACE_USERID.customerId = ${params.customerId}`);
        if(params.mobile)
            filters.push(`customer_REPLACE_USERID.Mobile LIKE '${params.mobile}%'`);
        if(filters.length)
            whereCondition = ` WHERE ${filters.join(' AND ')}`;
        return whereCondition;
    }

    //TODO: missed to check with userId
    Customer.generateHashKey = (params) => {
        params.pincode = params.pinCode || params.pincode || '';
        let cname = (params.cname)?params.cname.toLowerCase():params.cname;
        let gaurdianName = (params.gaurdianName)?params.gaurdianName.toLowerCase():params.gaurdianName;
        let address = (params.address)?params.address.toLowerCase():params.address;
        let place = (params.place)?params.place.toLowerCase():params.place;
        let city = (params.city)?params.city.toLowerCase():params.city;
        let pincode = (params.pincode)?params.pincode.toString().toLowerCase():params.pincode;        

        return sh.unique( cname + gaurdianName + address + place + city + pincode);
    }

    //TODO: check with respect to UserId also in where condition
    Customer.isAlreadyExists = (hashKey, optional) => {
        return new Promise( (resolve, reject) => {
            /*let whereCondition = {hashKey: hashKey}

            if(optional) {
                if(optional.ignoreCustId)
                    whereCondition.customerId = {neq: optional.ignoreCustId};
                if(optional.onlyActive)
                    whereCondition.status = {neq: 0};
                if(optional._userId)
                    whereCondition.userId = optional._userId;
            }

            if(optional && optional.ignoreCustId)
                whereCondition = {hashKey: hashKey, customerId: {neq: optional.ignoreCustId}};
            
            Customer.findOne({where: whereCondition}, (err, result) => {
            */
            let whereClause = '';
            let whereList = [];
            whereList.push(`HashKey='${hashKey}'`);
            if(optional) {
                if(optional.ignoreCustId)
                    whereList.push(`CustomerId <> ${optional.ignoreCustId}`);
                if(optional.onlyActive)
                    whereList.push(`CustStatus <> 0`);
                // if(optional._userId)
                //     whereList.push(`UsedId = ${optional._userId}`);
            }
            whereClause = whereList.join(' AND ');
            
            // let query = `SELECT * FROM customer_REPLACE_USERID WHERE ${whereClause}`;
            let query = SQL.SELECT_QUERY;
            query += ` WHERE ${whereClause}`;
            query = query.replace(/REPLACE_USERID/g, optional._userId);
            Customer.dataSource.connector.query(query, (err, result) => {
                if(err) {
                    //TODO: Log the error
                    reject(err);
                } else {
                    if(result && result.length)
                        resolve(result[0]);
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

    Customer.updateDetails = async (params) => {
        try{
            params._userId = await utils.getStoreOwnerUserId(params.accessToken);

            //TODO: DELETE the existing image
            let verification = await Customer.checkInputDetails(params);
            if(!verification.STATUS) {
                let msg = 'Verification of customer detail failed.';
                if(verification.CODE == 'SIMILAR_ALREADY_EXISTS')
                    msg = `Customer with same details already exists. CustId = "${verification.params._existingCustHashkey}". Try merge option.`;
                throw new Error(msg);
            }
            params = verification.params;
            
            // let response = await Customer.updateAll({customerId: params.customerId}, {name: params.cname, imageId: params.picture.id, gaurdianName: params.gaurdianName, address: params.address, place: params.place, city: params.city, mobile: params.mobile, secMobile: params.secMobile, pincode: params.pinCode, otherDetails: params.otherDetails, hashKey: params._hashKey});
            await Customer._update(params);
            return true; //response;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    Customer._update = (params) => {
        return new Promise((resolve, reject) => {
            let modifiedDate = new Date().toISOString().replace('T', ' ').slice(0,23);
            let query = SQL.UPDATE_CUSTOMER;
            query = query.replace(/REPLACE_USERID/g, params._userId);
            let qv = [
                params.cname, 
                params.guardianRelation, params.gaurdianName,
                params.picture.id, params.address,
                params.place, params.city,
                params.pinCode, params.mobile, params.secMobile,
                JSON.stringify(params.otherDetails), params._hashKey,
                modifiedDate, params.customerId
            ];
            Customer.dataSource.connector.query(query, qv, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    Customer.checkInputDetails = async (params) => {
        if(params.mobile && params.mobile == 'null')
            params.mobile = null;
        let hashKey = Customer.generateHashKey(params);
        params._hashKey = hashKey;
        let customerData = await Customer.isAlreadyExists(hashKey, {ignoreCustId: params.customerId, onlyActive: true, _userId: params._userId});
        if(customerData) {
            params._existingCustHashkey = customerData.hashKey;
            return {
                STATUS: false,
                CODE: 'SIMILAR_ALREADY_EXISTS',
                params: params
            }
        } else {
            return {
                STATUS: true,
                params: params
            }
        }
    }

    Customer.updateByMergingIntoOther = async (params) => {
        try {
            let _userId = await utils.getStoreOwnerUserId(params.accessToken);
            params._userId = _userId;
            params.pledgebookTableName = await app.models.Pledgebook.getPledgebookTableName(_userId);
            params._customerIdForMerge = await Customer.getIdByHashKey(params.custHashkeyForMerge, params._userId);
            params._customerIdForMergeInto = await Customer.getIdByHashKey(params.custHashkeyForMergeInto, params._userId);
            if(!params._customerIdForMerge || !params._customerIdForMergeInto)
                throw new Error('Customer not found, Please enter valid Hashkey');
            await Customer._updateByMergingIntoOther(params);
            return {STATUS: 'success', message: 'Successfully merged'};
        } catch(e) {
            return {STATUS: 'error', ERROR: e, message: 'Error while updating the customer by merging into other customer'};
        }
    }

    Customer.remoteMethod('updateByMergingIntoOther', {
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
        http: {path: '/update-by-merging', verb: 'post'},
        description: 'Updating the customer by merging the one into other customer'
    });

    Customer._updateByMergingIntoOther = (params) => {
        return new Promise( (resolve, reject) => {
            try {
                let sql = Customer.getQuery('replace-customer-hashkey-map', params);
                sql = sql.replace(/REPLACE_USERID/g, params._userId);
                Customer.dataSource.connector.query(sql, async (err, res) => {
                    if(err) {
                        return reject(err);
                    } else {
                        let ags = {
                            custId : params._customerIdForMerge,
                            userId: params._userId
                        }
                        try {
                            await Customer._changeCustStatus(params._customerIdForMerge, params._userId, 0);
                            return resolve(true);
                        } catch(e) {
                            return reject(e);
                        }
                    }
                });
            } catch(e) {
                return reject(e);
            }
        }); 
    }

    Customer._changeCustStatus = async (custId, userId, status) => {
        return new Promise( (resolve, reject) => {
            let params = {
                custId: custId,
                userId: userId,
                status: status
            }
            let query = Customer.getQuery('disable-customer', params);
            query = query.replace(/REPLACE_USERID/g, userId);
            Customer.dataSource.connector.query(query, (err1, res1) => {
                if(err1) {
                    reject(err1);
                } else {
                    resolve(true);
                }
            });
        });        
    }

    Customer._getById = (custId, _userId) => {
        return new Promise( (resolve, reject) => {
            try {
                // Customer.findOne({where: {customerId: custId} }, (err, res) => {

                // let query = `SELECT * FROM customer_REPLACE_USERID WHERE CustomerId=${custId}`;
                let query = SQL.SELECT_QUERY;
                query += ` WHERE CustomerId=${custId}`;
                query = query.replace(/REPLACE_USERID/g, _userId);
                Customer.dataSource.connector.query(query, (err, res) => {
                    if(err)
                        reject(err);
                    else {
                        resolve(res[0]);
                    }
                });
            } catch(e) {
                reject(e);
            }
        });
    }

    Customer.getIdByHashKey = (hashKey, userId) => {
        return new Promise( (resolve, reject ) => {
            try {
                // let query = `SELECT * FROM customer_REPLACE_USERID WHERE HashKey='${hashKey}'`;
                let query = SQL.CUSTOMER_BY_HASHKEY;
                query = query.replace(/REPLACE_USERID/g, userId);
                Customer.dataSource.connector.query(query, [hashKey], (err, res) => {
                    if(err) {
                        return reject(err);
                    } else {
                        if(res && res.length > 0)
                            return resolve(res[0].customerId); // CustomerId
                        else
                            return resolve(null);
                    }
                });
            } catch(e) {
                return reject(e);
            }            
        });
    }

    Customer.updateStatusAPI = async (data) => {
        try {
            let _userId = await utils.getStoreOwnerUserId(data.accessToken);
            let action = data.status?'Enabled':'Disabled';
            if(!data.status) { //ToDisable, then the customer should not have any pending bills
                let pendingBills = await app.models.Pledgebook._getPendingBillsList(data.custId, _userId);
                if(pendingBills.length > 0)
                    throw new Error('This Customer has Pending Bills. Redeem those bills to disable this customer...');
            } else { //To enable, there should not be any already existing hashkey
                let custRecord = await Customer._getById(data.custId, _userId);
                let custRecords = await Customer.isAlreadyExists(custRecord.hashKey, {onlyActive: true, ignoreCustId: data.custId, _userId: _userId});
                if(custRecords)
                    throw new Error(`Could not Enable! Snce there is another customer with Same key = ${custRecord.hashKey}`);
            }
            await Customer._changeCustStatus(data.custId, _userId, data.status);
            return {
                STATUS: 'success',
                MSG: `${action} the customer successfully`
            }
        } catch(e) {
            console.log(e);
            return {
                STATUS: 'error',
                MSG: e.message || 'Error while updating the customer status',
                ERROR: e
            }
        }
    }
    
    Customer.remoteMethod('updateStatusAPI', {
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
        http: {path: '/update-status', verb: 'post'},
        description: 'Updating the customer Status'
    });

    Customer._updatePrimaryMobile = (mobNumber, custId, userId) => {
        return new Promise( (resolve, reject) => {
            let sql = Customer.getQuery('update-primary-mobile');
            sql = sql.replace(/REPLACE_USERID/g, userId);
            Customer.dataSource.connector.query(sql, [mobNumber, custId], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    };

    Customer._updateSecMobile = (mobNumber, custId, userId) => {
        return new Promise( (resolve, reject) => {
            let sql = Customer.getQuery('update-sec-mobile');
            sql = sql.replace(/REPLACE_USERID/g, userId);
            Customer.dataSource.connector.query(sql, [mobNumber, custId], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    };

    Customer.getCustomerBasicListApi = (accessToken, params, cb) => {
        Customer._getCustomerBasicListApi(accessToken, params).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: {list: resp}});
            else
                cb(null, {STATUS: 'ERROR', RESP: {list: resp}});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    Customer._getCustomerBasicListApi = (accessToken, params) => {
        return new Promise(async (resolve, reject) => {
            params.userId = await utils.getStoreOwnerUserId(accessToken);
            let query = Customer.getQuery('customer-list-detailed', params);
            query = query.replace(/REPLACE_USERID/g, params.userId);
            Customer.dataSource.connector.query(query, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    _.each(res, (aRec, index) => {
                        aRec.userImagePath = utils.constructImageUrl(aRec.userImagePath);
                    })
                    return resolve(res);
                }
            });
        });
    }

    Customer.fetchByCustIdApiHanlder = (accessToken, custIdArr, cb) => {
        Customer._fetchByCustIdApiHanlder(accessToken, {custIdArr}).then((resp) => {
            if(resp)
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            else
                cb(null, {STATUS: 'ERROR', RESP: resp});
        }).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    Customer._fetchByCustIdApiHanlder = (accessToken, params) => {
        return new Promise(async (resolve, reject) => {
            params.userId = await utils.getStoreOwnerUserId(accessToken);
            let query = Customer.getQuery('customer-obj', params);
            query = query.replace(/REPLACE_USERID/g, params.userId);
            Customer.dataSource.connector.query(query, [params.custIdArr.join(',')], (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    Customer.updateBlackListAPI = async (data) => {
        try {
            let _userId = await utils.getStoreOwnerUserId(data.accessToken);
            let isBlacklistCustomer = data.isBlacklistCustomer?true:false;
            await Customer._updateBlackListAPI(data.custId, _userId, isBlacklistCustomer);
            return {
                STATUS: 'success',
                MSG: `Successfully ${isBlacklistCustomer?'added customer to blacklist':'removed customer from blacklist'}`
            }
        } catch(e) {
            console.log(e);
            return {
                STATUS: 'error',
                MSG: e.message || 'Error while updating the blacklist',
                ERROR: e
            }
        }
    }

    Customer._updateBlackListAPI = async (custId, userId, isBlacklisted) => {
        return new Promise( (resolve, reject) => {
            let params = {
                custId: custId,
                userId: userId,
                isBlacklisted: isBlacklisted
            }
            let query = Customer.getQuery('blacklist-update', params);
            query = query.replace(/REPLACE_USERID/g, userId);
            Customer.dataSource.connector.query(query, (err1, res1) => {
                if(err1) {
                    reject(err1);
                } else {
                    resolve(true);
                }
            });
        });        
    }
};

let SQL = {
    Name: `SELECT DISTINCT Name from customer_REPLACE_USERID`,
    GaurdianName: `SELECT DISTINCT GaurdianName FROM customer_REPLACE_USERID`,
    Address: `SELECT DISTINCT Address FROM customer_REPLACE_USERID`,
    Place: `SELECT DISTINCT Place FROM customer_REPLACE_USERID`,
    City: `SELECT DISTINCT City FROM customer_REPLACE_USERID`,
    Mobile: `SELECT DISTINCT Mobile FROM customer_REPLACE_USERID`,
    Pincode: `SELECT DISTINCT Pincode FROM customer_REPLACE_USERID`,
    OtherDetails: ``, //TODO:
    SELECT_QUERY: `SELECT 
                        customer_REPLACE_USERID.CustomerId AS customerId,
                        customer_REPLACE_USERID.UserId AS userId,
                        customer_REPLACE_USERID.Name AS name,
                        customer_REPLACE_USERID.GaurdianName AS gaurdianName,
                        customer_REPLACE_USERID.Address AS address,
                        customer_REPLACE_USERID.Place AS place,
                        customer_REPLACE_USERID.City AS city,
                        customer_REPLACE_USERID.Pincode AS pincode,
                        customer_REPLACE_USERID.Mobile AS mobile,
                        customer_REPLACE_USERID.HashKey AS hashKey,
                        customer_REPLACE_USERID.SecMobile AS secMobile,
                        customer_REPLACE_USERID.CustStatus AS custStatus,
                        customer_REPLACE_USERID.IsBlacklisted AS isBlacklisted
                    FROM 
                        customer_REPLACE_USERID`,
    CUSTOMER_BY_HASHKEY: `SELECT 
                        customer_REPLACE_USERID.CustomerId AS customerId,
                        customer_REPLACE_USERID.UserId AS userId,
                        customer_REPLACE_USERID.Name AS name,
                        customer_REPLACE_USERID.GuardianRelation as guardianRelation,
                        customer_REPLACE_USERID.GaurdianName AS gaurdianName,
                        customer_REPLACE_USERID.Address AS address,
                        customer_REPLACE_USERID.Place AS place,
                        customer_REPLACE_USERID.City AS city,
                        customer_REPLACE_USERID.Pincode AS pincode,
                        customer_REPLACE_USERID.Mobile AS mobile,
                        customer_REPLACE_USERID.HashKey AS hashKey,
                        customer_REPLACE_USERID.SecMobile AS secMobile,
                        customer_REPLACE_USERID.CustStatus AS custStatus,
                        customer_REPLACE_USERID.IsBlacklisted AS isBlacklisted
                    FROM 
                        customer_REPLACE_USERID 
                    WHERE
                        HashKey=?`,
    CUSTOMER_LIST_BASIC: `SELECT 
                        customer_REPLACE_USERID.CustomerId AS customerId,
                        customer_REPLACE_USERID.UserId AS userId,
                        customer_REPLACE_USERID.Name AS name,
                        customer_REPLACE_USERID.GuardianRelation as guardianRelation,
                        customer_REPLACE_USERID.GaurdianName AS gaurdianName,
                        customer_REPLACE_USERID.Address AS address,
                        customer_REPLACE_USERID.Place AS place,
                        customer_REPLACE_USERID.City AS city,
                        customer_REPLACE_USERID.Pincode AS pincode,
                        customer_REPLACE_USERID.Mobile AS mobile,
                        customer_REPLACE_USERID.HashKey AS hashKey,
                        customer_REPLACE_USERID.SecMobile AS secMobile,
                        customer_REPLACE_USERID.CustStatus AS custStatus,
                        customer_REPLACE_USERID.IsBlacklisted AS isBlacklisted
                    FROM customer_REPLACE_USERID
                    WHERE_CLAUSE
                    ORDER BY customer_REPLACE_USERID.Name ASC
                    LIMIT_OFFSET_CLAUSE`,
    CUSTOMER_LIST_DETAILED: `SELECT 
                                customer_REPLACE_USERID.CustomerId AS customerId,
                                customer_REPLACE_USERID.UserId AS userId,
                                customer_REPLACE_USERID.Name AS name,
                                customer_REPLACE_USERID.GuardianRelation as guardianRelation,
                                customer_REPLACE_USERID.GaurdianName AS gaurdianName,
                                customer_REPLACE_USERID.Address AS address,
                                customer_REPLACE_USERID.Place AS place,
                                customer_REPLACE_USERID.City AS city,
                                customer_REPLACE_USERID.Pincode AS pincode,
                                customer_REPLACE_USERID.Mobile AS mobile,
                                customer_REPLACE_USERID.HashKey AS hashKey,
                                customer_REPLACE_USERID.SecMobile AS secMobile,
                                customer_REPLACE_USERID.OtherDetails AS otherDetails,
                                customer_REPLACE_USERID.CustStatus AS custStatus,
                                customer_REPLACE_USERID.IsBlacklisted AS isBlacklisted,
                                image.Id AS imageTableId,
                                image.Path AS userImagePath,
                                image.Format AS userImageFormat,
                                image.Optional AS userImageOptionals,
                                image.StorageMode AS userImageStorageMode
                            FROM customer_REPLACE_USERID
                                LEFT JOIN 
                            image ON customer_REPLACE_USERID.ImageId = image.Id
                            WHERE_CLAUSE
                            ORDER BY customer_REPLACE_USERID.Name ASC
                            LIMIT_OFFSET_CLAUSE`,
    INSERT_NEW_CUSTOMER: `INSERT INTO 
                                customer_REPLACE_USERID 
                                (UserID, Name, GaurdianName, GuardianRelation, ImageId, Address, Place, City, Pincode, Mobile, OtherDetails, HashKey, CreatedAt, ModifiedAt)
                            VALUES
                                (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    UPDATE_CUSTOMER: `UPDATE 
                            customer_REPLACE_USERID
                        SET
                            Name=?, GuardianRelation=?, gaurdianName=?, ImageId=?,
                            Address=?, Place=?, City=?, 
                            Pincode=?, Mobile=?, SecMobile=?,
                            OtherDetails=?, HashKey=?, ModifiedAt=?
                        WHERE
                            CustomerId=?`,
    CUST_BY_ID: `SELECT * FROM customer_REPLACE_USERID WHERE CustomerId IN (?)`

}
