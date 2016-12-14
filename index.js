var secretStack = require('secret-stack')
var keys = require('./keys.json')
var muxrpc = require('muxrpc')
var ms = require('multiserver')
var mdns = require('bonjour')()

var createApp = secretStack({
  appKey: new Buffer('00000000000000000000000000000000')
}).use({
  name: 'spot',
  manifest: {
    greet: 'async'
  },
  permissions: {
    anonymous: ['public.greet']
  },
  init: function(api, opts){
    return {
      'greet': function(cb){
        cb(null, 'GREETINGS')
      }
    }
  }
})

var node = createApp({
  keys: keys
})

var record = {
  type: 'spot',
  port: 12111,
  name: process.argv[2],
  host: node.getAddress()
}

mdns.publish(record)

mdns.find({type: 'spot'}, function(service){
  console.log(service)
  if(service.host === node.getAddress()) return
  else{
    node.connect(service.host, function(err, rpc){
      console.log(err, rpc)
      rpc.spot.greet(function(err, greets){
        console.log(greets)
      })
    })
  }
})

console.log(node.getAddress())
