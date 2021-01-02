let app = require('../server.js')

// Getting userId ie., Store owner's user id
const getStoreOwnerUserId = (accessToken) => {
    return new Promise( (resolve, reject) => {        
        app.models.AccessToken.findOne({where: {id: accessToken}}, (err, res) => {
            if(err) {
                reject(err);
            } else {
                if(res) {
                    let userId = res.userId;
                    app.models.GsUser.findOne({where: {id: userId}}, (error, result) => {
                        if(error){
                            reject(err);
                        } else {
                            if(result.ownerId != 0)
                                resolve(result.ownerId);
                            else
                                resolve(res.userId);
                        }
                    });
                } else {
                    reject(new Error('Authorization Error'));
                }
            }
        });
    });
}

const executeSqlQuery = (dataSource, sql, arrValues) => {
    return new Promise((resolve, reject) => {
        // console.log(sql);
        if(arrValues) {
            dataSource.connector.query(sql, arrValues, (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        } else {
            dataSource.connector.query(sql, (err, result) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        }
    });   
}

module.exports = {
    getStoreOwnerUserId,
    executeSqlQuery
}