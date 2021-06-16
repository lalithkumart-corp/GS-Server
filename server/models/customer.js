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
        let formatted = [];
        _.each(rawResult, (aRes, index) => {
            let obj = {};
                
            obj.address = aRes.address;
            obj.city = aRes.city;
            obj.customerId = aRes.customerId;
            obj.custStatus = aRes.custStatus;
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

            obj.mobile = ''+aRes.mobile;
            obj.pincode = ''+aRes.pincode;

            formatted.push(obj);
        });
        return formatted;
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
                            customer.SecMobile AS secMobile,
                            customer.OtherDetails AS otherDetails,
                            customer.CustStatus AS custStatus,
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
            case 'replace-customer-hashkey-map':
                sql = `UPDATE ${params.pledgebookTableName} SET CustomerId = '${params._customerIdForMergeInto}' where CustomerId = '${params._customerIdForMerge}'`;
                break;
            case 'disable-customer':
                sql = `UPDATE customer SET CustStatus = ${params.status} WHERE CustomerId = '${params.custId}' AND UserId=${params.userId}`;
                break;
            case 'update-sec-mobile':
                sql = `UPDATE customer SET SecMobile=? WHERE CustomerId=?`;
                break;
            case 'update-primary-mobile':
                sql = `UPDATE customer SET Mobile=? WHERE CustomerId=?`;
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
        if(params.onlyIsActive)
            filters.push(`customer.CustStatus = 1`);
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
            let whereCondition = {hashKey: hashKey}

            if(optional) {
                if(optional.ignoreCustId)
                    whereCondition.customerId = {neq: optional.ignoreCustId};
                if(optional.onlyActive)
                    whereCondition.status = {neq: 0};
                if(optional._userId)
                    whereCondition.userId = optional._userId;
            }

            // if(optional && optional.ignoreCustId)
            //     whereCondition = {hashKey: hashKey, customerId: {neq: optional.ignoreCustId}};
            
            Customer.findOne({where: whereCondition}, (err, result) => {
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
            let response = await Customer.updateAll({customerId: params.customerId}, {name: params.cname, imageId: params.picture.id, gaurdianName: params.gaurdianName, address: params.address, place: params.place, city: params.city, mobile: params.mobile, secMobile: params.secMobile, pincode: params.pinCode, otherDetails: params.otherDetails, hashKey: params._hashKey});
            return response;
        } catch(e) {
            console.log(e);
            throw e;
        }
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
            params._customerIdForMerge = await Customer.getIdByHashKey(params.custHashkeyForMerge);
            params._customerIdForMergeInto = await Customer.getIdByHashKey(params.custHashkeyForMergeInto);
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
            Customer.dataSource.connector.query(Customer.getQuery('disable-customer', params), (err1, res1) => {
                if(err1) {
                    reject(err1);
                } else {
                    resolve(true);
                }
            });
        });        
    }

    Customer._getById = (custId) => {
        return new Promise( (resolve, reject) => {
            try {
                Customer.findOne({where: {customerId: custId} }, (err, res) => {
                    if(err)
                        reject(err);
                    else {
                        resolve(res);
                    }
                });
            } catch(e) {
                reject(e);
            }
        });
    }

    Customer.getIdByHashKey = (hashKey) => {
        return new Promise( (resolve, reject ) => {
            try {
                Customer.dataSource.connector.query(`SELECT * FROM Customer WHERE HashKey='${hashKey}'`, (err, res) => {
                    if(err) {
                        return reject(err);
                    } else {
                        if(res && res.length > 0)
                            return resolve(res[0].CustomerId);
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
                let custRecord = await Customer._getById(data.custId);
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

    Customer._updatePrimaryMobile = (mobNumber, custId) => {
        return new Promise( (resolve, reject) => {
            let sql = Customer.getQuery('update-primary-mobile');
            Customer.dataSource.connector.query(sql, [mobNumber, custId], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    };

    Customer._updateSecMobile = (mobNumber, custId) => {
        return new Promise( (resolve, reject) => {
            let sql = Customer.getQuery('update-sec-mobile');
            Customer.dataSource.connector.query(sql, [mobNumber, custId], (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    };

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
