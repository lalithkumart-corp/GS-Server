let LoopBackContext = require('loopback-context');
module.exports = (app) => {
    app.remotes().phases
        .addBefore('invoke', 'logger')
        .use(async (ctx, next) => {
            //doInitialLogging(ctx);
            next();
        });

    app.remotes().after('**', (ctx, next) => {
        next();
    });
};
