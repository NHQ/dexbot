var secretStack =require('secret-stack')
var sublevel = require('level-sublevel')
var hyperlog = require('hyperlog')
var swarmlog = require('swarmlog')

var pull = require('pull-stream')
var str2ps = require('stream-to-pull-stream')

var keer = require('ssb-keys')
var ws = require('ssb-ws') 

module.exports = function(bot){

  var self = bot //  u kno, u wrong!
  var memdb = bot.db // db.sublevel(...) 
  var keys = bot.keys 
  bot.log = hyperlog(memdb.sublevel(bot.keys.id))
  var node

  var errLogDB = hyperlog(memdb.sublevel(bot.id + ':errLog'))
  
  var errLog = function(cb){
    return function(err, data){
      if(err){ // drop it in the log
        errLogDB.append(JSON.stringify(err))
      }
      else if(cb) cb(data)
    }
  }


  var createApp = secretStack({
    appKey: bot.appKey || new Buffer('00000000000000000000000000000000'),
    timers: {
      inactivity: 0,
      handshake: 0
    }
  }).use(require('./core/'))
  //.use(ws)

  node = createApp({
    keys: keys,
    errLogDB: errLogDB,
    errLogger: errLog,
    log: bot.log,
    db: memdb,
    self: bot,
    name: bot.name
  })
  //console.log(node, node.address())
  bot.do = {}
  node.auth.hook(function(auth, args){
    var bot = args[0]
    var cb = args[1]
    auth(bot, function(err, perms){
      //console.log(perms)
      cb(null, {'sign':true, 'log': true})
    })
  })
  Object.assign(bot.do, node.dexbot)

  return bot

}
