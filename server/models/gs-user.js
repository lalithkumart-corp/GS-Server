'use strict';

module.exports = function(Gsuser) {
    Gsuser.loginUser = (custom, cb) => {
        Gsuser.login(custom, (err, res) => {
            if(err) {
                cb(err, null);
            } else {
                Gsuser.findOne({where: {id: res.userId}}, (err, ret) => {
                    if(err) {
                        cb(err, null);
                    } else {
                        res.ownerId = ret.ownerId;
                        res.username = ret.username;
                        res.email = ret.email;
                        cb(null, res);
                    }                    
                });                
            }
        });
    };

    Gsuser.remoteMethod(
        'loginUser',
        {
            description: 'User Login.',
            accepts: {
                arg: 'custom',
                type: 'object',
                default: {
                    "email": "name@domain.com",
                    "password": "password",
                },
                http: {
                    source: 'body'
                }
            },
            returns: {
                type: 'object',
                root: true,
                http: {
                    source: 'body'
                }
            },
            http: {verb: 'post', path: '/login-user'}
        }
    );

    Gsuser.addCustomer = async (custom, cb) => {     

        try{
            let user = await Gsuser._insertUser(custom);
            await Gsuser._insertRoleMapping(custom, user);
            await Gsuser._createPledgebookTable(user);
            await Gsuser._createPledgebookClosingBillTable(user);
            return {STATUS: 'SUCCESS', MSG: 'New User Created Successfully!'};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e};
        }

        /*
        let theParams = {
            username: custom.userName,
            email: custom.email,
            password: custom.password,
            phone: custom.phone,
            guardianName: custom.guardianName
        }
        Gsuser.create(theParams, (err, user) => {
            if(err) {
                console.log(err);
                return {STATUS: 'ERROR', ERROR: err};
            } else {
                let params = {
                    principalType: "USER",
                    principalId: user.id,
                    roleId: 2
                };

                Gsuser.app.models.RoleMapping.create(params, (error, roleMapInstance) => {
                    if(error) {
                        console.log(error);
                        return error;
                    } else {
                        console.log(roleMapInstance);                        
                    }
                });

                let sql = pledgebookStructure;
                sql = sql.replace(/TABLENAME/g, 'pledgebook_'+user.id);
                Gsuser.dataSource.connector.query(sql, (err, resp) => {
                    if(err) {
                        console.log('Error occured while creating a new pledgebbok table for the user: ', user.id);
                        return err;
                    } else {
                        console.log('New Pledgebook table created!');
                    }
                });

                let sql_closed_bills = pledgebookClosedStructure;
                sql_closed_bills = sql_closed_bills.replace(/TABLENAME/g, 'pledgebook_closed_bills_'+user.id);
                Gsuser.dataSource.connector.query(sql_closed_bills, (err, resp) => {
                    if(err) {
                        console.log('Error occured while creating a new pledgebook_closed_bills table for the user: ', user.id);
                        return err;
                    } else {
                        console.log('New pledgebook_closed_bills table created!');                        
                    }
                });

                return {STATUS: 'SUCCESS', MSG: 'New User Has Been Created Successfully! Other backend works is in process...'};
            }
        })
        */
    }

    Gsuser.remoteMethod('addCustomer', {
        description: 'Registering a new customer',
        accepts: {
            arg: 'custom',
            type: 'object',
            default: {
                "email": "gs@gs.com",
                "password": "admin123",
                "username": ""
            },
            http: {
                source: 'body'
            }
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {verb: 'post', path: '/add-customer'}
    });

    Gsuser._insertUser = (custom) => {
        return new Promise( (resolve, reject) => {
            let theParams = {
                username: custom.userName,
                email: custom.email,
                password: custom.password,
                phone: custom.phone,
                guardianName: custom.guardianName
            }
            Gsuser.create(theParams, (err, user) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(user);
                }
            });
        });
    };

    Gsuser._insertRoleMapping = (custom, user) => {
        return new Promise( (resolve, reject) => {
            let params = {
                principalType: "USER",
                principalId: user.id,
                roleId: 2
            };
            Gsuser.app.models.RoleMapping.create(params, (error, roleMapInstance) => {
                if(error) {
                    console.log(error);
                    return reject(error);
                } else {
                    console.log(roleMapInstance);                        
                    return resolve(roleMapInstance);
                }
            });
        });
    }

    Gsuser._createPledgebookTable = (user) => {
        return new Promise( (resolve, reject) => {
            let sql = pledgebookStructure;
            sql = sql.replace(/TABLENAME/g, 'pledgebook_'+user.id);
            Gsuser.dataSource.connector.query(sql, (err, resp) => {
                if(err) {
                    console.log('Error occured while creating a new pledgebbok table for the user: ', user.id);
                    return reject(err);
                } else {
                    console.log('New Pledgebook table created!');
                    return resolve(true);
                }
            });
        });        
    }

    Gsuser._createPledgebookClosingBillTable = (user) => {
        return new Promise ( (resolve, reject) => {
            let sql_closed_bills = pledgebookClosedStructure;
            sql_closed_bills = sql_closed_bills.replace(/TABLENAME/g, 'pledgebook_closed_bills_'+user.id);
            Gsuser.dataSource.connector.query(sql_closed_bills, (err, resp) => {
                if(err) {
                    console.log('Error occured while creating a new pledgebook_closed_bills table for the user: ', user.id);
                    return reject(err);
                } else {
                    console.log('New pledgebook_closed_bills table created!');       
                    return resolve(true);                 
                }
            });
        });
    }
};


let pledgebookStructure = `CREATE TABLE TABLENAME (
                                Id int(11) NOT NULL AUTO_INCREMENT,
                                UniqueIdentifier varchar(45) DEFAULT NULL,
                                BillNo varchar(45) DEFAULT NULL,
                                Amount int(11) DEFAULT NULL,
                                Date varchar(45) DEFAULT NULL,
                                CustomerId int(11) DEFAULT NULL,
                                Orn varchar(500) DEFAULT NULL,
                                Remarks text,
                                OrnPictureId int(11) DEFAULT NULL,
                                Status int(11) NOT NULL DEFAULT 1,
                                closedBillReference varchar(45) DEFAULT NULL,
                                History text,
                                CreatedDate datetime DEFAULT NULL,
                                ModifiedDate datetime DEFAULT NULL,
                                PRIMARY KEY (Id)
                            ) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=latin1;`;

let pledgebookClosedStructure = `CREATE TABLE TABLENAME (
                                id int(11) NOT NULL AUTO_INCREMENT,
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
                                PRIMARY KEY (id,pledgebook_uid)
                                ) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;`;