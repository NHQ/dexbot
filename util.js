module.exports.parseAddress = function(address){
  var xyz = address.split('~')[0].split(':')
  return {
    protocol : xyz[0],
    host: xyz[1],
    port: xyz[2]
  }
}
