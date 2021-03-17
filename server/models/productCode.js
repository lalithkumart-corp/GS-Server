'use strict';
let app = require('../server');

module.exports = function(ProductCode) {
    ProductCode.getCodeId = (code, userId) => {
        code = code.toUpperCase();
        return new Promise((resolve, reject) => {
            let rowData = {code, userId, nextSerial: 1};
            ProductCode.findOrCreate({where: { and: [{code: code}, {userId: userId}] }}, rowData, (err, row, isCreated)=>{
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve({id: row.id, nextSerial: row.nextSerial});
                }
            });
        });
    }
    ProductCode.incrementSerialNumber = (id) => {
        return new Promise((resolve, reject) => {
            ProductCode.dataSource.connector.query(`UPDATE product_code SET next_serial=next_serial+1 where id=${id}`, (err, result) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }
}