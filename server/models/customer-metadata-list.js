'use strict';

module.exports = function(CustomerMetaDatalist) {
    CustomerMetaDatalist.getList = (userId) => {
        return new Promise( (resolve, reject) => {
            CustomerMetaDatalist.find({where: {userId: userId}}, (err, result) => {
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
