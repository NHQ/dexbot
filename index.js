var secretStack = require('secret-stack')
var keys = require('./keys.json')

var mdns = require('bonjour')()

var sublevel = require('level-sublevel')
var memdb = sublevel(require('memdb')())

var hyperlog = require('hyperlog')
var pull = require('pull-stream')

var str2ps = require('stream-to-pull-stream')

var selfAdress

//var ft = require('../ssb-fulltext')

var node

manifest= {
  greet: 'async',
  createLog: 'duplex',
  requestPublicKey: 'async',
  netcast: 'duplex'
}

var createApp = secretStack({
  appKey: new Buffer('00000000000000000000000000000000'),
  timers: {
    inactivity: 0,
    handshake: 0
  }
}).use({
  name: 'spot',
  manifest: manifest ,
  permissions: {
    anonymous: ['greet', 'createLog', 'netcast']
  },
  init: function(api, opts){
  var rpc = {
      'netcast': function(mesg){
        
        var distance = mesg.distance || 0
        
        var log = hyperlog(memdb.sublevel('netcast'))
        var local = str2ps.duplex(log.replicate({live:true}), function(err){
          //console.log('remote error or completion?', err)
        })
      
        console.log(mesg)

        log.add(mesg.head || undefined, JSON.stringify(Object.keys(node.peers)), function(err, doc){

          console.log(doc)
          
          mesg.distance--
          mesg.auth = node.address()
          mesg.head = doc.key 

          if(distance < 0) //???

          Object.keys(node.peers).forEach(function(peer){
            if(distance > 0 && !(mesg.publicKey === peer)){
              remote = peer.spot.netcast(mesg)
              pull(local, remote, local)
              log.on('add', function(data){
                console.log(data.toString())
              })
            }
          })
          
        })

        return local 
      },
      'createLog': function(name){
        var log = hyperlog(memdb.sublevel(name))
        console.log(node.peers, opts.self)
        
        var stream = str2ps.duplex(log.replicate({live:true}), function(err){
          //console.log('remote error or completion?', err)
        })
        setInterval(function(){ 
          log.add(null, Math.random().toString(2) + process.argv[2], function(err, msg){
            if(err) console.log(err)
          })
        },1511)
        return stream 
      },
      'greet': function(cb){
        cb(null, 'GREETINGS')
      }
    }
    return rpc
  }
})
//.use(ft)


node = createApp({
  keys: keys,
  db: memdb,
  self: node
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
      rpc.manifest(function(err, data){
//        console.log(err, data)
      })
      rpc.spot.greet(function(err, greets){
        console.log(greets)
      })
      var log = hyperlog(memdb.sublevel())
      var local = str2ps.duplex(log.replicate({live : true}), function(err){
        //console.log('local err or ending?', err)
      })
      var remote = rpc.spot.netcast({
        distance: 3,
        head: null,
        author: '1234567890'
      })
      var x 
      pull(local, remote, local)
       
      log.on('add', function(data){
        console.log(data.value.toString())
      })
    })  
  }
})


