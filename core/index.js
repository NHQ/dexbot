// var mdns = require('bonjour')()
// var dnsdisco = require('dns-discovery') 
// both error if no network interface connection
var util = require('../util')
var keer = require('ssb-keys')
var hyperlog = require('hyperlog')
var swarmlog = require('swarmlog')
var pull = require('pull-stream')
var str2ps = require('stream-to-pull-stream')
var toPull = str2ps
var toStream = require('pull-stream-to-stream')
var emStream = require('emit-stream')
var muxrpc = require('muxrpc')
var emStream = require('emit-stream')
var emitter = require('events').EventEmitter

var hlkv = require('hyperkv')
var hldex = require('hyperlog-index')


var $ = module.exports = {}

$.name = 'dexbot' // change to 'rpc'

// dexbot is a *SUPA!!!*

$.manifest = {
    rc: 'duplex',
    callback: 'duplex',
    emit: 'async',
    assimilate: 'duplex',
    greet: 'async',
    createLog: 'duplex',
    getLog: 'source',
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
  uxer : ['emit'],
  anonymous: ['rc', 'assimilate', 'callback', 'connect', 'createLog', 'getLog', 'netcast'],
  replicate: ['push', 'pull', 'sync'],
  log : ['add', 'append', 'batch', 'get', 'heads', 'headStream', 'updates'], 
  sign: ['sign', 'onConnect'],
  require: ['require']
}

$.init = function(dex, bot){
  var self = dex
  var node = dex
  var rpc = {replicate: {}, log: {}}
  var logs = bot.logs
  var peers = {}
  var kv = hyperkv({
    db: bot.db,
    log: hyperlog(bot.db.sublevel('kvi:' + dex.id))
  })
  
  $.permissions.replicate.forEach(function(e){
    rpc.replicate[e] = function(opts){
      opts = opts || {}
      var id = opts.id
      var type  = $.manifest.replicate[e]
      var log = logs[id] || bot.log.replicate({mode: e, live: opts.live || false})
      var stream = str2ps[type](log, function(err){
        console.log(err)
      })
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
    'emit' : function(channel, data, cb){
      dex.emit(channel, data)
      if(cb) cb(null, true)
    },
    'callback' : function(id){
      var em = new emitter
      var st = emStream(em)
      var dupe = toPull.duplex(st)
      var rst = emStream(st)
      dex.on('to:' + id, function(data){
        console.log(data)
        em.emit('to:' + id, {from: bot.keys.id, msg: data})
      }) 

      rst.on('to:'+bot.keys.id,function(data){
        dex.emit('to:'+bot.keys.id, data)
    //    console.log(data)
      })
      return dupe
    },
    'sign': function(msg, cb){
      var signed = keer.signObj(bot.keys, {msg: msg})
      cb(null, signed)
    },
    'rc': function(id){
      var client = muxrpc(dex.getManifest(), {})()
      peers[id].client = client
      var stream = client.createStream()
      var dupe = client.dexbot.callback(bot.keys.id)
      dex.on('to:'+bot.keys.id, function(data){
        dupe.emit('to:'+bot.keys.id, data)
      })

      return stream
    },
    'connect': function(peer, cb){
          node.connect(peer.host, function(err, rpc){
            if(err) console.log(err) // publish errloggify this callback if the method sticks
            peers[rpc.id] = rpc
            if(cb) cb(null, rpc)
            // give peer yr rpc
/*
            var server = muxrpc({}, dex.getManifest())(dex)
            var rc = rpc.dexbot.rc(bot.keys.id)
            var local = server.createStream()
            pull(rc, local, rc)
*/
            // set up two way messaging
            var pst = rpc.dexbot.callback(bot.keys.id)
            var dupe = emStream(toStream(pst))
            
            var rdupe = emStream(dupe)
            var tp = toPull.duplex(rdupe)

            pull(pst, tp, pst)

            dex.on('to:'+rpc.id, function(data){
              dupe.emit('to:'+rpc.id, {from: bot.keys.id, msg: data})
            })

            dupe.on('to:'+bot.keys.id, function(data){
              dex.emit('to:'+bot.keys.id, data)
            })
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
    'getLog' : function(name){
      var log = logs[name] || hyperlog(bot.db.sublevel(name))
      var stream = str2ps.source(log.createReadStream({live: true}))
      //log.on('add', function(d){console.log(d)})
      return stream
    },
    'assimilate': function(id, peer){
      var log = dex.dexbot.createLog(id)
      console.log(dex.peers)
      dex.peers[peer]
      return log
    },
    'createLog': function(name){ // name will usually be a public key
      var log = logs[name] || hyperlog(bot.db.sublevel(name))
      logs[name] = log // put these in a hyperkv store, with updates to status: live (connected), last_known_whatabouts (previous replication)

      log.on('end', function(){
        logs[name] = null
      }) 
      var stream = str2ps.duplex(log.replicate({live:true, mode:'sync'}), function(err){
        //console.log('remote error or completion?', err)
      })
      return stream 
    }
  }
  Object.assign(rpc, core)
  return rpc
}
