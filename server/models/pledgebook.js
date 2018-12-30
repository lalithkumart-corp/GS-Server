'use strict';

module.exports = function(Pledgebook) {

    Pledgebook.addRecordHandler = async (params, cb) => {
        try {
            params.picture.id = await Pledgebook.app.models.Image.handleImage(params.picture); //Save customer picture in Image table
            params.customerId = await Pledgebook.app.models.Customer.handleCustomerData(params); //Save customer information in Customer Table
            await Pledgebook.saveBillDetails(params); //Save ImageId, CustomerID, ORNAMENT and other Bill details in Pledgebook
            await Pledgebook.app.models.PledgebookSettings.updateLastBillDetail(params);
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
            let billNo = params.billNo;
            if(params.billSeries !== "")
                billNo = params.billSeries + "." + billNo;
            let dbInputValues = {
                UniqueIdentifier: (+ new Date()),
                BillNo: billNo,
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

    Pledgebook.getPendingBills = (args, cb) => {
        let queryValues = [args.offsetStart, args.offsetEnd];
        let query = `SELECT                         
                        *,                        
                        pledgebook.Id AS PledgeBookID,
                        image.ID AS ImageTableID
                    FROM
                        pledgebook
                            LEFT JOIN
                        customer ON pledgebook.CustomerId = customer.CustomerId
                            LEFT JOIN
                        image ON pledgebook.ImageId = image.Id`;
        
        query = Pledgebook.appendFilters(args, query);
        
        query += ` ORDER BY PledgeBookID DESC`;
        query += ` LIMIT ? , ?`;
        let promise1 = new Promise((resolve, reject) => {
            Pledgebook.dataSource.connector.query(query, queryValues, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });


        let countQuery = `SELECT                         
                            COUNT(*) AS count
                        FROM
                            pledgebook
                                LEFT JOIN
                            customer ON pledgebook.CustomerId = customer.CustomerId
                                LEFT JOIN
                            image ON pledgebook.ImageId = image.Id`;
        countQuery = Pledgebook.appendFilters(args, countQuery);
        let promise2 = new Promise((resolve, reject) => {
            Pledgebook.dataSource.connector.query(countQuery, queryValues, (err, result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        Promise.all([promise1, promise2])
            .then(
                (results) => {
                    let obj = {
                        results: results[0],
                        totalCount: results[1][0]['count']
                    }
                    return cb(null, obj);
                },
                (error) => {

                }
            )
            .catch(
                (exception) => {

                }
            )
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
    });

    Pledgebook.getQuery = () => {

    }

    Pledgebook.appendFilters = (args, query) => {
        let filterQueries = [];
        if(args.filters.billNo !== "")
            filterQueries.push(`BillNo like '${args.filters.billNo}%'`);
        if(args.filters.amount !== "")
            filterQueries.push(`amount >= ${args.filters.amount}`);
        if(args.filters.cName !== "")
            filterQueries.push(`Name like '${args.filters.cName}%'`);
        if(args.filters.gName !== "")
            filterQueries.push(`GaurdianName like '${args.filters.gName}%'`);
        if(args.filters.address !== "")
            filterQueries.push(`Address like '${args.filters.address}%'`);
        
        if(filterQueries.length != 0)
            query += ' where ' + filterQueries.join(' AND ');
        
        return query;
    }
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