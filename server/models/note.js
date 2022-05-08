'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');

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
            // Note.find({where: {customerId: customerId}}, (err, response) => {
            let sql = SQL.FETCH;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            Note.dataSource.connector.query(sql, [customerId], (err, response) => {
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
    });

    Note.remoteMethod('insertNewNote', {
        accepts: [{
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let authToken = null;
                    if(req && req.headers.authorization)
                        authToken = req.headers.authorization || req.headers.Authorization;
                    return authToken;
                },
                description: 'Access Token',
            }, {
                arg: 'params', type: 'object', default: {}, http: {source: 'body'}
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/insert', verb: 'post'},
        description: 'Adding a new note'
    });

    Note.remoteMethod('updateNote', {
        accepts: [{
                arg: 'accessToken', type: 'string', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let authToken = null;
                    if(req && req.headers.authorization)
                        authToken = req.headers.authorization || req.headers.Authorization;
                    return authToken;
                },
                description: 'Access Token',
            }, {
                arg: 'params', type: 'object', default: {}, http: {source: 'body'}
            }
        ],
        returns: {
            type: 'object',
            root: true,
            http: {
                source: 'body'
            }
        },
        http: {path: '/update-note', verb: 'put'},
        description: 'Update note'
    });

    Note.insertNewNote = (accessToken, params, cb) => {
        Note._insertNewNote(accessToken, params.customerId, params.custKey, params.content).then(
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

    Note._insertNewNote = (accessToken, customerId, custKey, content) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.INSERT_NEW_NOTE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            Note.dataSource.connector.query(sql, [customerId, custKey, content], (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        });
    }

    Note.updateNote = (accessToken, params, cb) => {
        Note._updateNote(accessToken, params.content, params.noteId).then(
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

    Note._updateNote = (accessToken, content, noteId) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.UPDATE_NOTE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            Note.dataSource.connector.query(sql, [content, noteId], (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        })
    }
};

let SQL = {
    FETCH: `SELECT * FROM notes_REPLACE_USERID WHERE CustomerId=?`,
    INSERT_NEW_NOTE: `INSERT INTO notes_REPLACE_USERID (CustomerId, CustomerHashKey, Notes) VALUES (?, ?, ?)`,
    UPDATE_NOTE: `UPDATE notes_REPLACE_USERID SET Notes=? WHERE Id=?`
};
