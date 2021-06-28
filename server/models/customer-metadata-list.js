'use strict';
let _ = require('lodash');

module.exports = function(CustomerMetaDatalist) {
    CustomerMetaDatalist.getList = (userId, offset) => {
        return new Promise( (resolve, reject) => {
            CustomerMetaDatalist.find({where: {userId: 0}}, (err, result) => {
                if(err) {
                    // TODO: Log error
                    return reject(err);
                } else {
                    let formatted = [];
                    _.each(result, (aRes, index) => {
                        let obj = {
                            displayText: aRes.displayText,
                            key: aRes.key,
                            serialNo: aRes.serialNo
                        }
                        formatted.push(obj);
                    });
                    return resolve(formatted);
                }
            });
        });
    }
};
