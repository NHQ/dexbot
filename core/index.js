//var mdns = require('bonjour')()
// var dnsdisco = require('dns-discovery') 
// both error if no network intergace connection



var keer = require('ssb-keys')
var hyperlog = require('hyperlog')
var swarmlog = require('swarmlog')
var pull = require('pull-stream')
var str2ps = require('stream-to-pull-stream')


var $ = module.exports = {}

$.name = 'dexbot'

$.manifest = {
    onConnect: 'async',
    greet: 'async',
    createLog: 'duplex',
    requestPublicKey: 'async',
    netcast: 'duplex',
    bonjour: 'source',
    connect: 'async',
    swarmLog: 'duplex',
    stderr: 'source',
    greeting: 'async',
    sign: 'async',
    replicate: {
      'push': 'sink',
      'pull': 'source',
      'sync': 'duplex'
    },
    log: {
      'updates' : 'source',
      'heads' : 'async',
      'headStream' : 'source',
      'add' : 'async',
      'get' : 'async',
      'append': 'async',
      'batch': 'async'
    }
}

$.permissions = {
  anonymous: ['greet', 'bonjour', 'connect', 'createLog', 'netcast', 'greeting', 'onConnect'],
  replicate: ['push', 'pull', 'sync'],
  log : ['add', 'append', 'batch', 'get', 'heads', 'headStream', 'updates'], 
  sign: ['sign']
}

$.init = function(dex, bot){
  var self = dex
  var node = dex
  var rpc = {replicate: {}, log: {}}
  $.permissions.replicate.forEach(function(e){
    rpc.replicate[e] = function(opts){
      opts = opts || {}
      var type  = $.manifest.replicate[e]
      var log = bot.log.replicate({mode: e, live: opts.live || false})
      var stream = str2ps[type](log)
      return stream
    }
  })
  $.permissions.log.forEach(function(e){
    var type = $.manifest[e]
    if(type === 'async') rpc.log[e] = bot.log[e]
    else{ // source stream
      switch(e){
        case 'headStream':
          rpc.log[e] = function(opts){
            return str2ps(bot.log.heads(opts))
          }
        break;
        case 'updates':
          rpc.log[e] = function(opts){
            return str2ps(bot.log.createReadStream(opts))
          }
        break;
      }
    }
  })
  var core = {
    'sign': function(msg, cb){
      var signed = keer.signObj(bot.keys, {msg: msg})
      cb(null, signed)
    },
    'onConnect' : function(cb){
      var self = dex
      dex.on('rpc:connect', function(remote){
        //remote.pause()
        cb(remote)
      })  
    },
    'bonjour': function(){
    //console.log(bot)
      var record = {
        type: 'dexbot',
        port: 12111, // fake cuz why port?  idk...  also, don't want to parse node.adress() for port #buh
        name: bot.name,
        host: node.getAddress()
      }
      mdns.publish(record)
    
    },
    'greet': function(cb){
      ;(function(_cb){mdns.find({type: 'dexbot'}, function(service){
        if(service.host === node.getAddress()) return
        else{ 
          //console.log(service, _cb)
          if(_cb) _cb(service)// add to list of known bots, loookup, etc
        }
      })})(cb)
    },
    'connect': function(peer, cb){
          node.connect(peer.host, function(err, rpc){
            if(err) console.log(err) // publish errloggify this callback if the method sticks
            if(cb) cb(rpc)
            /*
            rpc.manifest(function(err, data){
      //        console.log(err, data)
            })
            //rpc.dexbot.greet(self.name, function(err, greets){
            //  console.log(greets)
            //})
            var log = hyperlog(bot.db.sublevel())
            var local = str2ps.duplex(log.replicate({live : true}), function(err){
              //console.log('local err or ending?', err)
            })
            var random = rpc.dexbot.createLog()
            var remote = rpc.dexbot.netcast({
              distance: 3,
              head: null,
              author: '1234567890'
            })
            var x 
            //pull(local, remote, local)
            pull(local, random, local)
            log.on('add', function(data){
              //console.log(data.value.toString() + service.name)
            })
            */
          })  
    
    },
    'netcast': function(mesg){
      
      var distance = mesg.distance || 0
      
      var log = hyperlog(bot.db.sublevel('netcast'))

      var local = str2ps.duplex(log.replicate({live:true}), function(err){
        //console.log('remote error or completion?', err)
      })
    
      log.add(mesg.head || undefined, JSON.stringify(Object.keys(node.peers)), function(err, doc){

        mesg.distance--
        mesg.auth = node.address()
        mesg.head = doc.key 

        if(distance < 0) //???

        Object.keys(node.peers).forEach(function(peer){
          if(distance > 0 && !(mesg.publicKey === peer)){
            remote = peer.dexbot.netcast(mesg)
            pull(local, remote, local)
            log.on('add', function(data){
              console.log(data.toString())
            })
          }
        })
        
      })

      return local 
    },
    'stderr' : function(  replicate){
      var type = replicate ? 'replicate' : 'changes'
      var stream = str2ps.duplex(errLogDB[type]({live:true}), errLog())
      return stream 
    },
    'swarmLog' : function(publicKey){
      var log = swarmlog({
        keys: publicKey,
        sodium: require('chloride/browser'),
        db: bot.db.sublevel('swarm:' + publicKey),
        valueEncoding: 'json',
        hubs: [ 'https://signalhub.mafintosh.com' ]
      })
      var stream = str2ps(log)
      return stream
    },
    'createLog': function(name){
      var log = hyperlog(bot.db.sublevel(name))
      log.on('add', function(node){ console.log(node.value.toString())}) 
      var stream = str2ps.duplex(log.replicate({live:true, mode:'sync'}), function(err){
        //console.log('remote error or completion?', err)
      })
      return stream 
    },
    'greeting': function(name, cb){
      cb(null, bot.name + ': GREETINGS TO ' + name)
    }
  }
  Object.assign(rpc, core)
  return rpc
}
