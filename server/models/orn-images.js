'use strict';
var fs = require('fs');
let app = require('../server.js');

module.exports = function(OrnImage) {
    OrnImage.saveImage = (picture) => {
        return new Promise( (resolve, reject) => {
            OrnImage.create({hashKey: picture.hashKey, image: picture.value, format: picture.format, path: picture.path, storageMode: picture.storageMode ,options: picture.options}, (err, result) => {
                if(err) {
                    //TODO: log the error
                    let error = new Error('ORN Image upload Failed: ');
                    error += err.message;
                    return reject(error);
                } else {
                    let url = `http://${app.get('domain')}:${app.get('port')}${result.path.replace('client', '')}`;
                    return resolve({id: result.id, url: url});
                }
            });
        });        
    }

    OrnImage.getImage = (imageId) => {
        return new Promise( (resolve, reject) => {
            OrnImage.findById(imageId, (err, result) => {
                if(err)
                    return reject(err);
                else
                    return resolve(result);
            });
        });        
    }

    OrnImage.delImage = (imageRec) => {
        return new Promise( (resolve, reject) => {
            if(imageRec.storageMode == 'PATH') {
                fs.unlink(imageRec.path, (error) => {
                    if (error) return reject(error);
                    OrnImage.destroyById(imageRec.id, (err, response) => {
                        if(err)
                            return reject(err);
                        else
                            return resolve(true);
                    });
                });
            } else {
                OrnImage.destroyById(imageRec.id, (err, response) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(true);
                });
            }
            
        });
    }
};
