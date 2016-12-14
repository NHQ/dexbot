var secretStack = require('secret-stack')
var keys = require('./keys.json')
var appkey = require('./appkeys.json')
var muxrpc = require('muxrpc')
var ms = require('multiserver')
var mdns = require('mdns')

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

var record = {
  name: process.argv[3] || 'poopface',
  address: node.getAddress()
}

var ad = mdns.createAdvertisement(mdns.tcp('http'), 11111, {txtRecord: record})
ad.start()

var browser = mdns.createBrowser(mdns.tcp('http'), 11111)
browser.on('serviceUp', function(service){
  console.log(service.txtRecord.address)
  node.connect(service.txtRecord.address.split('~')[0], function(rpc){
    rpc.public.greet(function(err, greets){
      console.log(greets)
    })
  })
})


console.log(node.getAddress())
