let app = require('./server');
let axios = require('axios');
function validator() {
    if(process.env.NODE_ENV == 'offlineprod') {
        try {
            const execSync = require('child_process').execSync;
            const response = execSync('wmic csproduct get UUID'); // wmic bios get serialnumber
            let csProductUUID = String(response).split('\n')[1];
            csProductUUID = csProductUUID.replace(/\r/g, '').trim();
            // console.log(csProductUUID);
            // console.log( app.get('csProductUUID'));
            if(csProductUUID !== app.get('csProductUUID')) {
                console.log('App Feeling Unsafe. Please contact Admin');
                axios.post('http://trsoftware.in/unsafe', {csProductUUID: csProductUUID});
                setTimeout(
                    () => {
                        process.exit();
                    },
                    10000
                );
            }
        } catch (err) {
            console.log('Error in Validating APP', err);
            axios.post('http://trsoftware.in/unsafe', {csProductUUID: csProductUUID, msg: 'Error in valdating the app'});
            setTimeout(
                () => {
                    process.exit();
                },
                5000
            );
        }
    }
}

module.exports = {
    validator
}