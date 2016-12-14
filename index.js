var secretStack = require('secret-stack')
var keys = require('./keys.json')
var appkey = require('./appkeys.json')
var muxrpc = require('muxrpc')
var ms = require('multiserver')

var createApp = secretStack({
  appKey: appkey.private
}).use({
  name: 'spot',
  manifest: {
    public: {
      greet: 'async'
    }
  },
  permissions: {
    anonymous: ['public.greet']
  },
  init: function(api, opts){
    return {
      'public.greet': function(arg, cb){
        cb(null, 'GREETINGS')
      }
    }
  }
})

var node = createApp({
  keys: keys
})

console.log(node.getAddress())
