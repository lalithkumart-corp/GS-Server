var fs = require('fs');
var spawn = require('child_process').spawn;
const cron = require("node-cron");


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

const task = () => {
    console.log('MYSQL DB backup');
    let fileName = +new Date();
    var wstream = fs.createWriteStream(`backups/mysql/${fileName}.sql`);
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