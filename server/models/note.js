'use strict';
let _ = require('lodash');
let utils = require('../utils/commonUtils');

module.exports = function(Note) {
    Note.fetchByCustomerId = async (accessToken, customerId, includeArchived) => {
        try{
            let bucket = await Note.prototype.fetchNotes(accessToken, customerId, includeArchived);
            return {STATUS: 'SUCCESS', DATA: bucket};
        } catch(e) {
            return {STATUS: 'ERROR', ERROR: e, MSG: (e?e.message:'')};
        }  
    }

    Note.prototype.fetchNotes = (accessToken, customerId, includeArchived) => {
        return new Promise( async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = '';
            if(includeArchived)
                sql = SQL.FETCH_ALL;
            else
                sql = SQL.FETCH;
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
            },
            {
                arg: 'include_archived', type: 'boolean', http: (ctx) => {
                    let req = ctx && ctx.req;
                    let includeArchived = req && req.query.include_archived;
                    return includeArchived;
                },
                description: 'Include Archived Notes',
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

    Note.remoteMethod('archiveNote', {
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
        http: {path: '/archive-note', verb: 'patch'},
        description: 'Archive note'
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
        Note._updateNote(accessToken, params.content, params.noteId, params.customerId).then(
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

    Note._updateNote = (accessToken, content, noteId, customerId) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.UPDATE_NOTE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            Note.dataSource.connector.query(sql, [content, noteId, customerId], (err, res) => {
                if(err) {
                    console.log(err);
                    return reject(err);
                } else {
                    return resolve(true);
                }
            });
        })
    }

    Note.archiveNote = (accessToken, params, cb) => {
        Note._archiveNote(accessToken, params.noteId, params.customerId).then(
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

    Note._archiveNote = (accessToken, noteId, customerId) => {
        return new Promise(async (resolve, reject) => {
            let userId = await utils.getStoreOwnerUserId(accessToken);
            let sql = SQL.ARCHIVE_NOTE;
            sql = sql.replace(/REPLACE_USERID/g, userId);
            Note.dataSource.connector.query(sql, [noteId, customerId], (err, res) => {
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
    FETCH_ALL: `SELECT * FROM notes_REPLACE_USERID WHERE CustomerId=?`,
    FETCH: `SELECT * FROM notes_REPLACE_USERID WHERE CustomerId=? AND Archived=0`,
    INSERT_NEW_NOTE: `INSERT INTO notes_REPLACE_USERID (CustomerId, CustomerHashKey, Notes) VALUES (?, ?, ?)`,
    UPDATE_NOTE: `UPDATE notes_REPLACE_USERID SET Notes=? WHERE Id=? AND CustomerId=?`,
    ARCHIVE_NOTE: `UPDATE notes_REPLACE_USERID SET Archived=1 WHERE Id=? AND CustomerId=?`
};
