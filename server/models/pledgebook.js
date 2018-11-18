'use strict';

module.exports = function(Pledgebook) {

    Pledgebook.addRecordHandler = async (params, cb) => {
        try {
            params.picture.id = await Pledgebook.app.models.Image.handleImage(params.picture); //Save customer picture in Image table
            params.customerId = await Pledgebook.app.models.Customer.handleCustomerData(params); //Save customer information in Customer Table
            await Pledgebook.saveBillDetails(params); //Save ImageId, CustomerID, ORNAMENT and other Bill details in Pledgebook
            return {STATUS: 'success', STATUS_MSG: 'Successfully inserted new bill'};
        } catch(e) {
            return {STATUS: 'error', ERROR: e};
        }        
    }

    Pledgebook.remoteMethod('addRecordHandler', {
        accepts: {
            arg: 'params',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/add-new-billrecord', verb: 'post'},
        description: 'Adding a new record in pledgebook'
    });

    Pledgebook.saveBillDetails = (params) => {
        return new Promise( (resolve, reject) => {
            let dbInputValues = {
                UniqueIdentifier: (+ new Date()),
                BillNo: params.billNo,
                Date: params.date,
                CustomerId: params.customerId,
                Orn: params.orn,
                ImageId: params.picture.id,
                CreatedDate: new Date(),
                ModifiedDate: new Date()
            }
            Pledgebook.create(dbInputValues, (err, result) => {
                if(err) {
                    reject ( err );
                } else {
                    resolve( result );
                }
            });
        });        
    }
};
