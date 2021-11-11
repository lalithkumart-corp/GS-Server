'use strict';
let utils = require('../utils/commonUtils');

module.exports = function(JewelleryBillSettings) {
    JewelleryBillSettings.remoteMethod('getSettingsApi', {
        accepts: [
            {
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Arguments goes here',
            },
            {
                arg: 'category', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let category = req && req.query.category;
                    return category;
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
        description: 'Jewellery Bill Header Setting.',
    });
    JewelleryBillSettings.remoteMethod('updateSettingsApi', {
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
        http: {path: '/update-settings', verb: 'post'},
        description: 'Loan Bill Setting.',
    });
    JewelleryBillSettings.remoteMethod('getAvlJewelleryBillSettingssApi', {
        accepts: [],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/fetch-avl-jewellery-bill-templates', verb: 'get'},
        description: 'Get ALL avl Loan Bill Templates.',
    });

    JewelleryBillSettings.getSettingsApi = (accessToken, category, cb) => {
        JewelleryBillSettings.prototype._getSettingsApiByCategory({accessToken, category}).then(
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

    JewelleryBillSettings.prototype._getSettingsApi = async (params) => {
        try {
            if(!params._userId)
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let whereObj = {
                userId: params._userId,
            };
            if(params.category)
                whereObj.category = params.category;
                
            let records = await JewelleryBillSettings.find({ where: whereObj });
            if(records && records.length > 0)
                return records;
            else
                return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    JewelleryBillSettings.prototype._getSettingsApiByCategory = async (params) => {
        try {
            if(!params._userId)
                params._userId = await utils.getStoreOwnerUserId(params.accessToken);
            let whereObj = {
                userId: params._userId,
            };
            if(params.category)
                whereObj.category = params.category;
                
            let records = await JewelleryBillSettings.find({ where: whereObj });
            if(records && records.length > 0)
                return records[0];
            else
                return null;
        } catch(e) {
            console.log(e);
            throw e;
        }
    }

    JewelleryBillSettings.updateSettingsApi = (apiParams, cb) => {
        JewelleryBillSettings._updateSettingsApi(apiParams).then(
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

    JewelleryBillSettings._updateSettingsApi = async (apiParams) => {
        try {
            apiParams._userId = await utils.getStoreOwnerUserId(apiParams.accessToken);
            let records = await JewelleryBillSettings.find({where: {userId: apiParams._userId, category: apiParams.category}});
            if(records && records.length > 0) {
                
                let updateParams = {};
                if(apiParams.customCss)
                    updateParams.customCss = JSON.stringify(apiParams.customCss);
                if(apiParams.selectedTemplate)
                    updateParams.selectedTemplate = apiParams.selectedTemplate;
                if(apiParams.billSeries)
                    updateParams.billSeries = apiParams.billSeries;
                if(apiParams.billNo)
                    updateParams.billNo = apiParams.billNo;

                await JewelleryBillSettings.updateAll({userId: apiParams._userId, category: apiParams.category}, updateParams);
            }else
                await JewelleryBillSettings.create({userId: apiParams._userId, category: apiParams.category, customCss: JSON.stringify(apiParams.customCss), selectedTemplate: apiParams.selectedTemplate, billSeries: apiParams.billSeries, billNo: apiParams.billNo});
            return true;
        } catch(e) {
            console.log(e);
            throw e;
        }
    };

    JewelleryBillSettings.getAvlJewelleryBillSettingssApi = (cb) => {
        JewelleryBillSettings._getAvlJewelleryBillSettingssApi().then(
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
    }

    JewelleryBillSettings._getAvlJewelleryBillSettingssApi = () => {
        return new Promise((resolve, reject) => {
            JewelleryBillSettings.dataSource.connector.query(SQL.LIST, (err, res) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(res);
                }
            });
        });
    }
}

let SQL = {
    LIST: `SELECT * FROM jewellery_bill_avl_template_list`
}