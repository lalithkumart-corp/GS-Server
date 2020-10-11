'use strict';
let _ = require('lodash');

module.exports = function(Note) {
    Note.fetchByCustomerId = async (accessToken, customerId) => {
        try{
            let bucket = await Note.prototype.fetchNotes(customerId);
            return {STATUS: 'SUCCESS', DATA: bucket};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }  
    }

    Note.prototype.fetchNotes = (customerId) => {
        return new Promise( (resolve, reject) => {
            Note.find({where: {customerId: customerId}}, (err, response) => {
                if(err) {
                    reject(err);
                } else {                   
                    resolve(response);                    
                }
            });
        });        
    }

    Note.remoteMethod('fetchByCustomerId', {
        accepts: [{
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let accessToken = req && req.query.access_token;
                    return accessToken;
                },
                description: 'Accesstoken',
            },
            {
                arg: 'customerId', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let customerId = req && req.query.customer_id;
                    return customerId;
                },
                description: 'customerId',
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body',
            }
        },
        http: {path: '/fetch-notes', verb: 'get'},
        description: 'For fetching Notes/Remarks of the Customer'
    })
    
};
