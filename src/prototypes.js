String.prototype.ucfirst = function () {
  const str = this;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
