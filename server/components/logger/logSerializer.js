let GsError = require('./gsError');

class LogSerializer {
    constructor() {
        this.req = this.requestSerializer(),
        this.res = this.responseSerializer(),
        this.err = this.errorSerializer()
    }

    requestSerializer() {
        return( (req) => {
            let returnVal = null;
            if (!req)
                returnVal = req;
            else if(!req.connection)
                returnVal = {custom: JSON.stringify(req, undefined, 4)};
            else {
                returnVal={
                    method: req.method,
                    baseUrl: req.baseUrl,
                    url: req.url,
                    headers: JSON.stringify(req.headers, undefined, 4),
                    remoteAddress: req.connection.remoteAddress,
                    remotePort: req.connection.remotePort,
                    body: JSON.stringify(req.body, undefined, 4)
                };
            }
            return returnVal;
        });
    }

    responseSerializer() {
        return( (res) => {
            let returnVal = null;
            if (!res)
                returnVal = res;
            else if(!res.statusCode)
                returnVal = {custom: JSON.stringify(res, undefined, 4)};
            else {
                returnVal = {
                    statusCode: res.statusCode,
                    header: res._header,
                    resData: JSON.stringify(res.resData, undefined, 4)
                };
            }
            return returnVal;
        });
    }

    errorSerializer() { // CHECK:  Seems error serializer will not be invoked(since the custom error library will wrap error in cause)
        return( (err) => {
            if (!(err instanceof Error)) {
                return err;
            }
            let logErrorObj = {};
               
            if (err instanceof GsError) {
                if (err.className) logErrorObj.className = (err.className)?(err.className.toLowerCase()):'';
                if (err.methodName) logErrorObj.methodName = err.methodName;
                if (err.propertyName) logErrorObj.propertyName = err.propertyName;
                if (err.propertyValue) logErrorObj.propertyValue = err.propertyValue;
            }
            logErrorObj.message = err.message;
            logErrorObj.name = err.name;
            logErrorObj.code = err.code;
            logErrorObj.signal = err.signal;
            logErrorObj.stack = err.stack;
            return logErrorObj;
        });
    }
}

module.exports = LogSerializer;