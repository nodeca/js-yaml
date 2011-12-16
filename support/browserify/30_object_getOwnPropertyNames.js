if (!Object.getOwnPropertyNames) {
  // fix for IE and Safari
  Object.getOwnPropertyNames = function getOwnPropertyNames(obj) {
    var names = [], key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        names.push(key);
      }
    }
    return names;
  };
}
