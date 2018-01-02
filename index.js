var secretStack =require('secret-stack')
var sublevel = require('level-sublevel')
var hyperlog = require('hyperlog')
var swarmlog = require('swarmlog')

var util = require('./util')
var pull = require('pull-stream')
var str2ps = require('stream-to-pull-stream')

var keer = require('ssb-keys')
var ws = require('ssb-ws') 

module.exports = function(bot){

  var self = bot //  u kno, u wrong!
  var memdb = bot.db // db.sublevel(...) 
  var keys = bot.keys 
  //bot.log = hyperlog(memdb.sublevel(bot.keys.id))
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
 
  var logs = {}
  node = createApp({
    keys: keys,
    errLogDB: errLogDB,
    errLogger: errLog,
    log: bot.log,
    logs: logs,
    db: memdb,
    self: bot,
    name: bot.name
  })
  //console.log(node, node.address())
  bot.address = util.parseAddress(node.address())
  bot.logs = logs
  bot.host = node.address()
  bot.do = {}
  Object.assign(bot.do, node.dexbot)
  
  bot.on = node.on
  bot.emit = node.emit
  return bot

}
