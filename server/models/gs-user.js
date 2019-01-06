'use strict';

module.exports = function(Gsuser) {
    Gsuser.loginUser = (custom, cb) => {
        Gsuser.login(custom, (err, res) => {
            if(err) {
                cb(err, null);
            } else {
                Gsuser.findOne({where: {id: res.userId}}, (err, ret) => {
                    if(err) {
                        cb(err, null);
                    } else {
                        res.ownerId = ret.ownerId;
                        res.username = ret.username;
                        res.email = ret.email;
                        cb(null, res);
                    }                    
                });                
            }
        });
    };

    Gsuser.remoteMethod(
        'loginUser',
        {
            description: 'User Login.',
            accepts: {
                arg: 'custom',
                type: 'object',
                default: {
                    "email": "name@domain.com",
                    "password": "password",
                },
                http: {
                    source: 'body'
                }
            },
            returns: {
                type: 'object',
                root: true,
                http: {
                    source: 'body'
                }
            },
            http: {verb: 'post', path: '/login-user'}
        }
    );
};
