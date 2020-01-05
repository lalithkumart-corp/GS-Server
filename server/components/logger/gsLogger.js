let app = require('../../server');
let appRoot = require('app-root-path');
let defaultLogDir = appRoot + '/server/logs';
let LoopBackContext = require('loopback-context');
let Logger = require('./logger');

class GsLogger {
    constructor(args) {
        this.logFilePath = (args?args.logFilePath:null) || defaultLogDir;

        if(args && args.logger)
            this.logger = args.logger;

        //Return Logger obj instance from 'app' object, to prevent multiple instances of logger.
        if(!this.logger)
            this.logger = app.get(this.logFilePath) || app.get('logger');

        //Check whether the Logger obj exists and also check with the logFilePath. If logger obj with same logFilePath exists, then no need for creating another instance with the same logFilePath.
        if (!this.logger || (this.logger && this.logger.logFilePath != this.logFilePath)){
            this.logger = new Logger(this.logFilePath).createLogger();
            this.logger.info(this.beforeLog({identifier: 'newLoggerInstance', message: 'New Logger Instance Created', logFilePath: this.logFilePath, stackTrace: this.getStackTrace(), processId: process.pid}));
            app.set(this.logFilePath, this);
        }
    }

    trace(args) {
        this.logger.trace(this.beforeLog(args));
    }

    debug(args) {
        this.logger.debug(this.beforeLog(args));
    }
    
    info(args) {
        this.logger.info(this.beforeLog(args));
    }
    
    warn(args) {
        this.logger.warn(this.beforeLog(args));
    }

    error(args) {
        this.logger.error(this.beforeLog(args));
    }

    fatal(args) {
        this.logger.fatal(this.beforeLog(args));
    }

    beforeLog(data) {
        try {
            let requestId = this.getRequestId(data);
            if(data) {
                if(typeof data == 'object') {
                    data = this.cleanObj(data);
                    data.requestId = requestId;
                } else if(typeof data == 'string' || typeof data == 'Number') {
                    let msgText = data;
                    data = {
                        message: msgText,
                        requestId: requestId,
                    };
                };
            }
        } catch(e) {
            console.error(e);
        }finally{
            return data;
        };
    }

    cleanObj(data) {
        let cleanedObj = {};
        try{
            /**
             * The 'data' might have 'non-enumerable' properties.
             * The normal loop methods like 'forLoop' or '_.each" will not look on the non-enumerable properties, and hence those properties will get skipped in our log information.
             * Hence, we are Iterating 'data' using Object.getOwnPropertyNames().forEach(()=>{}) syntax (to iterate over non-enumerable properties as well)
             * Ex: 'GsError' object instance has a property named 'stack', which is non-enumerable
             */
            Object.getOwnPropertyNames(data).forEach((key) => {
                let propVal = data[key];
                if(this.displayInRootLevel(key)) {
                    if(typeof propVal == 'object' && this.canStringify(key))
                        cleanedObj[key] = JSON.stringify(propVal, this.replacer, 4);
                    else
                        cleanedObj[key] = propVal;
                } else {
                    cleanedObj.message = cleanedObj.message || {};
                    cleanedObj.message[key] = propVal;
                }
            });
            cleanedObj.message = JSON.stringify(cleanedObj.message, this.replacer, 4);
        } catch(e) {
            cleanedObj['logdata-parse-error'] = true;
            cleanedObj['logdata-parse-error-msg'] = e.message;
            cleanedObj['logdata-parse-error-stack'] = e.stack;
        } finally {
            return cleanedObj;
        }
    }
    
    replacer(key, data) {
        
        /**
         * ERROR object is non-enumerable, and JSON.stringify() could not able to return stringified version of it.
         * So, using Object.getOwnPropertyNames().forEach(()=>{}), cloning its non-enumerable properties into other object as enumerable properties, and returning that new object.
         */
        if(data instanceof Error) {
            let cleanData = {};
            Object.getOwnPropertyNames(data).forEach((key) => {
                cleanData[key] = data[key];
            });
            data = cleanData;
        } else if(typeof data == 'string') { // If its already stringified object, then parse it(since the parent stringify will take care of stringifying it)            
            try{
                data = JSON.parse(data);
            } catch(e) {
                data = data;
            }
        }

        return data;
    }

    isBlackListed(key) {
        let isBlackListed = false;
        if(blacklistKeys.indexOf(key) !== -1)
            isBlackListed = true;
        return isBlackListed;
    }

    displayInRootLevel(key) {
        let rootLevels = [
            'userAgent', 'host',
            'req', 'res', 'err',
            'appId', 'userId', 'customerName', 'storeName', 'customerId', 'customerKey',
            'className', 'methodName', 'propertyValue', 'propertyName', 'level', 'errorType'
        ];
        if(rootLevels.indexOf(key) != -1)
            return true;
        else
            return false;
    }

    canStringify(key) {
        let stringifyProps = [
            'propertyValue',
        ];
        if(stringifyProps.indexOf(key) != -1)
            return true;
        else
            return false;
    }

    setRequestId(requestId){
        this.requestId = requestId || null;
    }

    getRequestId(data){
        let requestId = null;
        let ctx = LoopBackContext.getCurrentContext();
        if(ctx)
            requestId = ctx.get('requestId') || '';
        else
            requestId = this.requestId;
        return requestId;
    }

    getStackTrace(){
        let obj = {};
        Error.captureStackTrace(obj, this.getStackTrace);
        return obj.stack;
    }
}

module.exports = GsLogger;