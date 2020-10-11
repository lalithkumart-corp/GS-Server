'use strict';

module.exports = function(CustomerMetaDatalist) {
    CustomerMetaDatalist.getList = (userId, offset) => {
        return new Promise( (resolve, reject) => {
            CustomerMetaDatalist.find({where: {userId: userId}, limit: offset.limit, skip: offset.start}, (err, result) => {
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
