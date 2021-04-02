let socket = require('socket.io');
let app = require('./server');
let MG = require('./myGlobals');

class SocketClass {
    constructor(server) {
        this.io = socket(server, {
            cors: {
                origin: '*',
            }
        });
        this.io.on('connection', this.onConnect);
        this.registeredClients = [];
    }
    async onConnect(stream) {
        
        app.set('socket', stream);

        stream.on('register', (data) => {
            try {
                MG.registeredClients.push(data.userId);
                MG.registeredClientDetails[data.userId] = MG.registeredClientDetails[data.userId] || {};
                MG.registeredClientDetails[data.userId].events = MG.registeredClientDetails[data.userId].events || new Set();
                for(let i=0; i<data.events.length; i++) {
                    MG.registeredClientDetails[data.userId].events.add(data.events[i]);
                }
                MG.registeredClientDetails[data.userId].socket = stream;
                // console.log('registered with ', stream.id);
            } catch(e) {
                //TODO : Add logger
                console.log(e);
            }
        });

        stream.on('disconnect', (reason) => {
            // console.log('Disconnected', stream.id, reason);
        });

    }
    fetchUserId() {

    }
}

module.exports = SocketClass;