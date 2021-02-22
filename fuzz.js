const yaml = require('./index.js');

function fuzz(buff){
   try{
       var doc = yaml.load(buff);
   } catch(e) {
     if (e instanceof yaml.YAMLException){}
     else {
       throw e;
     }
   }
}

module.exports = {
   fuzz
};


