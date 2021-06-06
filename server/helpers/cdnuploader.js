// let app = require('./server');
let AWS = require('aws-sdk');
var fs = require('fs');

class AwsManager {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: 'AKIAQ6NJMZERB34H2OOS',
            secretAccessKey: 'lNp7hd95I5d4aiEDz0UTzpcFiqQoUGe1HPQ5/Ju9'
        });
        this.fileName = 'sample.sql';
    }
    uploadSampleFile() {
        return new Promise( (resolve, reject) => {
            fs.readFile(this.fileName, (err, data) => {
                if (err) {
                    return reject(err);
                } else {
                    const params = {
                        Bucket: 'ptr-software-bkt', // pass your bucket name
                        Key: 'sample.sql', // file will be saved as testBucket/contacts.csv
                        Body: JSON.stringify(data, null, 2)
                    };
                    this.s3.upload(params, function(s3Err, data) {
                        if (s3Err) {
                            return reject(s3Err);
                        } else {
                            console.log(`File uploaded successfully at ${data.Location}`)
                            return resolve(data.Location);
                        };
                    });
                }
            });
        });
    }
}

module.exports = AwsManager;
