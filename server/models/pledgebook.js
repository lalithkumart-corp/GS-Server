'use strict';
let _ = require('lodash');
let app = require('../server');
module.exports = function(Pledgebook) {

    Pledgebook._getMetaDataFromDB = (identifier) => {
        return new Promise( (resolve, reject) => {
            let dataSource = Pledgebook.dataSource;
            dataSource.connector.query(sql[identifier], [], (err, list) => {
                if (err){                    
                    reject(err);
                } else {                    
                    let bucket = [];
                    _.each(list, (anItem, index) => {
                        bucket.push(anItem[identifier]);
                    });
                    resolve(bucket);
                }
            });
        });
    }
    
    Pledgebook.getMetaData = async (identifiers, cb) => {
        let metaData = {};
        for(let identifier of identifiers) {
            switch(identifier) {
                case 'customerNames':
                    let customerNames = await Pledgebook._getMetaDataFromDB('CustomerName');
                    metaData.customerNames = customerNames;
                    break;
                case 'fgNames':
                    let fgNames = await Pledgebook._getMetaDataFromDB('FGName');
                    metaData.fgNames = fgNames;
                    break;
                case 'address':
                    let address = await Pledgebook._getMetaDataFromDB('Address');
                    metaData.address = address;
                    break;
                case 'place':
                    let place = await Pledgebook._getMetaDataFromDB('Place');
                    metaData.place = place;
                    break;
                case 'city':
                    let city = await Pledgebook._getMetaDataFromDB('City');
                    metaData.city = city;
                    break;
                case 'mobile':
                    let mobile = await Pledgebook._getMetaDataFromDB('Mobile');
                    metaData.mobile = mobile;
                    break;                
                case 'pincode':
                    let pincode = await Pledgebook._getMetaDataFromDB('Pincode');
                    metaData.pincode = pincode;
                    break;
            }
        }
        return metaData;
    }

    Pledgebook.remoteMethod('getMetaData', {
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
        description: 'For fetching metadata from Pledgebook.',
    })
};

let sql = {
    CustomerName: `SELECT DISTINCT CustomerName from pledgebook`,
    FGName: `SELECT DISTINCT FGName FROM pledgebook`,
    Address: `SELECT DISTINCT Address FROM pledgebook`,
    Place: `SELECT DISTINCT Place FROM pledgebook`,
    City: `SELECT DISTINCT City FROM pledgebook`,
    Mobile: `SELECT DISTINCT Mobile FROM pledgebook`,
    Pincode: `SELECT DISTINCT Pincode FROM pledgebook`
}