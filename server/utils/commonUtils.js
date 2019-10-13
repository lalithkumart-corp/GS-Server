let app = require('../server.js')

// Getting userId ie., Store owner's user id
const getStoreUserId = (accessToken) => {
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

module.exports = {
    getStoreUserId
}