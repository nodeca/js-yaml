if (!Function.prototype.bind) {
  // fix for IE and Safari
  Function.prototype.bind = function bind(context) {
    var func = this;
    return function bound() {
      func.apply(context, arguments);
    };
  };
}
