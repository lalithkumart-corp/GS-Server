'use strict';
let _ = require('lodash');
let sh = require('shorthash');

module.exports = function(Customer) {
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
            let dbInputValues = {
                hashKey: params.hashKey,
                name: params.cname,
                gaurdianName: params.gaurdianName,
                address: params.address,
                place: params.place,
                city: params.city,
                pincode: params.pinCode,
                mobile: params.mobile,
                other: params.moreDetails,
                createdAt: new Date(),
                modifiedAt: new Date()
            }
            Customer.create(dbInputValues, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    Customer._getMetaDataFromDB = (identifier) => {
        return new Promise( (resolve, reject) => {
            // let dataSource = Customer.dataSource;
            if(identifier == 'otherDetails') {
                Customer.app.models.customerMetadataList.getList()
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
                        bucket.push(anItem[identifier]);
                    });
                    return resolve(bucket);
                }
                Customer.find({}, (err, result) => {
                    if(err) {
                        return reject(err);
                    } else {
                        Customer.metaData = result;
                        let bucket = [];
                        _.each(result, (anItem, index) => {
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
    
    Customer.getMetaData = async (identifiers, cb) => {
        let metaData = {};
        Customer.metaData = null;
        for(let identifier of identifiers) {
            switch(identifier) {
                case 'customerNames':
                    let customerNames = await Customer._getMetaDataFromDB('name');
                    metaData.customerNames = customerNames;
                    break;
                case 'guardianNames':
                    let guardianNames = await Customer._getMetaDataFromDB('gaurdianName');
                    metaData.guardianNames = guardianNames;
                    break;
                case 'address':
                    let address = await Customer._getMetaDataFromDB('address');
                    metaData.address = address;
                    break;
                case 'place':
                    let place = await Customer._getMetaDataFromDB('place');
                    metaData.place = place;
                    break;
                case 'city':
                    let city = await Customer._getMetaDataFromDB('city');
                    metaData.city = city;
                    break;
                case 'mobile':
                    let mobile = await Customer._getMetaDataFromDB('mobile');
                    metaData.mobile = mobile;
                    break;                
                case 'pincode':
                    let pincode = await Customer._getMetaDataFromDB('pincode');
                    metaData.pincode = pincode;
                    break;
                case 'otherDetails':
                    let otherDetails = await Customer._getMetaDataFromDB('otherDetails');
                    metaData.otherDetails = otherDetails;
                    break;
            }
        }
        return metaData;
    }

    Customer.remoteMethod('getMetaData', {
        accepts: {
            arg: 'params', type: 'array', http: (ctx) => {
                var req = ctx && ctx.req;
                var identifiers = req && req.query.identifiers;
                var identifiers = identifiers ? JSON.parse(identifiers) : undefined;
                return identifiers;
            },
            description: 'Arguments goes here',
        },
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

    Customer.generateHashKey = (params) => {
        return sh.unique( params.cname + params.gaurdianName + params.address + params.place + params.city + params.pincode )        
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

    Customer.checkForCustomerDataUpdate = (dbCustomerData, params) => {
        //TODO: Check for 'other' details value and store in DB
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