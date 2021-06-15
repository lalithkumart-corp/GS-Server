let app = require('../server.js')
let admin = require('../firebase-service');

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
                            if(result && result.ownerId != 0)
                                resolve(result.ownerId);
                            else
                                resolve(res.userId);
                        }
                    });
                } else {
                    reject(new Error('SESSION EXPIRED. Login Again...'));
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

const getAppStatus = (ownerUserId) => {
    return new Promise((resolve, reject) => {
        app.models.AppManager.find({where: {userId: ownerUserId}}, (err, res) => {
            if(err) {
                console.log(err);
                return reject(err);
            } else {
                if(res && res.length>0)
                    return resolve(res[0].status);
                else
                    return reject('NO user application found');
            }
        });
    });
}

const validateSSOAuthToken = (token) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userInfo= await admin
                                .auth()
                                .verifyIdToken(token);
            return resolve(userInfo);
        } catch(e) {
            console.log(e);
            return resolve(null);
        }
    });
}

const constructImageUrl = (path) => {
    if(path) {
        let url = `http://${app.get('domain')}`;
        if(process.env.NODE_ENV == 'development')
            url += `:${app.get('port')}${path.substring(path.indexOf('/uploads'), path.length)}`;
        else
            url += path.substring(path.indexOf('/client'), path.length);
        return url;
    } else {
        return null;
    }
}

module.exports = {
    getStoreOwnerUserId,
    executeSqlQuery,
    getAppStatus,
    validateSSOAuthToken,
    constructImageUrl
}