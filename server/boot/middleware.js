let LoopBackContext = require('loopback-context');
let app = require('../server');
const logger = app.get('logger');
const uuidv1 = require('uuid/v1');
let moment = require('moment');

module.exports = (app) => {
    app.use(monkeyPatch);
    app.use(flclMiddleware);
}

//Updating the existing res.json() method, to insert the response in "ResData" ...for logging purpose
const monkeyPatch = function(req, res, next) {
    var oldJson = res.json;
    res.json = function(obj) {
      res.resData = obj;
      oldJson.apply(this, arguments);
    }
    next();
};

//A middleware to track every api entry into the system
const flclMiddleware = function(req, res, next) {
    let ctx = LoopBackContext.getCurrentContext();

    updateContext(ctx, req);
    
    logBasicReqEntry(req);

    // req.on('canLogData', () => {
    //     logRequest(req);
    //     ctx.set('reqLogged', true);
    // });
    
    res.on('finish', function() {
        logResponse(req, res, ctx);
    });
    res.on('error', function() {
        logResponse(req, res, ctx);
    });
    
    return next();
};

const updateContext = (ctx, req) => {
    let id = uuidv1();
    ctx.set('requestId', id);
    ctx.set('inTime', +new Date());

    let rootRequestId = null;
    let forwardedRequestId = null;
    if(req.method == 'POST' && req.body) {
        if(req.body.rootRequestId)
            rootRequestId = req.body.rootRequestId;
        if(req.body.requestId)
            forwardedRequestId = req.body.requestId;
    } 
    rootRequestId = rootRequestId || id;
    ctx.set('rootRequestId', rootRequestId);
    ctx.set('forwardedRequestId', forwardedRequestId);
};


const logBasicReqEntry = (req) => {
    let logData = {};
    let context = LoopBackContext.getCurrentContext();
    logData.req = req;
    logData.newRequestEntry = true;
    logData.inTime = context.get('inTime');
    if(logData.inTime)
        logData.inTimeDate = moment(logData.inTime).format('MMM Do YYYY, hh:mm:ss.SSS');
    logger.info(logData);
}

// const logRequest = (req) => {
//     let params = {className: 'middleware', methodName: 'logRequest', isNewRequest: true, inTime: inTime, req: req};
//     logger.info(params);
// }

const logResponse = (req, res, ctx) => {
    //TODO: add more context in response log
    let params = {className: 'middleware', methodName: 'logResponse', isEndOfResponse: true};
    logger.info(params);
}