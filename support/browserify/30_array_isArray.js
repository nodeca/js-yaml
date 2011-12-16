if (!Array.isArray) {
  // fix for IE and Safari
  Array.isArray = function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };
}
