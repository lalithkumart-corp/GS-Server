'use strict';
let app = require('../server');
let addUserParamValidation = require('../utils/validateUtil').addUserParamValidation;
let utils = require('../utils/commonUtils');
let GsErrorCtrl = require('../components/logger/gsErrorCtrl');
let logger = app.get('logger');
let sha256 = require('sha256');

const DUMMY_PWD = 'G1Rv1_S0fTwArE';

module.exports = function(Gsuser) {
    
    Gsuser.on('dataSourceAttached', function() {
        delete Gsuser.validations.username; //delete Gsuser.app.models.User.validations.username;
    });

    Gsuser.loginUser = (custom, cb) => {
        Gsuser._loginUser(custom).then((resp) => {
            return cb(null, {STATUS: 'SUCCESS', RESP: resp});
        }).catch((err) => {
            return cb(err);
        });
    }

    Gsuser._loginUser = async (apiParams) => {
        try {
            let session = await Gsuser._invokeBuiltInLogin({email: apiParams.email, password: apiParams.password||DUMMY_PWD});
            let userTblRow = await Gsuser._find(session.userId);

            session.ownerId = userTblRow.ownerId;
            session.username = userTblRow.username;
            session.email = userTblRow.email;
            let setupActionsStatus = await Gsuser.checkForAnyPendingActions(userTblRow.id, userTblRow.ownerId);
            let userPreferences = await Gsuser.app.models.UserPreference._fetchFromDB(userTblRow.ownerId || userTblRow.id);
            let status = await app.models.AppManager.updateValidityTime(userTblRow.id, userTblRow.ownerId);
            session.roleId = await app.models.GsRole.prototype.findUserRoleId(userTblRow.id);
            let response = {
                session: session,
                userPreferences: userPreferences,
                applicationStatus: status,
                setupActionsStatus: setupActionsStatus
            }
            return response;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    Gsuser._invokeBuiltInLogin = (apiParams) => {
        return new Promise((resolve, reject) => {
            Gsuser.login(apiParams, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }

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

    Gsuser.ssoLogin = (apiParams, cb) => {
        Gsuser._ssoLogin(apiParams).then((resp) => {
            return cb(null, {STATUS: 'SUCCESS', RESP: resp});
        }).catch((err) => {
            return cb(err);
        });
    }
    Gsuser.remoteMethod('ssoLogin', {
        description: 'User Login.',
        accepts: {
            arg: 'apiParams',
            type: 'object',
            default: {},
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
        http: {verb: 'post', path: '/sso-login'}
    });

    Gsuser._ssoLogin = async (apiParams) => {
        try {
            let userObj = await utils.validateSSOAuthToken(apiParams.accessToken); // await Gsuser.isValidUser(apiParams);
            if(!userObj)
                throw 'Invalid Token passed from UI';
            let resp = await Gsuser._loginUser({email: userObj.email});
            await Gsuser._insertSsoToken(apiParams.accessToken, resp.session.id);
            return resp;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    Gsuser.logoutApi = (apiParams, cb) => {
        Gsuser._logoutUser(apiParams.accessToken).then((resp) => {
            return cb(null, {STATUS: 'SUCCESS', RESP: resp});
        }).catch((err) => {
            console.log(err);
            return cb(null);
        });
    }

    Gsuser.remoteMethod('logoutApi', {
        description: 'User LogOut.',
        accepts: {
            arg: 'apiParams',
            type: 'object',
            default: {},
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
        http: {verb: 'post', path: '/logout-user'}
    });

    Gsuser._logoutUser = (accessToken) => {
        return new Promise((resolve, reject) => {
            Gsuser.logout(accessToken, (err, res) => {
                if(err) {
                    console.log(err);
                    return resolve(null);
                } else {
                    console.log(res);
                    return resolve(true);
                }
            });
        });
    }

    Gsuser._findBySsoUID = (ssoUID) => {
        return new Promise((resolve, reject) => {
            Gsuser.findOne({where: {ssoUserId: ssoUID}}, (err, res) => {
                if(err)
                    return reject(err);
                else
                    return resolve(res);
            })
        });
    }

    Gsuser._insertSsoToken = (ssoToken, accessToken) => {
        return new Promise((resolve, reject) => {
            let sql = `UPDATE AccessToken SET sso_token='${ssoToken}' WHERE id='${accessToken}'`;
            Gsuser.dataSource.connector.query(sql, (err, res) => {
                if(err) {
                    console.log(err);
                    return resolve(null);
                } else {
                    console.log(res);
                    return resolve(true);
                }
            });
        });
    }

    Gsuser.remoteMethod('checkEmailExistance', {
        description: 'Validating user by email',
        accepts: {
            arg: 'apiParams',
            type: 'object',
            default: {},
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
        http: {verb: 'post', path: '/check-email-existance'}
    });

    Gsuser.checkEmailExistance = (apiParams, cb) => {
        try {
            Gsuser.find({where:{ email: apiParams.email }}, (err, res)=> {
                if(err) {
                    cb(null, {STATUS: 'ERROR', ERR: err});
                } else {
                    if(res && res.length)
                        cb(null, {STATUS: 'SUCCESS', USER_EXISTS: 1, USER_EMAIL: res[0].email});
                    else
                        cb(null, {STATUS: 'SUCCESS', USER_EXISTS: 0});
                }
            });
        } catch(e) {
            console.log(e);
            cb(null, {STATUS: 'EXCEPTION', EXCEPTION: e});
        }
    }

    Gsuser.signupNewCustomer = async (custom, cb) => {     

        try{
            let user = await Gsuser._insertUser(custom);
            await Gsuser._insertRoleMapping(user, 2);
            // await Gsuser._createPledgebookTable(user);
            // await Gsuser._createPledgebookClosingBillTable(user);
            await Gsuser._insertNewApplication(user);
            await Gsuser._insertNewStore(custom, user);
            let resp = await Gsuser._loginUser(custom);
            if(custom.isSsoUserSignup)
                await Gsuser._insertSsoToken(custom.accessToken, resp.session.id);
            return {STATUS: 'SUCCESS', RESP: resp};

            // return {STATUS: 'SUCCESS', MSG: 'New User Created Successfully!'};
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

    Gsuser.remoteMethod('signupNewCustomer', {
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

    Gsuser.addUser = async (apiParams, cb) => {
        let errors = [];
        try {
            let validationRes = addUserParamValidation(apiParams.formData);
            if(validationRes.STATUS) {
                console.log('ADD user');
                let ownerUserId = await utils.getStoreOwnerUserId(apiParams.accessToken);
                if(!ownerUserId) {
                    throw 'Owner User Id not found';
                } else {
                    let newUser = await Gsuser._insertUser({...apiParams.formData, ownerId: ownerUserId});
                    await Gsuser._insertRoleMapping(newUser, apiParams.formData.roleId);
                    console.log(newUser);
                }
            } else {
                errors.push(...validationRes.ERRORS);
                throw 'validation Errors';
            }

            return {
                STATUS: 'SUCCESS',
                MSG: "Successfully added the user"
            } 
        } catch(e) {
            if(typeof e == 'string')
                errors.push(e);
            else
                errors.push(e.message || e.msg || 'Exception occured');
            return {
                STATUS: 'ERROR',
                ERRORS: errors
            }
        }
        
    }

    Gsuser.remoteMethod('addUser', {
        description: 'Adding new User under an existing customer',
        accepts: {
            arg: 'apiParams',
            type: 'object',
            default: {
                "email": "gs@gs.com",
                "password": "admin123",
                "confirmPassword": "admin123",
                "userName": "admin"
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
        http: {verb: 'post', path: '/add-user'}
    });

    Gsuser.fetchUserList = async (accessToken, cb) => {
        try {
            let ownerUserId = await utils.getStoreOwnerUserId(accessToken);
            let usersList = await Gsuser._fetchList(ownerUserId);
            return {
                STATUS: 'success',
                USER_LIST: usersList
            }
        } catch(e) {
            return {
                STATUS: 'ERROR',
                ERROR: e,
                MSG: e.message || e.msg || 'Exception occured in fetching user List'
            }
        }
    }

    Gsuser.remoteMethod('fetchUserList', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            }],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            },
        },
        http: {verb: 'get', path: '/user-list'}
    })

    Gsuser._insertUser = (custom) => {
        return new Promise( (resolve, reject) => {
            let theParams = {
                username: custom.userName,
                ownerId: custom.ownerId || 0,
                email: custom.email,
                password: custom.password || DUMMY_PWD,
                phone: custom.phone,
                guardianName: custom.guardianName || '',
                pwd: custom.password || DUMMY_PWD,
                gateWay: custom.gateWay || 'direct',
                ssoUserId: custom.ssoUserId || '',
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

    Gsuser._insertRoleMapping = (user, roleId) => {
        return new Promise( (resolve, reject) => {
            let params = {
                principalType: "USER",
                principalId: user.id,
                roleId: roleId
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

    // Gsuser._createPledgebookTable = (user) => {
    //     return new Promise( (resolve, reject) => {
    //         let sql = pledgebookStructure;
    //         sql = sql.replace(/TABLENAME/g, 'pledgebook_'+user.id);
    //         Gsuser.dataSource.connector.query(sql, (err, resp) => {
    //             if(err) {
    //                 console.log(err);
    //                 console.log('Error occured while creating a new pledgebbok table for the user: ', user.id);
    //                 return reject(err);
    //             } else {
    //                 console.log('New Pledgebook table created!');
    //                 return resolve(true);
    //             }
    //         });
    //     });        
    // }

    // Gsuser._createPledgebookClosingBillTable = (user) => {
    //     return new Promise ( (resolve, reject) => {
    //         let sql_closed_bills = pledgebookClosedStructure;
    //         sql_closed_bills = sql_closed_bills.replace(/TABLENAME/g, 'pledgebook_closed_bills_'+user.id);
    //         sql_closed_bills = sql_closed_bills.replace(/PLEDGEBOOKTABLE/g, 'pledgebook_'+user.id);
    //         Gsuser.dataSource.connector.query(sql_closed_bills, (err, resp) => {
    //             if(err) {
    //                 console.log(err);
    //                 console.log('Error occured while creating a new pledgebook_closed_bills table for the user: ', user.id);
    //                 return reject(err);
    //             } else {
    //                 console.log('New pledgebook_closed_bills table created!');       
    //                 return resolve(true);                 
    //             }
    //         });
    //     });
    // }

    Gsuser._insertNewApplication = (user) => {
        return new Promise((resolve, reject) => {
            let shaCode = sha256(user.id.toString());
            Gsuser.app.models.AppManager.create({userId: user.id, status: 0, key: shaCode}, (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    console.log('INSERTED APPLICATION ROW');
                    return resolve(true);
                }
            });
        });
    }

    Gsuser._insertNewStore = async (apiParams, user) => {
        try {
            await Gsuser.app.models.Store._insertNewStore({storeName: apiParams.storeName, email: apiParams.email, phone: apiParams.phone, userId: user.id});
            return true;
        } catch(e) {
            return false;
        }
    }

    Gsuser._fetchList = (ownerUserId) => {
        return new Promise( (resolve, reject) => {
            let where = '';
            if(ownerUserId !== undefined)
                where = {where: {ownerId: ownerUserId}};
            Gsuser.find(where, (err, res) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    Gsuser.checkForAnyPendingActions = () => {
        try {
            // check if atleast one interest rate added?
            // check if the BillSeries + BillNumber got updated?
            return {
                interestCreated: true,
                billSeriesAndNumberUpdated: true
            }
        } catch(e) {
            console.log(e);
            return {
                interestCreated: false,
                billSeriesAndNumberUpdated: false
            }
        }
    }

    Gsuser._find = (userId) => {
        return new Promise((resolve, reject) => {
            Gsuser.findOne({where: {id: userId}}, async (err, ret) => {
                if(err)
                    return reject(err);
                else
                    return resolve(ret);
            });
        });
    }
};

let pledgebookStructure = `CREATE TABLE TABLENAME (
                                UniqueIdentifier varchar(45),
                                BillNo varchar(45) DEFAULT NULL,
                                Amount int(11) DEFAULT NULL,
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
                                Remarks text,
                                Status int(11) NOT NULL DEFAULT 1,
                                closedBillReference varchar(45) DEFAULT NULL,
                                History text,
                                CreatedDate datetime DEFAULT NULL,
                                ModifiedDate datetime DEFAULT NULL,
                                PRIMARY KEY (UniqueIdentifier)
                            ) ENGINE=InnoDB DEFAULT CHARSET=latin1;`;

let pledgebookClosedStructure = `CREATE TABLE TABLENAME (
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
                                PRIMARY KEY (pledgebook_uid),
                                KEY UniqueIdentifier_idx (pledgebook_uid),
                                CONSTRAINT TABLENAME_ibfk_1 FOREIGN KEY (pledgebook_uid) REFERENCES PLEDGEBOOKTABLE (UniqueIdentifier)
                                ) ENGINE=InnoDB DEFAULT CHARSET=latin1;`;



/** 

CREATE TABLE `gsprod-backup`.`stock_1` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `ornament` INT NULL,
  `touch_id` INT NULL,
  `i_touch` VARCHAR(45) NULL,
  `quantity` INT NULL,
  `gross_wt` FLOAT NULL,
  `net_wt` FLOAT NULL,
  `pure_wt` FLOAT NULL,
  `metal_rate` FLOAT NULL,
  `amount` FLOAT NULL,
  `cgst_percent` FLOAT NULL,
  `cgst_amt` FLOAT NULL,
  `sgst_percent` FLOAT NULL,
  `sgst_amt` FLOAT NULL,
  `igst_percent` FLOAT NULL,
  `igst_amt` FLOAT NULL,
  `total` FLOAT NULL,
  `supplierId` INT NULL,
  `personName` VARCHAR(255) NULL,
  `sold_qty` INT NULL,
  `avl_qty` INT NULL,
  PRIMARY KEY (`id`));


ALTER TABLE `gsprod-backup`.`stock_1` 
ADD INDEX `ornament_1_idx` (`ornament` ASC) VISIBLE,
ADD INDEX `touch_1_idx` (`touch_id` ASC) VISIBLE,
ADD INDEX `supplier_1_idx` (`supplierId` ASC) VISIBLE;
;
ALTER TABLE `gsprod-backup`.`stock_1` 
ADD CONSTRAINT `ornament_11`
  FOREIGN KEY (`ornament`)
  REFERENCES `gsprod-backup`.`orn_list_jewellery` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `supplier_11`
  FOREIGN KEY (`supplierId`)
  REFERENCES `gsprod-backup`.`suppliers` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `touch_11`
  FOREIGN KEY (`touch_id`)
  REFERENCES `gsprod-backup`.`touch` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;



 * 
 * 
*/