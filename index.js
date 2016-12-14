var secretStack = require('secret-stack')
var keys = require('./keys.json')
var muxrpc = require('muxrpc')
var ms = require('multiserver')
var mdns = require('bonjour')()

var sublevel = require('level-sublevel')
var memdb = sublevel(require('memdb')())

var hyperlog = require('hyperlog')
var ps = require('pull-stream')
var str2ps = require('stream-to-pull-stream')

var createApp = secretStack({
  appKey: new Buffer('00000000000000000000000000000000'),
  timers: {
    inactivity: 0,
    handshake: 0
  }
}).use({
  name: 'spot',
  manifest: {
    greet: 'async',
    createLog: 'duplex'
  },
  permissions: {
    anonymous: ['greet', 'createLog']
  },
  init: function(api, opts){
    return {
      'createLog': function(name){
        var log = hyperlog(memdb.sublevel(name))
        var stream = str2ps.duplex(log.replicate({live:true}), function(err){
          //console.log('remote error or completion?', err)
        })
        setInterval(function(){ 
          log.add(null, Math.random().toString(2), function(err, msg){
            if(err) console.log(err)
          })
        },1511)
        return stream 
      },
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
  if(service.host === node.getAddress()) return
  else{
    node.connect(service.host, function(err, rpc){
      if(err) console.log(err)
      //console.log(err, rpc)
      rpc.spot.greet(function(err, greets){
        console.log(greets)
      })
      var log = hyperlog(memdb.sublevel())
      var local = str2ps.duplex(log.replicate({live : true}), function(err){
        //console.log('local err or ending?', err)
      })
      var remote = rpc.spot.createLog()
      var x 
      ps(local, remote, local)

      log.on('add', function(data){
        console.log(data.value.toString())
      })
    })  
  }
})

console.log(node.getAddress())
