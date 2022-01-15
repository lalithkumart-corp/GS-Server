let LoopBackContext = require('loopback-context');
let DataServerRouting = require('../components/dbrouting/dbrouting');

module.exports = (app) => {
    // app.remotes().phases
    //     .addBefore('invoke', 'DS-Router')
    //     .use(async (ctx, next) => {
    //         if(!ctx.req._boundDSRouterLogic)
    //             new DataServerRouting().bindLogic(app);
    //         next();
    //     });
    
    // app.remotes().phases
    //     .addBefore('invoke', 'logger')
    //     .use(async (ctx, next) => {
    //         //doInitialLogging(ctx);
    //         console.log('------------');
    //         next();
    //     });

    // app.remotes().after('**', (ctx, next) => {
    //     next();
    // });
};
