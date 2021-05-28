/**
 * @created: 21st December 2019
 * @file: role-resolver.js
 * @copyright Lalith Kumar
 * @description: 
    > Custom Role were integrated here. It will be executed at the time when server gets booted.
    > And the ACL will take care when the remote method is configured in ACL table with role specific.
 
    > To-Debug and look for ACL's of models applied at runtime, run our app using below command
        ---------------------------------------------------------
        -  DEBUG='loopback:security:*' node 'server/server.js'  -
        ---------------------------------------------------------
      Or add this command in package.json as npm->'start' property value and run using 'npm start'.
 */

module.exports = function(app) {
    
    const CUSTOM_ROLES = {};

    var Role = app.models.Role;

    //fetch the list of our custom roles we have in database, and register with role-resolver
    app.models.Role.find('', function(err, data) {
        try{
            data.forEach(function(aRoleObj) {
                let roleName = aRoleObj.name.replace(/ /g,"_");
                roleName = roleName.toUpperCase();
                CUSTOM_ROLES[roleName] = aRoleObj.id;
                Role.registerResolver(CUSTOM_ROLES[roleName], function(role, context, cb) {
                    fetchArg(context, function(err, ret) {
                        if(!err && ret){
                            fetchUserRoleMap(ret.userId, function(err, res) {
                                let isInRole = false;
                                if(!err && res && res.roleId == CUSTOM_ROLES[roleName])
                                    isInRole = true;
                                return cb(null, isInRole);
                            });
                        } else {                            
                            return cb(null, false);
                        }
                        
                    });
                });
            });
        } catch(e) {
            console.log('Error in Role resolver '+ e);
        }
    });

    //Attaching listener here: Whenever a new Role is created, we have to register that custom role with role-resolver.
    Role.afterRemote('create', function(context, roleData, next) {
        registerNewResolver(roleData.name, roleData.id);
        next();
    });

    //Attaching listener here: Whenever a role is deleted, delete its ACL lists from ACl table   
    Role.afterRemote('deleteById', function(context, roleData, next) {
        if(typeof context.args !== 'undefined'
        && typeof context.args.id !== 'undefined'){
            app.models.ACL.destroyAll({principalId: context.args.id}, function(err, data) {
                next();
            });
        }
    });

    //Fetch the arguments required to fetch roleId of currentUser
    function fetchArg(context, cb) {
        try{        
            let theUserId = getUserIdFromPrincipals(context);
            if(theUserId == '') {
                let tknVal = getTokenValue(context);
                if(tknVal !== '') {
                    app.models.AccessToken.findOne({where: {id : tknVal}}, function(err, ret) {
                        cb(err, ret);
                    });
                }else{
                    cb(null, {});
                }
            }else{
                cb(null, {userId: theUserId});
            }
        } catch(e){
            console.log('Error in Role Resolver: Fetch Argument... '+ e);
        }
    }

    function fetchUserRoleMap(anUserId, cb) {
        anUserId = anUserId || null;
        app.models.RoleMapping.findOne({where: {principalId: anUserId}}, function(err, res) {            
            res = res || {};
            cb(err, res);
        });
    }

    //If we have current looged in user's Id in principal array(context object), pick it out
    function getUserIdFromPrincipals(context) {
        try{
            let theUserId = '';
            if(typeof context !== 'undefined' && context.principals.length > 0)
                theUserId = context.principals[0].id;
            return theUserId;
        } catch(e){
            console.log('Error in Role Resolver: Fetch userId from Principals. '+ e);
        }
    }

    //Read token value from context object
    function getTokenValue(context, cb) {
        try{
            let tokenVal = '';
            /*if(context && context.remotingContext) {
                if(context.remotingContext.args) {
                    if(context.remotingContext.args.auth_user_id)
                        tokenVal = context.remotingContext.args.auth_user_id;
                    else if(context.remotingContext.args.custom && context.remotingContext.args.custom.auth_user_id)
                        tokenVal = context.remotingContext.args.custom.auth_user_id;
                } else if(context.remotingContext.req) {
                    if(context.remotingContext.req.query) {
                        if(context.remotingContext.req.query.accesstoken)
                            tokenVal = context.remotingContext.req.query.accesstoken;
                        else if(context.remotingContext.req.query.access_token)
                            tokenVal = context.remotingContext.req.query.access_token;
                    }
                }
            }*/
            // if(typeof context.remotingContext.args.auth_user_id !== 'undefined')
            //     tokenVal = context.remotingContext.args.auth_user_id;
            // else if(typeof context.remotingContext.req.query.accesstoken !== 'undefined')
            //     tokenVal = context.remotingContext.req.query.accesstoken;
            // else if(typeof context.remotingContext.req.query.access_token !== 'undefined')
            //     tokenVal = context.remotingContext.req.query.access_token;
            // else if(typeof context.remotingContext.args.custom.auth_user_id !== 'undefined')
            //     tokenVal = context.remotingContext.args.custom.auth_user_id;

            let method = context.remotingContext.req.method;
            if(method == 'GET') {
                if(context.remotingContext.req.query && context.remotingContext.req.query.access_token)
                    tokenVal = context.remotingContext.req.query.access_token;
            } else {
                if(context.remotingContext.args) {
                    if(context.remotingContext.args.accessToken)
                        tokenVal = context.remotingContext.args.accessToken;
                    else if(context.remotingContext.args.access_token)
                        tokenVal = context.remotingContext.args.access_token;
                    else if(context.remotingContext.args.apiParams) {
                        if(typeof context.remotingContext.args.apiParams.accessToken !== 'undefined')
                            tokenVal = context.remotingContext.args.apiParams.accessToken;
                        else if(typeof context.remotingContext.args.apiParams.access_token !== 'undefined')
                            tokenVal = context.remotingContext.args.apiParams.access_token;
                    } else if(context.remotingContext.args.data) {
                        if(typeof context.remotingContext.args.data.accessToken !== 'undefined')
                            tokenVal = context.remotingContext.args.data.accessToken;
                        else if(typeof context.remotingContext.args.data.access_token !== 'undefined')
                            tokenVal = context.remotingContext.args.data.access_token;
                    }
                }
            }
            return tokenVal;
        } catch(e){
            console.log('Exception catched in Role Resolver: Getting Token value... ');
            console.log(e);
        }
    }

    //Logic to register a new dynamically created role with role-resolver.
    function registerNewResolver(roleName, roleId) {
        try{        
            CUSTOM_ROLES[roleName] = roleId;
            Role.registerResolver(CUSTOM_ROLES[roleName], function(role, context, cb) {
                fetchArg(context, function(err, ret) {
                    if(!err && ret){
                        fetchUserRoleMap(ret.userId, function(err, res) {
                            let isInRole = false;
                            if(!err && res && res.roleId == CUSTOM_ROLES[roleName])
                                isInRole = true;                    
                            return cb(null, isInRole);
                        });
                    }
                    
                });
            });
        } catch(e){
            console.log('Error in Role Resolver: Registering a new Resolver, when created a new role dynamically now...' + e);
        }
    }
}