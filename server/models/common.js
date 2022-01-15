'use strict';
var DbBackup = require('../jobs/database-backup-job');
let app = require('../server');
const { resolve } = require('app-root-path');
let utils = require('../utils/commonUtils');

module.exports = function(Common) {
    Common.exportDbAPIHandler = async (accessToken, res, cb) => {
        try {
            let filename = Date.now();
            let dbBackupIntance = new DbBackup(filename);
            let response = await dbBackupIntance.start();
            if(response.STATUS == 'success')
                res.download(response.filePath+response.fileName, response.fileName);
            else
                throw new Error(response.ERROR);

        } catch(e) {
            res.send({STATUS: 'ERROR', ERROR: e});
        }
    };

    Common.remoteMethod('exportDbAPIHandler', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            }, {
                arg: 'res', type: 'object', 'http': {source: 'res'}
            }
        ],
        isStatic: true,
        returns: [
            {arg: 'body', type: 'file', root: true},
            {arg: 'Content-Type', type: 'string', http: { target: 'header' }}
          ],
        http: {path: '/export-db', verb: 'get'},
        description: 'For exporting the Full Database'
    });

    Common.remoteMethod('addTagApi', {
        accepts: {
            arg: 'apiParams',
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
        http: {path: '/add-tag', verb: 'post'},
        description: 'Add Tags.',
    });

    Common.remoteMethod('removeTagApi', {
        accepts: {
            arg: 'apiParams',
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
        http: {path: '/remove-tag', verb: 'post'},
        description: 'Add Tags.',
    });


    Common.remoteMethod('fetchBankList', {
        accepts: [],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {path: '/fetch-bank-list', verb: 'get'},
        description: 'For fetching all banks list.',
    });

    Common.remoteMethod('saveLocation', {
        accepts: {
            arg: 'apiParams',
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
        http: {path: '/save-location', verb: 'post'},
        description: 'Save user logged in Location',
    });

    Common.createNewTablesIfNotExist = async (userId) => {
        try {
            await Common._createCustomerTable(userId);
            await Common._createPledgebookTable(userId);
            await Common._createPledgebookClosingBillTable(userId);
            await Common._createStockTable(userId);
            await Common._createStockSoldTable(userId);
            await Common._createOldItemStockTable(userId);
            await Common._createInvoiceDetailTable(userId);
            await Common._createFundTrnsTable(userId);
            // await Common._createFundTrnsTempTable(userId);
            await Common._createFundTrnsProcedure(userId);
            await Common._createUdhaarTable(userId);
            return true;
        } catch(e) {
            throw e;
        }
    }

    Common.setupNewUser = async (userId) => {
        try {
            await Common._createFundAccount(userId);
            return true;
        } catch(e) {
            throw e;
        }
    }

    Common._createCustomerTable = (userId) => {
        return new Promise( (resolve, reject) => {
            let simpleSql = `SELECT * FROM customer_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.CUSTOMER_TABLE.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "customer_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "customer_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"customer_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    Common._createPledgebookTable = (userId) => {
        return new Promise( (resolve, reject) => {
            let simpleSql = `SELECT * FROM pledgebook_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.PLEDGEBOOK_TABLE.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "pledgebook_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "pledgebook_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"pledgebook_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    Common._createPledgebookClosingBillTable = (userId) => {
        return new Promise ( (resolve, reject) => {
            let simpleSql = `SELECT * FROM pledgebook_closed_bills_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.PLEDGEBOOK_CLOSED_BILLS_TABLE.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "pledgebook_closed_bills_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "pledgebook_closed_bills_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"pledgebook_closed_bills_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }


    Common._createStockTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM stock_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.STOCK_TABLE.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "stock_${userId}" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "stock_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"stock_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }
    Common._createStockSoldTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM stock_sold_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.STOCK_SOLD_TABLE.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "stocks_sold_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "stocks_sold_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"stocks_sold_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }
    Common._createOldItemStockTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM old_items_stock_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.OLD_ITEMS_STOCK.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "old_items_stock_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log('New "old_items_stock_<id>" table created!');
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"old_items_stock_<id>" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }
    Common._createInvoiceDetailTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM invoice_details_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.INVOICE_DETAIL.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "invoice_detail_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "invoice_detail_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"invoice_detail_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }
    
    Common._createFundTrnsTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM fund_transactions_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.FUND_TRANS.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "fund_transactions_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "fund_transactions_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"fund_transactions_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    /*Common._createFundTrnsTempTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM fund_trns_tmp_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.FUND_TRANS_TMP.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "fund_trns_tmp_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "fund_trns_tmp_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"fund_trns_tmp_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }*/

    Common._createFundTrnsProcedure = (userId) => {
        return new Promise((resolve, reject) => {
            let sql = SQL.FUND_TRNS_PROCEDURE.replace(/REPLACE_USERID/g, userId);
            app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                if(err) {
                    console.log(err);
                    console.log(`Error occured while creating a new "fund_trns_procedure_<id>" table for the user: ${userId}`);
                    return reject(err);
                } else {
                    console.log(`New "fund_trns_procedure_${userId}" table created!`);
                    return resolve(true);
                }
            });
        });
    }

    Common._createFundAccount = (userId) => {
        return new Promise((resolve, reject) => {
            app.models.GsUser.dataSource.connector.query(SQL.NEW_FUND_ACCOUNT, [userId, 'Shop', 1], (err, resp) => {
                if(err) {
                    console.log(err);
                    console.log(`Error occured while inserting new Fund_account for userId: ${userId}`);
                    return reject(err);
                } else {
                    console.log('Fund Account inserted');
                    return resolve(true);
                }
            });
        });
    }

    Common._createUdhaarTable = (userId) => {
        return new Promise((resolve, reject) => {
            let simpleSql = `SELECT * FROM udhaar_${userId} LIMIT 1`;
            app.models.GsUser.dataSource.connector.query(simpleSql, (error, result) => {
                if(error && error.code == "ER_NO_SUCH_TABLE") {
                    let sql = SQL.UDHAAR.replace(/REPLACE_USERID/g, userId);
                    app.models.GsUser.dataSource.connector.query(sql, (err, resp) => {
                        if(err) {
                            console.log(err);
                            console.log(`Error occured while creating a new "udhaar_<id>" table for the user: ${userId}`);
                            return reject(err);
                        } else {
                            console.log(`New "udhaar_${userId}" table created!`);
                            return resolve(true);
                        }
                    });
                } else if(error) {
                    return reject(error);
                } else {
                    console.log(`"udhaar_${userId}" table for this user:${userId} exists already, So new table not created.`);
                    return resolve(false);
                }
            });
        });
    }

    Common.fetchBankList = (cb) => {
        Common._fetchBankList().then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch((e)=>{
            cb({STATUS: 'EXCEPTION', ERR: e}, null);
        });
    }

    Common._fetchBankList = () => {
        return new Promise( async (resolve, reject) => {
            let query = `SELECT * FROM banks_list`;
            app.models.GsUser.dataSource.connector.query(query, (err, res) => {
                if(err){
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

    Common.addTagApi = (apiParams, cb) => {
        Common._addTagApi(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    Common._addTagApi = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                switch(apiParams.identifier) {
                    case 'fund_transaction':
                        await Common.app.models.FundTransaction.prototype.addTag(apiParams);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    Common.removeTagApi = (apiParams, cb) => {
        Common._removeTagApi(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    Common._removeTagApi = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                switch(apiParams.identifier) {
                    case 'fund_transaction':
                        await Common.app.models.FundTransaction.prototype.removeTag(apiParams);
                        break;
                }
                return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }

    Common.saveLocation = (apiParams, cb) => {
        Common._saveLocation(apiParams).then(
            (resp) => {
                cb(null, {STATUS: 'SUCCESS', RESP: resp});
            },
            (errResp)=> {
                cb({STATUS: 'ERROR', ERR: errResp}, null);
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    }

    // EXTERNAL CODE - CAN BE SEPARATED
    Common._saveLocation = (apiParams) => {
        return new Promise(async (resolve, reject) => {
            try {
                apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                app.models.GsUser.dataSource.connector.query(SQL.STORE_LOCATION, [apiParams.latitude, apiParams.longitude, apiParams._userId], (err, res) => {
                    if(err){
                        return reject(err);
                    } else {
                        return resolve(res);
                    }
                });
                // return resolve(true);
            } catch(e) {
                console.log(e);
                return reject(e);
            }
        });
    }
};

let SQL = {
    CUSTOMER_TABLE: `CREATE TABLE customer_REPLACE_USERID (
        CustomerId int NOT NULL AUTO_INCREMENT,
        UserId int DEFAULT NULL,
        NamePrefix varchar(45) DEFAULT NULL,
        Name varchar(255) DEFAULT NULL,
        GuardianRelation varchar(45) DEFAULT 'c/o',
        GuardianNamePrefix varchar(45) DEFAULT NULL,
        GaurdianName varchar(255) DEFAULT NULL,
        ImageId int DEFAULT NULL,
        Address varchar(255) DEFAULT NULL,
        Place varchar(255) DEFAULT NULL,
        City varchar(255) DEFAULT NULL,
        Pincode int DEFAULT NULL,
        Mobile bigint DEFAULT NULL,
        SecMobile bigint DEFAULT NULL,
        OtherDetails text,
        Notes text,
        HashKey varchar(45) DEFAULT NULL,
        CustStatus int DEFAULT '1',
        CreatedAt datetime DEFAULT NULL,
        ModifiedAt datetime DEFAULT NULL,
        PRIMARY KEY (CustomerId)
      )`,
    PLEDGEBOOK_TABLE: `CREATE TABLE pledgebook_REPLACE_USERID (
                            UniqueIdentifier varchar(45),
                            BillNo varchar(45) DEFAULT NULL,
                            Amount int(11) DEFAULT NULL,
                            PresentValue int(11) DEFAULT 0,
                            Date varchar(45) DEFAULT NULL,
                            CustomerId int(11) DEFAULT NULL,
                            Orn text DEFAULT NULL,
                            OrnPictureId int(11) DEFAULT NULL,
                            OrnCategory varchar(45) NULL,
                            TotalWeight FLOAT NOT NULL DEFAULT 0.00,
                            IntPercent FLOAT NULL DEFAULT 0,
                            IntVal FLOAT NULL DEFAULT 0,
                            OtherCharges FLOAT NULL DEFAULT 0,
                            LandedCost FLOAT NULL DEFAULT 0,
                            PaymentMode int(11) DEFAULT 1,
                            Remarks text,
                            Status int(11) NOT NULL DEFAULT 1,
                            closedBillReference varchar(45) DEFAULT NULL,
                            History text,
                            ExpiryDate datetime DEFAULT NULL,
                            Alert int(11) DEFAULT NULL,
                            Archived int(11) DEFAULT 0,
                            Trashed int(11) DEFAULT 0,
                            CreatedDate datetime DEFAULT NULL,
                            ModifiedDate datetime DEFAULT NULL,
                            PRIMARY KEY (UniqueIdentifier)
                        ) ENGINE=InnoDB DEFAULT CHARSET=latin1`,
    PLEDGEBOOK_CLOSED_BILLS_TABLE: `CREATE TABLE pledgebook_closed_bills_REPLACE_USERID (
                                        uid BIGINT(20) NOT NULL,
                                        pledgebook_uid varchar(45) NOT NULL,
                                        bill_no varchar(45) NOT NULL,
                                        pledged_date varchar(45) DEFAULT NULL,
                                        closed_date varchar(45) DEFAULT NULL,
                                        principal_amt int(50) DEFAULT NULL,
                                        no_of_month int(20) DEFAULT NULL,
                                        rate_of_interest varchar(45) DEFAULT NULL,
                                        int_rupee_per_month varchar(45) DEFAULT NULL,
                                        interest_amt varchar(45) DEFAULT NULL,
                                        actual_estimated_amt varchar(45) DEFAULT NULL,
                                        discount_amt varchar(45) DEFAULT NULL,
                                        paid_amt varchar(45) DEFAULT NULL,
                                        handed_over_to_person varchar(100) DEFAULT NULL,
                                        payment_mode int(11) DEFAULT 1,
                                        remarks text,
                                        PRIMARY KEY (pledgebook_uid),
                                        KEY UniqueIdentifier_idx (pledgebook_uid),
                                        CONSTRAINT pledgebook_closed_bills_ibfk_REPLACE_USERID FOREIGN KEY (pledgebook_uid) REFERENCES pledgebook_REPLACE_USERID (UniqueIdentifier)
                                        ) ENGINE=InnoDB DEFAULT CHARSET=latin1`,
    STOCK_TABLE: `CREATE TABLE stock_REPLACE_USERID (
                    id int NOT NULL AUTO_INCREMENT,
                    date datetime DEFAULT CURRENT_TIMESTAMP,
                    user_id int DEFAULT NULL,
                    ornament int DEFAULT NULL,
                    pr_code varchar(45) DEFAULT NULL,
                    pr_number varchar(45) DEFAULT NULL,
                    prod_id varchar(45) DEFAULT NULL,
                    touch_id int DEFAULT NULL,
                    i_touch varchar(45) DEFAULT NULL,
                    quantity int DEFAULT NULL,
                    gross_wt float DEFAULT NULL,
                    net_wt float DEFAULT NULL,
                    pure_wt float DEFAULT NULL,
                    labour_charge float DEFAULT '0',
                    labour_charge_unit varchar(45) DEFAULT 'FX',
                    calc_labour_amt float DEFAULT '0',
                    metal_rate float DEFAULT NULL,
                    amount float DEFAULT NULL,
                    cgst_percent float DEFAULT NULL,
                    cgst_amt float DEFAULT NULL,
                    sgst_percent float DEFAULT NULL,
                    sgst_amt float DEFAULT NULL,
                    igst_percent float DEFAULT NULL,
                    igst_amt float DEFAULT NULL,
                    total float DEFAULT NULL,
                    supplierId int DEFAULT NULL,
                    personName varchar(255) DEFAULT NULL,
                    avl_qty int DEFAULT NULL,
                    sold_qty int DEFAULT NULL,
                    sold_g_wt decimal(6,3) DEFAULT NULL,
                    sold_n_wt decimal(6,3) DEFAULT NULL,
                    sold_p_wt decimal(6,3) DEFAULT NULL,
                    invoice_ref varchar(45) DEFAULT NULL,
                    avl_g_wt decimal(6,3) DEFAULT NULL,
                    avl_n_wt decimal(6,3) DEFAULT NULL,
                    avl_p_wt decimal(6,3) DEFAULT NULL,
                    created_date datetime DEFAULT CURRENT_TIMESTAMP,
                    modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY prod_id_UNIQUE (prod_id),
                    KEY touch_idx (touch_id),
                    KEY supplier_idx (supplierId),
                    KEY ornament_idx (ornament),
                    CONSTRAINT ornament_ibfk_REPLACE_USERID FOREIGN KEY (ornament) REFERENCES orn_list_jewellery (id),
                    CONSTRAINT supplier_ibfk_REPLACE_USERID FOREIGN KEY (supplierId) REFERENCES suppliers (id),
                    CONSTRAINT touch_ibfk_REPLACE_USERID FOREIGN KEY (touch_id) REFERENCES touch (id)
                )`,
    STOCK_SOLD_TABLE: `CREATE TABLE stock_sold_REPLACE_USERID (
                    id int NOT NULL AUTO_INCREMENT,
                    uid VARCHAR(45) NOT NULL,
                    date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    prod_id varchar(45) DEFAULT NULL,
                    metal_rate int DEFAULT NULL,
                    retail_rate int DEFAULT NULL,
                    ornament int DEFAULT NULL,
                    qty int DEFAULT NULL,
                    gross_wt float DEFAULT NULL,
                    net_wt float DEFAULT NULL,
                    pure_wt float DEFAULT NULL,
                    wastage float DEFAULT NULL,
                    wastage_val float DEFAULT NULL,
                    labour float DEFAULT NULL,
                    cgst_percent float DEFAULT NULL,
                    cgst_amt float DEFAULT NULL,
                    sgst_percent float DEFAULT NULL,
                    sgst_amt float DEFAULT NULL,
                    discount float DEFAULT NULL,
                    total float DEFAULT NULL,
                    invoice_ref varchar(45) DEFAULT NULL,
                    created_date datetime DEFAULT CURRENT_TIMESTAMP,
                    modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    KEY invoice_ref_idx (invoice_ref),
                    KEY prod_id_idx (prod_id)
                )`,
    OLD_ITEMS_STOCK: `CREATE TABLE old_items_stock_REPLACE_USERID (
                        id int NOT NULL AUTO_INCREMENT,
                        item_type varchar(45) DEFAULT NULL,
                        gross_wt float DEFAULT NULL,
                        net_wt float DEFAULT NULL,
                        wastage_val float DEFAULT NULL,
                        applied_retail_rate float DEFAULT NULL,
                        price float DEFAULT NULL,
                        invoice_ref  varchar(45) DEFAULT NULL,
                        created_date datetime DEFAULT CURRENT_TIMESTAMP,
                        modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        KEY invoice_ref_idx (invoice_ref)
                    )`,
    INVOICE_DETAIL: `CREATE TABLE jewellery_invoice_details_REPLACE_USERID (
                        id int NOT NULL AUTO_INCREMENT,
                        ukey varchar(45) DEFAULT NULL,
                        cust_id int DEFAULT NULL,
                        action varchar(45) DEFAULT NULL,
                        paid_amt float DEFAULT NULL,
                        balance_amt float DEFAULT NULL,
                        payment_mode varchar(45) DEFAULT NULL,
                        raw_payment_data text,
                        created_date datetime DEFAULT CURRENT_TIMESTAMP,
                        modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        UNIQUE KEY uid_UNIQUE (ukey),
                        KEY cust_id_idx (cust_id)
                    )`,
    FUND_TRANS: `CREATE TABLE fund_transactions_REPLACE_USERID (
                    id int NOT NULL AUTO_INCREMENT,
                    user_id int NOT NULL,
                    customer_id int DEFAULT NULL,
                    account_id int DEFAULT NULL,
                    transaction_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    gs_uid varchar(45) DEFAULT NULL,
                    cash_in int NOT NULL DEFAULT '0',
                    cash_out int DEFAULT '0',
                    category varchar(45) DEFAULT NULL,
                    remarks text,
                    deleted tinyint DEFAULT '0',
                    created_date datetime DEFAULT CURRENT_TIMESTAMP,
                    modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                    cash_out_mode varchar(45) DEFAULT NULL,
                    cash_out_to_bank_id int DEFAULT NULL,
                    cash_out_to_bank_acc_no varchar(45) DEFAULT NULL,
                    cash_out_to_bank_ifsc varchar(45) DEFAULT NULL,
                    cash_out_to_upi varchar(45) DEFAULT NULL,
                    cash_in_mode varchar(45) DEFAULT NULL,
                    alert int DEFAULT NULL,
                    is_internal int DEFAULT 0,
                    tag_indicator INT NULL,
                    PRIMARY KEY (id),
                    KEY category (category),
                    KEY gs_uid_idx (gs_uid)
                    )`,
    FUND_TRANS_TMP: `CREATE TABLE fund_trns_tmp_REPLACE_USERID (
                        id int NOT NULL,
                        transaction_date datetime NOT NULL,
                        user_id int NOT NULL,
                        account_id int NOT NULL,
                        gs_uid varchar(45) DEFAULT NULL,
                        category varchar(200) NOT NULL,
                        remarks text,
                        deleted int DEFAULT NULL,
                        cash_in decimal(10,0) DEFAULT NULL,
                        cash_out decimal(10,0) DEFAULT NULL,
                        created_date datetime DEFAULT NULL,
                        modified_date datetime DEFAULT NULL,
                        cash_out_mode varchar(45) DEFAULT NULL,
                        cash_out_to_bank_id int DEFAULT NULL,
                        cash_out_to_bank_acc_no varchar(45) DEFAULT NULL,
                        cash_out_to_bank_ifsc varchar(45) DEFAULT NULL,
                        cash_out_to_upi varchar(45) DEFAULT NULL,
                        cash_in_mode varchar(45) DEFAULT NULL,
                        alert int DEFAULT NULL,
                        is_internal int DEFAULT 0,
                        beforeBal decimal(10,0) DEFAULT NULL,
                        afterBal decimal(10,0) DEFAULT NULL
                    )`,
    FUND_TRNS_PROCEDURE: `CREATE PROCEDURE fund_trns_procedure_REPLACE_USERID(IN Date1 varchar(100), IN Date2 varchar(100), IN UserId int(20))
            BEGIN
            
            
            DROP TABLE IF EXISTS fund_trns_tmp_REPLACE_USERID;
            
            CREATE TABLE fund_trns_tmp_REPLACE_USERID (
                id INT NOT NULL,
                transaction_date DATETIME NOT NULL,
                user_id INT NOT NULL,
                account_id INT NOT NULL,
                customer_id INT NULL,
                gs_uid VARCHAR(45) NULL,
                category VARCHAR(200) NOT NULL,
                remarks TEXT NULL,
                deleted INT NULL,
                cash_in DECIMAL NULL,
                cash_out DECIMAL NULL,
                created_date DATETIME NULL,
                modified_date DATETIME NULL,
                cash_out_mode VARCHAR(45) NULL,
                cash_out_to_bank_id INT NULL,
                cash_out_to_bank_acc_no VARCHAR(45) NULL,
                cash_out_to_bank_ifsc VARCHAR(45) NULL,
                cash_out_to_upi VARCHAR(45) NULL,
                cash_in_mode VARCHAR(45) NULL,
                alert INT NULL,
                is_internal INT NULL,
                tag_indicator INT NULL,
                beforeBal DECIMAL NULL,
                afterBal DECIMAL NULL
            );
            
            
            INSERT INTO fund_trns_tmp_REPLACE_USERID (id, transaction_date, user_id, account_id, customer_id, gs_uid, category, remarks, deleted, cash_in, cash_out, created_date, modified_date, cash_out_mode, cash_out_to_bank_id, cash_out_to_bank_acc_no, cash_out_to_bank_ifsc, cash_out_to_upi, cash_in_mode, alert, is_internal, tag_indicator)
            SELECT
                id,
                transaction_date,
                user_id,
                account_id,
                customer_id,
                gs_uid,
                category,
                remarks,
                deleted,
                cash_in,
                cash_out,
                created_date,
                modified_date,
                cash_out_mode,
                cash_out_to_bank_id,
                cash_out_to_bank_acc_no,
                cash_out_to_bank_ifsc,
                cash_out_to_upi,
                cash_in_mode,
                alert,
                is_internal,
                tag_indicator
            FROM
                fund_transactions_REPLACE_USERID
            WHERE
                deleted = 0
                AND(transaction_date BETWEEN Date1
                    AND Date2)
            ORDER BY
                transaction_date ASC;
            
            
            SET @bal = (
            SELECT
                IFNULL(SUM(cash_in - cash_out), 0) AS openingBalByPage
                FROM
                    fund_transactions_REPLACE_USERID
                WHERE
                    deleted = 0
                    AND transaction_date < Date1);
            
            UPDATE
                fund_trns_tmp_REPLACE_USERID
            SET
                beforeBal = @bal,
                afterBal = (@bal:=@bal + (fund_trns_tmp_REPLACE_USERID.cash_in - fund_trns_tmp_REPLACE_USERID.cash_out));
            
            END`,
    NEW_FUND_ACCOUNT: `INSERT INTO fund_accounts (user_id, name, is_default) VALUES (?,?,?)`,
    UDHAAR: `CREATE TABLE udhaar_REPLACE_USERID (
                id int NOT NULL AUTO_INCREMENT,
                unique_identifier varchar(45) DEFAULT NULL,
                bill_no varchar(45) DEFAULT NULL,
                amount int DEFAULT NULL,
                date datetime NOT NULL,
                account_id int NOT NULL,
                customer_id int NOT NULL,
                notes text,
                status int NULL DEFAULT 1,
                trashed int DEFAULT NULL,
                created_date datetime DEFAULT CURRENT_TIMESTAMP,
                modified_date datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY unique_identifier_UNIQUE (unique_identifier),
                UNIQUE KEY bill_no_UNIQUE (bill_no)
              )`,
    STORE_LOCATION: `INSERT INTO analytics_locations (latitude, longitude, user_id) VALUES (?,?,?)`
}
