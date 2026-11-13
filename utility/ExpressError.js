// We can call it as custom error class

class ExpressError extends Error{
    constructor(statuscode,message){
        super();
        this.statusCode = statuscode;
        this.statuscode = statuscode;
        this.message = message;
    }
}

module.exports = ExpressError;