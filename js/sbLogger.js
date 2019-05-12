

class SbLogger {

    constructor (){
        this.dev = true;
    }

    debug(message, value = null){
        if(this.dev){
            (value) ? console.log(message, value) : console.log(message);
        }
    }

    error(message, value = null){
        if(this.dev){
            (value) ? console.log(message, value) : console.log(message);
        }
    }




}


