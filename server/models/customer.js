'use strict';
let _ = require('lodash');
let sh = require('shorthash');
let utils = require('../utils/commonUtils');
module.exports = function(Customer) {

    Customer.getMetaData = async (accessToken, identifiers, cb) => {
        let metaData = {};
        Customer.metaData = null;
        let userId = await utils.getStoreUserId(accessToken);
        for(let identifier of identifiers) {
            switch(identifier) {
                case 'all':
                    let allData = await Customer._getMetaDataFromDB('all', userId);
                    metaData.row = allData;
                    break;
                case 'customerNames':
                    let customerNames = await Customer._getMetaDataFromDB('name', userId);
                    metaData.customerNames = customerNames;
                    break;
                case 'guardianNames':
                    let guardianNames = await Customer._getMetaDataFromDB('gaurdianName', userId);
                    metaData.guardianNames = guardianNames;
                    break;
                case 'address':
                    let address = await Customer._getMetaDataFromDB('address', userId);
                    metaData.address = address;
                    break;
                case 'place':
                    let place = await Customer._getMetaDataFromDB('place', userId);
                    metaData.place = place;
                    break;
                case 'city':
                    let city = await Customer._getMetaDataFromDB('city', userId);
                    metaData.city = city;
                    break;
                case 'mobile':
                    let mobile = await Customer._getMetaDataFromDB('mobile', userId);
                    metaData.mobile = mobile;
                    break;                
                case 'pincode':
                    let pincode = await Customer._getMetaDataFromDB('pincode', userId);
                    metaData.pincode = pincode;
                    break;
                case 'otherDetails':
                    let otherDetails = await Customer._getMetaDataFromDB('otherDetails', userId);
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
            arg: 'params', type: 'array', http: (ctx) => {
                var req = ctx && ctx.req;
                let identifiers = req && req.query.identifiers;
                identifiers = identifiers ? JSON.parse(identifiers) : undefined;
                return identifiers;
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
            await Customer.checkForCustomerDataUpdate(customerData, params);            
        }
        return customerData.customerId;
    }

    Customer.saveCustomerData = (params) => {
        return new Promise( (resolve, reject) => {
            let userId = params._userId;
            let dbInputValues = {
                userId: userId,
                hashKey: params.hashKey,
                name: params.cname,
                imageId: params.picture.id,
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

    Customer._getMetaDataFromDB = (identifier, userId) => {
        return new Promise( (resolve, reject) => {
            // let dataSource = Customer.dataSource;
            if(identifier == 'otherDetails') {
                Customer.app.models.customerMetadataList.getList(userId)
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
                Customer.find({where: {userId: userId}, include: ['image']}, (err, result) => {
                    if(err) {
                        return reject(err);
                    } else {
                        Customer.metaData = result;
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

    Customer.generateHashKey = (params) => {
        let cname = (params.cname)?params.cname.toLowerCase():params.cname;
        let gaurdianName = (params.gaurdianName)?params.gaurdianName.toLowerCase():params.gaurdianName;
        let address = (params.address)?params.address.toLowerCase():params.address;
        let place = (params.place)?params.place.toLowerCase():params.place;
        let city = (params.city)?params.city.toLowerCase():params.city;
        let pincode = (params.pincode)?params.pincode.toLowerCase():params.pincode;

        return sh.unique( cname + gaurdianName + address + place + city + pincode )        
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
        return new Promise( (resolve, reject) => {
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
        });
    }

    Customer.updateCustomerAPIHandler = async (customerDetail) => {
        try{
            console.log(customerDetail);
            customerDetail.picture.id = await Customer.app.models.Image.storeAndGetImageID(customerDetail.picture);
            await Customer.updateDetails(customerDetail);
            return {STATUS: 'SUCCESS', MSG: 'Updated the Customer detail successfully'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MESSAGE: (e?e.message:'')};
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
            let response = await Customer.updateAll({customerId: params.customerId}, {name: params.cname, imageId: params.picture.id, gaurdianName: params.gaurdianName, address: params.address, place: params.place, city: params.city, mobile: params.mobile, secMobile: params.secMobile, pincode: params.pinCode});
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
