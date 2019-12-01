var fs = require('fs');
var spawn = require('child_process').spawn;
const cron = require("node-cron");
let appRootPath = require('app-root-path');
var dataSource = require('../datasources.json');
/**
 
     * * * * * *
     | | | | | |
     | | | | | day of week
     | | | | month
     | | | day of month
     | | hour
     | minute
     second ( optional )
 */

class DbBackup {
    constructor(fileName) {
        this.fileName = fileName;
        this.extension = 'sql';
    }
    
    schedule() {
        try {
            console.log('CRON Module Enabled');
            cron.schedule("30 11 * * *", () => { // 11:30am
                this.start()
                .then(
                    (successResp) => {
                        if(successResp.STATUS == 'success')
                            console.log(`Exported the DB successfully ${successResp.fileName}`);
                        else
                            console.log('Export failed...');
                    },
                    (errResp) => {
                        console.log(errResp);
                    }
                )
                .catch(
                    (e) => {
                        console.log(e);
                    }
                )
            });
        } catch(e) {
            console.log('CRON job - Uncaught Exception');
            console.log(e);
        }
    }

    start = () => {
        return new Promise( (resolve, reject) => {
            try {
                console.log('MYSQL DB backup: In progress....');
                let fileName = `${this.fileName}.${this.extension}`;
                if(fileName)
                    fileName = `${+new Date()}.${this.extension}`;
                let filePath = `${appRootPath}/backups/mysql/`;
                let fullFilePath = filePath+fileName;
                var wstream = fs.createWriteStream(fullFilePath);
                var mysqldump = spawn('mysqldump', [
                    '-u',
                    `${dataSource.developmentdb.username}`,
                    `-p${dataSource.developmentdb.password}`,
                    `${dataSource.developmentdb.database}`
                ]);
                
                mysqldump
                    .stdout
                    .pipe(wstream)
                    .on('finish', () => {
                        resolve({STATUS: 'success', fileName: fileName, filePath: filePath});
                    })
                    .on('error', (err) => {
                        reject({STATUS: 'error', ERROR: err});
                    });
            } catch(e) {
                reject({STATUS: 'error', ERROR: e});
            }
            
        });
    }

}

let dbBackupInstance = new DbBackup();
dbBackupInstance.schedule();

module.exports = DbBackup;



/**
 

var fs = require('fs');
var spawn = require('child_process').spawn;
const cron = require("node-cron");
let appRootPath = require('app-root-path'); 

const task = () => {
    console.log('MYSQL DB backup');
    let fileName = +new Date();
    var wstream = fs.createWriteStream(appRootPath+`/backups/mysql/${fileName}.sql`);
    var mysqldump = spawn('mysqldump', [
        '-u',
        'root',
        '-proot',
        'gsprod'
    ]);
    
    mysqldump
        .stdout
        .pipe(wstream)
        .on('finish', function () {
            console.log('Completed')
        })
        .on('error', function (err) {
            console.log(err)
        });
}


try {
    console.log('CRON Module Enabled');
    cron.schedule("30 11 * * *", function() { // 11:30am
        task();
    });
} catch(e) {
    console.log('CRON job - Uncaught Exception');
    console.log(e);
}


 */
