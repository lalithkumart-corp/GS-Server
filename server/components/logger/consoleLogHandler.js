var fs = require('fs');
var path = require('path');
var util = require('util');
const RotatingFileStream = require('bunyan-rotating-file-stream');
let appRoot = require('app-root-path');
let defaultLogDir = appRoot + '/server/logs';

// var log_file = fs.createWriteStream(path.resolve(__dirname + '/../../logs/consoleOut.log'), {flags : 'a'});
// var log_file_err = fs.createWriteStream(path.resolve(__dirname + '/../../logs/consoleErr.log'), {flags : 'a'});
var log_stdout = process.stdout;

console.log('Console Log Folder', defaultLogDir);

let theStream = new RotatingFileStream({
              path: defaultLogDir + '/console_out.log', // path.resolve(process.cwd() + '/../../logs/console_error.log'),
              period: '1d',
              totalFiles: '5',
              rotateExisting: true,
              threshold: '20m',
              totalSize: '50m',
              gzip: false,
              shared: true,
        });
let theErrStream = new RotatingFileStream({
          path: defaultLogDir + '/console_error.log', // path.resolve(process.cwd() + '/../../logs/console_error.log'),
          period: '1d',
          totalFiles: '5',
          rotateExisting: true,
          threshold: '20m',
          totalSize: '50m',
          gzip: false,
          shared: true,
    });

console.log = function() {
  // log_file.write(`${+Date.now()} ` + util.format(arguments) + '\n');
  log_stdout.write(`${+Date.now()} ` + util.format(arguments) + '\n');
  theStream.write(`${+Date.now()} ` + util.format(arguments) + '\n');
};

console.error = function() {
    // log_file_err.write(`${+Date.now()} ` + util.format(arguments) + '\n');
    log_stdout.write(`${+Date.now()} ` + util.format(arguments) + '\n');
    theErrStream.write(`${+Date.now()} ` + util.format(arguments) + '\n');
}
