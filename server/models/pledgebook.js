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
                Amount: params.amount,
                Date: params.date,
                CustomerId: params.customerId,
                Orn: params.orn,
                ImageId: params.picture.id,
                remarks: params.billRemarks,
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

    Pledgebook.getLastBillNumber = (cb) => {
        let dataSource = Pledgebook.dataSource;
        dataSource.connector.query(sql.LAST_BILL_NO, (err, result) => {
            if(err) {
                cb(err, null);                
            } else {
                cb(null, result[0].BillNo);
            }
        });
    };

    Pledgebook.remoteMethod('getLastBillNumber', {
        returns: {
            type: 'string',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/get-last-bill-number', verb: 'get'},
        description: 'For fetching metadata from Customer Data.',
    });

    Pledgebook.getPendingBills = (args, cb) => {
        let queryValues = [args.offsetStart, args.offsetEnd];
        Pledgebook.dataSource.connector.query(sql.GetPendingBills, queryValues, (err, result) => {
            if(err) {
                return cb(err, null);
            } else {
                return cb(null, result)
            }
        });
    };

    Pledgebook.remoteMethod('getPendingBills', {
        accepts: {
            arg: 'params', type: 'object', http: (ctx) => {
                var req = ctx && ctx.req;
                var args = req && req.query.args;
                var args = args ? JSON.parse(args) : {};
                return args;
            },
            description: 'Arguments goes here',
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/get-pending-bills', verb: 'get'},
        description: 'For fetching pending bills.',
    })
};

let sql = {
    LAST_BILL_NO: `SELECT BillNo FROM gs.pledgebook ORDER BY ID DESC LIMIT 1`,
    GetPendingBills: `SELECT 
                    *, pledgebook.Id AS PledgeBookID, image.ID AS ImageTableID
                FROM
                    pledgebook
                        LEFT JOIN
                    customer ON pledgebook.CustomerId = customer.CustomerId
                        LEFT JOIN
                    image ON pledgebook.ImageId = image.Id
                ORDER BY PledgeBookID DESC
                LIMIT ? , ?`
}