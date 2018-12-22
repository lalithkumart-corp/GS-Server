'use strict';

module.exports = function(Pledgebooksettings) {
    Pledgebooksettings.updateLastBillDetail = (data) => {
        return new Promise((resolve, reject) => {
            Pledgebooksettings.updateAll({SNo: 1}, {billSeries: data.billSeries, lastCreatedBillNo: data.billNo}, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    Pledgebooksettings.getLastBillSeriesAndNumber = (cb) => {
        Pledgebooksettings.find({SNo: 1}, (err, result) => {
            if(err) {
                cb(err, null);                
            } else {
                let data = result[0];
                let returnVal = {
                    billSeries: data.billSeries,
                    billNo: data.lastCreatedBillNo
                };
                cb(null, returnVal);
            }
        });
        // let dataSource = Pledgebooksettings.dataSource;
        // dataSource.connector.query(sql.LAST_BILL_NO, (err, result) => {
        //     if(err) {
        //         cb(err, null);                
        //     } else {
        //         let billNo = 0;
        //         if(result[0] && result[0].BillNo)
        //             billNo = result[0].BillNo;
        //         cb(null, billNo);
        //     }
        // });
    };

    Pledgebooksettings.remoteMethod('getLastBillSeriesAndNumber', {
        returns: {
            type: 'string',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/get-last-bill-series-and-number', verb: 'get'},
        description: 'For fetching metadata from Customer Data.',
    });
};
