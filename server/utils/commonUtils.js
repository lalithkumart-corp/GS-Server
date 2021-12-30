let app = require('../server.js')
let admin = require('../firebase-service');

// Getting userId ie., Store owner's user id
const getStoreOwnerUserId = (accessToken) => {
    return new Promise( (resolve, reject) => {
        app.models.AccessToken.find({where: {id: accessToken}}, (err, res) => {
            if(err) {
                reject(err);
            } else {
                if(res && res[0]) {
                    let userId = res[0].userId;
                    app.models.GsUser.findOne({where: {id: userId}}, (error, result) => {
                        if(error){
                            reject(err);
                        } else {
                            if(result && result.ownerId != 0)
                                resolve(result.ownerId);
                            else
                                resolve(res[0].userId);
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

const getPictureUploadPath = () => {
    console.log('1.NODE_ENV', process.env.NODE_ENV, process.cwd(), __dirname )
    if(process.env.NODE_ENV == 'offlineprod') {
        return process.cwd() + '/client/uploads/'
    } else {
        return __dirname + app.get('clientUploadsPath')
    }
}

const getCsvStorePath = () => {
    console.log('2.NODE_ENV', process.env.NODE_ENV, process.cwd(), __dirname )
    if(process.env.NODE_ENV == 'offlineprod') {
        return path.join(process.cwd(), 'client/csvfiles/file.csv'); // ../../
    } else {
        return path.join(__dirname, '../../client/csvfiles/file.csv');
    }
}

const constructImageUrl = (path) => {
    if(path) {
        let url = `${app.get('externalProtocol')}://${app.get('externalDomain')}`;
        if(process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'offlineprod')
            url += `:${app.get('externalPort')}${path.substring(path.indexOf('/uploads'), path.length)}`;
        else
            url += path.substring(path.indexOf('/client'), path.length);
        // console.log('ConstructUrl', app.get('externalProtocol'), app.get('externalDomain'), url);
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
    constructImageUrl,
    getPictureUploadPath,
    getCsvStorePath
}