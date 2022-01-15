let app = require('../server.js')
let admin = require('../firebase-service');
let path = require('path');

// Getting userId ie., Store owner's user id
const getStoreOwnerUserId = (accessToken) => {
    return new Promise( (resolve, reject) => {
        app.models.AccessToken.find({where: {id: accessToken}}, (err, res) => {
            if(err) {
                console.error(err);
                return reject(err);
            } else {
                if(res && res[0]) {
                    let userId = res[0].userId;
                    app.models.GsUser.findOne({where: {id: userId}}, (error, result) => {
                        if(error){
                            console.error(err);
                            return reject(err);
                        } else {
                            if(result && result.ownerId != 0)
                                return resolve(result.ownerId);
                            else
                                return resolve(res[0].userId);
                        }
                    });
                } else {
                    return reject(new Error('SESSION EXPIRED. Login Again...'));
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
                    console.error(err);
                    return reject(err);
                } else {
                    return resolve(result);
                }
            });
        } else {
            dataSource.connector.query(sql, (err, result) => {
                if(err) {
                    console.error(err);
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
                console.error(err);
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
            console.error(e);
            return resolve(null);
        }
    });
}

const getPictureUploadPath = () => {
    let path;
    try {
        if(process.env.NODE_ENV == 'offlineprod')
            path = process.cwd() + app.get('clientUploadsPath')
        else
            path = __dirname + app.get('clientUploadsPath')
        // console.log(`**** getPictureUploadPath -  process.env.NODE_ENV: ${process.env.NODE_ENV}, process.cwd(): ${process.cwd()}, __dirname: ${__dirname}, path: ${path}`);
    } catch(e) {
        console.error(e);
    }
    return path;
}

const getCsvStorePath = () => {
    let csvPath;
    try {
        if(process.env.NODE_ENV == 'offlineprod')
            csvPath = path.join(process.cwd(), app.get('clientCsvFolderPath'));
        else
            csvPath = path.join(__dirname, app.get('clientCsvFolderPath'));
        // console.log(`getCsvStorePath -  process.env.NODE_ENV: ${process.env.NODE_ENV}, process.cwd(): ${process.cwd()}, __dirname: ${__dirname}, path: ${csvPath}`);
    } catch(e) {
        console.error(e);
    }
    return csvPath;
}

const constructImageUrl = (path) => {
    if(path) {
        let url = '';
        try {
            url = `${app.get('externalProtocol')}://${app.get('externalDomain')}`;
            if(process.env.NODE_ENV == 'development')
                url += `:${app.get('externalPort')}${path.substring(path.indexOf('/uploads'), path.length)}`;
            else if(process.env.NODE_ENV == 'offlineprod')
                url += `:${app.get('externalPort')}${path.substring(path.indexOf('/uploads'), path.length)}`;
            else
                url += path.substring(path.indexOf('/client'), path.length);
            // console.log(`---- constructImageUrl-ForUI-Response- process.env.NODE_ENV: ${process.env.NODE_ENV}, externalProtocol: ${app.get('externalProtocol')}, externalDomain: ${app.get('externalDomain')}, pathDB: ${path}, url: ${url} `);
        } catch(e) {
            console.error(e);
        }
        return url;
    } else {
        return null;
    }
}

const constructConsoleLogFolder = () => {
    let consoleLogFolder;
    try {
        console.log(app.get('consoleLogFolder'), app.get('clientCsvFolderPath'));
        if(process.env.NODE_ENV == 'offlineprod')
            consoleLogFolder = process.cwd() + app.get('consoleLogFolder');
        else
            consoleLogFolder = __dirname + app.get('consoleLogFolder');
        // console.log(`constructConsoleLogFolder -  process.env.NODE_ENV: ${process.env.NODE_ENV}, process.cwd(): ${process.cwd()}, __dirname: ${__dirname}, path: ${consoleLogFolder}`);
    } catch(e) {
        console.error(e);
    }
    return consoleLogFolder;
} 

module.exports = {
    getStoreOwnerUserId,
    executeSqlQuery,
    getAppStatus,
    validateSSOAuthToken,
    constructImageUrl,
    getPictureUploadPath,
    getCsvStorePath,
    constructConsoleLogFolder
}