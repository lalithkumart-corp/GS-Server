var fs = require('fs');
var path = require('path');
var util = require('util');
var utils = require('../../utils/commonUtils');
const RotatingFileStream = require('bunyan-rotating-file-stream');
let appRoot = require('app-root-path');
let defaultLogDir = appRoot + '/server/logs';

function consoleLogHandler(logger) {
    // var log_file = fs.createWriteStream(path.resolve(__dirname + '/../../logs/consoleOut.log'), {flags : 'a'});
    // var log_file_err = fs.createWriteStream(path.resolve(__dirname + '/../../logs/consoleErr.log'), {flags : 'a'});
    var log_stdout = process.stdout;

    let consLogFolder = utils.constructConsoleLogFolder();
    console.log('Console Log Folder', consLogFolder);

    let theStream = new RotatingFileStream({
                  path: path.resolve(consLogFolder + '/console_out.log'),
                  period: '1d',
                  totalFiles: '10',
                  rotateExisting: true,
                  threshold: '20m',
                  totalSize: '50m',
                  gzip: false,
                  shared: true,
            });
    let theErrStream = new RotatingFileStream({
              path: path.resolve(consLogFolder + '/console_error.log'),
              period: '1d',
              totalFiles: '10',
              rotateExisting: true,
              threshold: '20m',
              totalSize: '50m',
              gzip: false,
              shared: true,
        });

    console.log = function() {
      try {
        let dt = new Date().toString();
        let ct = dt.substr(0, dt.indexOf(' GMT'));
        // log_file.write(`${+Date.now()} ` + util.format(arguments) + '\n');
        try {
          log_stdout.write(`${ct} ` + util.format(arguments) + '\n');
        } catch(e) {
          logger.debug('Error in piping console log to std out');
        }
        try {
          theStream.write(`${ct} ` + util.format(arguments) + '\n');
        } catch(e) {
          logger.debug('Error in piping console log to out file');
        }
      } catch(e) {
        logger.debug('Error in piping console log to file');
      }
    };

    console.error = function() {
      try {
        let dt = new Date().toString();
        let ct = dt.substr(0, dt.indexOf(' GMT'));
        // log_file_err.write(`${ct} ` + util.format(arguments) + '\n');
        try {
          log_stdout.write(`${ct} ` + util.format(arguments) + '\n');
        } catch(e) {
          logger.debug('Error in piping console error to std out');
        }
        try {
          theErrStream.write(`${ct} ` + util.format(arguments) + '\n');
        } catch(e) {
          logger.debug('Error in piping console error to out file');
        }
      } catch(e) {
        logger.debug('Error in piping console error to file');
      }
    }
}

module.exports = {
  consoleLogHandler
}
