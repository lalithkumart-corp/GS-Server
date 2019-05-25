'use strict';
let sh = require('shorthash');

module.exports = function(Image) {
    Image.storeAndGetImageID = async (picture) => {
        try{
            let imageId = null;
            
            if(picture.imageId)
                return picture.imageId;

            let hashKey = Image.generateHashKey(picture);
            if(hashKey) {
                let alreadyExists = await Image.checkIfAlreadyExists(hashKey);
                if(alreadyExists) {
                    imageId = alreadyExists.id;
                } else {
                    picture.hashKey = hashKey;
                    imageId = await Image.saveImage(picture);                
                }
            }
            return imageId;
        } catch(e) {
            // TODO: Log error
            throw e;
        }
    }

    Image.checkIfAlreadyExists = (hashKey) => {
        return new Promise( (resolve, reject) => {
            Image.findOne({where: {hashKey: hashKey}}, (err, result) => {
                if(err) {
                    //TODO: Log the error
                    return reject(err);
                } else {
                    if(result)
                        return resolve(result);
                    else
                        return resolve(false);
                }
            });
        });        
    }

    Image.saveImage = (picture) => {
        return new Promise( (resolve, reject) => {
            Image.create({hashKey: picture.hashKey, image: picture.value, format: picture.format}, (err, result) => {
                if(err) {
                    //TODO: log the error
                    let error = new Error('Image upload Failed');
                    return reject(error);
                } else {
                    return resolve(result.id);
                }
            });
        });        
    }

    Image.generateHashKey = (params) => {
        let hashKey = sh.unique(params.value + params.format);
        return hashKey;
    }
};
