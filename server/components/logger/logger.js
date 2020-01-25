let bunyan = require('bunyan');
let appRoot = require('app-root-path');
let defaultLogDir = appRoot + '/server/logs';
let RotatingFileStream = require('bunyan-rotating-file-stream');
let LogSerializer = require('./logSerializer');

class Logger {
    constructor(logFilePath) {
        this.name = 'GS';
        this.type = 'raw';
        this.period = '1d';
        this.count = 50;
        this.threshold = '10m';
        this.totalSize = '500m';
        this.logger = null;
        this.logPath = logFilePath || defaultLogDir;
    }
    getLogger() {
        if (this.logger)
            return this.logger;
        else
            return this.createLogger();
    }
    createLogger() {
        
        this.logger = bunyan.createLogger({
            name: this.name,
            serializers: {
                req: new LogSerializer().req,
                res: new LogSerializer().res,
                err: new LogSerializer().err,
            },
            streams: [
                {
                    level: 10,
                    stream: this.getStream('trace')
                },
                {
                    level: 20,
                    stream: this.getStream('debug')
                },
                {
                    level: 30,
                    stream: this.getStream('info')
                },
                {
                    level: 40,
                    stream: this.getStream('warn')
                },
                {
                    level: 50,
                    stream: this.getStream('error')
                },
                {
                    level: 60,
                    stream: this.getStream('fatal')
                },
            ],
            hostname: this.hostname,
        });

        return this.logger;
    }

    getStream(levelIdentifier) {
        let theStream;
        if(process.NODE_ENV == 'local') {
            theStream = process.stdout;
        } else {
            let rotateStreamArgs = this.getRotateFileStreamAgrs(levelIdentifier);
            theStream = new RotatingFileStream(rotateStreamArgs);
        }
        return theStream;
    }

    getRotateFileStreamAgrs(levelIdentifier) {
        return {
            path: this.logPath + `/${levelIdentifier}.log`,
            period: this.period,
            totalFiles: this.count,
            rotateExisting: true,
            threshold: this.threshold,
            totalSize: this.totalSize,
            gzip: false,
            shared: true,
        }
    }
}

module.exports = Logger;