'use strict';
let utils = require('../utils/commonUtils');

module.exports = function(LoanBillTemplate) {
    LoanBillTemplate.remoteMethod('getSettingsApi', {
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
                source: 'body'
            }
        },
        http: {path: '/get-settings', verb: 'get'},
        description: 'Loan Bill Header Setting.',
    });
    LoanBillTemplate.remoteMethod('updateHeaderSettingsApi', {
        accepts: {
            arg: 'apiParams',
            type: 'object',
            default: {
                
            },
            http: {
                source: 'body',
            },
        },
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/update-header-settings', verb: 'post'},
        description: 'Loan Bill Header Setting.',
    });

    LoanBillTemplate.getSettingsApi = (accessToken, cb) => {
        LoanBillTemplate.prototype._getSettingsApi({accessToken: accessToken}).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    };

    LoanBillTemplate.prototype._getSettingsApi = async (params) => {
        try {
            if(!params._userId)
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let records = await LoanBillTemplate.find({where: {userId: params._userId}});
            if(records && records.length > 0)
                return records[0];
            else
                return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    LoanBillTemplate.updateHeaderSettingsApi = (apiParams, cb) => {
        LoanBillTemplate._updateHeaderSettingsApi(apiParams).then(
            (resp) => {
                if(resp)
                    cb(null, {STATUS: 'SUCCESS', RESP: resp});
                else
                    cb(null, {STATUS: 'ERROR', RESP: resp});
            }
        ).catch(
            (e)=> {
                cb({STATUS: 'EXCEPTION', ERR: e}, null);
            }
        );
    };

    LoanBillTemplate._updateHeaderSettingsApi = async (apiParams) => {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            let records = await LoanBillTemplate.find({where: {userId: apiParams._userId}});
            if(records && records.length > 0)
                await LoanBillTemplate.updateAll({userId: apiParams._userId}, {header: JSON.stringify(apiParams.headerSettings)});
            else
                await LoanBillTemplate.create({userId: apiParams._userId, header: JSON.stringify(apiParams.headerSettings)});
            return true;
        } catch(e) {
            console.log(e);
            throw e;
        }
    };
};
