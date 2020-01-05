let _ = require('lodash');
let GsError = require('./gsError');
class GsValidation extends GsError{
    constructor(args) {
        super(args);
        this.errorType = 'VALIDATION';
    }
}

module.exports = GsValidation;