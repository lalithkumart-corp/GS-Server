let GsError = require('./gsError');
let GsValidation = require('./gsValidationError');

const create = (args, errType = 'default') => {
    args = parseIncomingArgs(args);
    
    let errInstance;
    if(errType == 'validation')
        errInstance = new GsValidation(args);
    else if(args.cause && args.cause.constructor.name == 'GsValidation')
        errInstance = new GsValidation(args);
    else
        errInstance = new GsError(args);
    return errInstance;
}

const parseIncomingArgs = (args) => {
    if(typeof args == 'string') // args == string
        args = {cause: new Error(args), message: ''};
    else if(typeof args == 'object') {
        if(args.constructor.name == "Error") // args == Error
            args = {cause: args, message: ''};
        else if(args.constructor.name == 'Object') { //  args == Object
            if(typeof args.cause == 'string' || typeof args.cause == 'number' || typeof args.cause == 'boolean') { // args.cause == string
                args.cause = new Error(args.cause);
            } else if(typeof args.cause == 'object') {
                if(args.cause.constructor.name == 'Object') // args.cause == Object
                    args.cause = new Error(JSON.stringify(args.cause));
                else if(args.cause.constructor.name == 'Array') // args.cause == Array
                    args.cause = new Error(JSON.stringify(args.cause));
            }
        } else if(args.constructor.name == 'Array') {
            console.log('TODO');
        }
        if(args.appendChildMsg)
            args.message = (args.message || '') + args.cause.message;
    }
    return args;
}

module.exports = {
    createErr: create
};

/** TEST cases
 * 
let GsLogger = require('./components/logger/gsLogger');
app.set('logger', new GsLogger());
let createErr = require('./components/logger/gsErrorCtrl').createErr;
let logger = app.get('logger');


  let yy = createErr({className: 'server', cause:'Hello world', message: 'yy1 man'}, 'validation');
  let yy2 = createErr({className: 'server', cause: new Error('Child meth2'), message: 'yy2 man' });
  let yy3 = createErr({className: 'server', cause: {a: 1} , message: 'yy3 man'});
  let yy4 = createErr({className: 'server', cause: yy, message: 'yy4 man' });
  let yy5 = createErr({className: 'server', cause: yy2, message: 'yy5 man' });
  let yy6 = createErr({className: 'server', cause: yy3, message: 'yy6 man' });
  let yy7 = createErr({className: 'server', cause: yy5, message: 'yy7 man', appendChildMsg: true });
  let yy8 = createErr({className: 'server', cause: yy7, message: 'yy8 man', appendChildMsg: true });
  logger.error(yy);
  logger.error(yy2);
  logger.error(yy3);
  logger.error(yy4);
  logger.error(yy5);
  logger.error(yy6);
  logger.error(yy7);
  logger.error(yy8);
 */