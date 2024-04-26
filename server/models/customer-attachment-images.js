'use strict';
var fs = require('fs');
let app = require('../server.js');
let utils = require('../utils/commonUtils.js');

module.exports = function(CustAttachmentImage) {
    CustAttachmentImage.saveImage = (picture) => {
        return new Promise( (resolve, reject) => {
            CustAttachmentImage.create({
                hashKey: picture.hashKey, 
                image: picture.value, 
                format: picture.format, 
                path: picture.path, 
                storageMode: picture.storageMode,
                options: picture.options,
                caption: picture.caption
            }, (err, result) => {
                if(err) {
                    //TODO: log the error
                    let error = new Error('Customer Attachment Image upload Failed: ');
                    error += err.message;
                    return reject(error);
                } else {
                    // let url = `http://${app.get('domain')}:${app.get('port')}${result.path.replace('client', '')}`;
                    let url = utils.constructImageUrl(result.path);
                    return resolve({id: result.id, url: url});
                }
            });
        });        
    }

    CustAttachmentImage.getImage = (imageId) => {
        return new Promise( (resolve, reject) => {
            CustAttachmentImage.findById(imageId, (err, result) => {
                if(err)
                    return reject(err);
                else
                    return resolve(result);
            });
        });        
    }

    CustAttachmentImage.delImage = (imageRec) => {
        return new Promise( (resolve, reject) => {
            if(imageRec.storageMode == 'PATH') {
                fs.unlink(imageRec.path, (error) => {
                    if (error) return reject(error);
                    CustAttachmentImage.destroyById(imageRec.id, (err, response) => {
                        if(err)
                            return reject(err);
                        else
                            return resolve(true);
                    });
                });
            } else {
                CustAttachmentImage.destroyById(imageRec.id, (err, response) => {
                    if(err)
                        return reject(err);
                    else
                        return resolve(true);
                });
            }
            
        });
    }
};
