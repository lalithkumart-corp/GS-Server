'use strict';
let _ = require('lodash');

module.exports = function(GsRole) {
    GsRole.fetchList = async (accessToken) => {
        try {
            let list = [];
            let userId = await GsRole._findUserIdByToken(accessToken);
            let allRolesListObj = await GsRole._fetchAllRoles();
            let userRoleId = await GsRole._findUserRoleId(userId);
            let userRank = GsRole._getUserRank(userRoleId, allRolesListObj);
            _.each(allRolesListObj, (aRoleObj, index) => {
                if(aRoleObj.rank >  userRank)
                    list.push(aRoleObj);
            });
            return {
                STATUS: 'success',
                list: list
            }
        } catch(e) {
            return {
                STATUS: 'error',
                MSG: 'Excption while fetching the roles list',
                ERROR: e
            }
        }
    }

    GsRole.remoteMethod(
        'fetchList',
        {
            description: 'returns Roles list',
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
                    source: 'body',
                },
            },
            http: {verb: 'get', path: '/fetch-list'}
        }
    );

    GsRole._findUserIdByToken = (accessToken) => {
        return new Promise( (resolve, reject) => {
            GsRole.app.models.AccessToken.findById(accessToken, (err, accessTokenRecord) => {
                if(err) {
                    return reject(err);
                } else {
                    return resolve(accessTokenRecord.userId);
                }
            });
        });
    }

    GsRole._fetchAllRoles = () => {
        return new Promise( (resolve, reject) => {
            GsRole.find('', (error, rolesListObj) => {
                if(error) {
                    return reject(error);
                } else {
                    return resolve(rolesListObj);
                }
            });
        });
    }

    GsRole._findUserRoleId = (userId) => {
        return new Promise( (resolve, reject) => {
            GsRole.app.models.RoleMapping.find({where: {principalId: userId}}, (error, roleMappingRec) => {
                if(error) {
                    return reject(error);
                } else if(roleMappingRec.length < 1) {
                    return reject(new Error('No roles found for the UserId: ' + userId));
                } else{
                    return resolve(roleMappingRec[0].roleId);
                }
            });
        });
    }

    GsRole._getUserRank = (roleId, allRolesListObj) => {
        let rank;
        _.each(allRolesListObj, (aRoleObj, index) => {
            if(aRoleObj.id == roleId)
                rank = aRoleObj.rank;
        });
        return rank;
    }
}