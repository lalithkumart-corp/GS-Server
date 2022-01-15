 let _ = require('lodash');
 let GsError = require('../logger/gsErrorCtrl');
 

 //  "Alert",

let allModelNames = ["User", "AccessToken", "ACL", "RoleMapping", "Role", "Pledgebook", "Image", "Customer", "customerMetadataList", "PledgebookSettings", "GsUser", 
 "Interest", "JewellryOrnament", "OrnImage", "Ornament", "Note", "Common", "GsRole", "UserPreference", "Stock", "Touch", "Supplier", "ProductCode", "AppManager", 
 "Store", "FundTransaction", "FundAccount", "LoanBillTemplate", "JewelleryBillSetting", "JewelleryInvoice", "Udhaar", "UdhaarSettings"];
let actions = ['find', 'findOne', 'findById', 'changes', 'count', 'exists', 'create', 'findOrCreate', 'update', 'updateAll', 'updateOrCreate', 'upsert', 'upsertWithWhere', 'bulkUpdate', 'replaceById', 'replaceOrCreate', 'destroyById', 'destroyAll'];
 

class DataServerRouting {
    constructor() {
        
    }
    bindLogic(app, modelName) {
        let startTime = +new Date();
        let logger = app.get('logger');
        let allModels = app.models;
        let modelNames = modelName?[modelName]:allModelNames;
        _.each(modelNames, (aModelName, index) => {
            let theModel = allModels[aModelName];
            _.each(actions, (anAction, index) => {
                let methBackup = theModel[anAction];
                if(theModel[anAction] && !theModel[anAction].wrapperAttached) {
                    theModel[anAction] = async (...args) => {
                        let uniqueId = +new Date();
                        logger.info({propertyName: 'ShiftingDataServer', propertyValue: 'ReadDataServer', lbModelName: theModel.modelName, action: anAction, ARGUMENTS: args, trim: true, charLimit: 4000, stackTrace: this.stacktrace(), uid: uniqueId});
                        args = this.wrapCB(app, aModelName, anAction, uniqueId, ...args);
                        let res = methBackup.apply(theModel, [...args]);
                        if(res instanceof Promise) {
                            try {
                                let response = await res;
                                logger.info({propertyName: 'ShiftingDataServer-post-result', propertyValue: 'success', uid: uniqueId, where: 'async - after success - force-writeDataServer'});
                                return response;
                            } catch(e) {
                                logger.error(GsError.create({message: 'Exception/Error returned from DB operation', propertyName: 'ShiftingDataServer-Error-Resp', cause: e, propertyValue: {uid: uniqueId, lbModelName: theModel.modelName, action: anAction, ARGUMENTS: args, identifier: 'force-to-WriteDataServer'}}));
                                throw res;
                            } finally {
                                this.bindLogic(app, aModelName);
                            }
                        }
                    }
                    theModel[anAction].wrapperAttached = true;
                }
            });
    
            if(theModel.dataSource && theModel.dataSource.connector && theModel.dataSource.connector.query) {
                let query = theModel.dataSource.connector.query;
                if(!theModel.dataSource.wrapperAttached) {
                    theModel.dataSource.connector.query = async (...args) => {
                            let uniqueId = +new Date();
                            logger.info({propertyName: 'ShiftingDataServer', propertyValue: 'WriteDataServer', lbModelName: theModel.modelName, action:'RawSQL', ARGUMENTS: args, trim: true, charLimit: 4000, stackTrace: this.stacktrace(), uid: uniqueId});
                            args = this.wrapCB(app, aModelName, null, uniqueId, ...args);
                            let res = query.apply(theModel.dataSource.connector, [...args]);
                            if(res instanceof Promise) {
                                try {
                                    let response = await res;
                                    logger.info({propertyName: 'ShiftingDataServer-post-result', propertyValue: 'success', uid: uniqueId, where: 'async - after success - Raw SQL'});
                                    return response;
                                } catch(e) {
                                    logger.error(GsError.create({message: 'Exception/Error returned from DB operation', propertyName: 'ShiftingDataServer-Error-Resp', cause: e, propertyValue: {uid: uniqueId, ARGUMENTS: args}}));
                                    throw res;
                                } finally {
                                    this.bindLogic(app, aModelName);
                                }
                            }
                    }
                    theModel.dataSource.wrapperAttached = true;
                }
            }
        });
        let finishTime = +new Date();
        // logger.info({propertyName: 'bindRoutingPerformance', propertyValue: (finishTime-startTime)/1000 + 's', startTime: startTime, finishTime: finishTime});
    }

    wrapCB(app, aModelName, action, uniqueId, ...args) {
        let logger = app.get('logger');
        if(!args)
            return args;
        
        let argsLength = args.length;
    
        if(argsLength > 4) // args passed to any CRUD operation could be max of 4
            return args;
    
        //Args min criteria = 1 data + 1 callback is required. Have to determine the arg which has the callback
        let arg0 = args[0];
        let arg1 = args[1];
        let arg2 = args[2];
        let arg3 = args[4];
    
        let cbPosition;
        if(arg3 !== undefined && typeof arg3 == 'function')
            cbPosition = 3;
        else if(arg2 !== undefined && typeof arg2 == 'function')
            cbPosition = 2;
        else if(arg1 !== undefined && typeof arg1 == 'function')
            cbPosition = 1;
    
        if(cbPosition && args[cbPosition].name !== "wrappedCB") {
            let cb = args[cbPosition];
            let uid = uniqueId;
            let wrappedCB = (err, res) => {
                this.bindLogic(app, aModelName);
                if(err) {
                    if(logger) logger.error(GsError.create({message: 'Exception/Error returned from DB operation', propertyName: 'ShiftingDataServer-Error-Resp', cause: err, propertyValue: { lbModelName: aModelName, ARGUMENTS: args }, uid: uid}));
                    // TODO( DONE ): IMP NOTE, LOOPING is happening here on most error case. I noticed the same error code for other Mysql Error ('secure_file_priv') and it was making redo-sql call  again and again.
                    // SO checking my SQL message also now.
                    // However, on free time, add the iteration limit
                    if(err.code == "ER_OPTION_PREVENTS_STATEMENT" && err.message.indexOf('MySQL server is running with the --read-only option') != -1) {
                        logger.info({propertyName: 'ShiftingDataServer-redo-mysqlCall', propertyValue: '', uid: uniqueId, where: 'wrappedCB-Err-block'});
                        if(action)    
                            return app.models[aModelName][action](...args, {routeTo: 'writeDS'});
                        else
                            return app.models[aModelName].dataSource.dataRouter.query(...args, {routeTo: 'writeDS'});
                    } else {
                        cb(err, res);
                    }
                } else
                    if(logger) logger.info({propertyName: 'ShiftingDataServer-post-result', propertyValue: 'success', uid: uniqueId, where: 'wrappedCB', stackTrace: this.stacktrace()});
                cb(err, res);
            };
            args[cbPosition] = wrappedCB;
        }
        return args;
    }

    stacktrace() {
        let obj = {};
        Error.captureStackTrace(obj, this.stacktrace);
        var updatedStack = 'CALLSTACK :: ' + obj.stack.replace('Error', '');
        return updatedStack.substring(0, 300);
    }
}

module.exports = DataServerRouting;