'use strict';
var DbBackup = require('../jobs/database-backup-job');

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
    })
};
