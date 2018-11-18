'use strict';

module.exports = function(CustomerMetaDatalist) {
    CustomerMetaDatalist.getList = () => {
        return new Promise( (resolve, reject) => {
            CustomerMetaDatalist.find({}, (err, result) => {
                if(err) {
                    // TODO: Log error
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        });
    }
};
