'use strict';
let app = require('../server.js');

module.exports = function(Supplier) {
    Supplier.getId = (storeName) => {
        return new Promise((resolve, reject) => {
            Supplier.findOrCreate( {where: {name: storeName}}, {name: storeName}, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res.id);
                }
            });
        });
    }
}