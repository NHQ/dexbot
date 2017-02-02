var spawnBot = require('./bot')
var ps = require('pull-stream')
var toStream = require('pull-stream-to-stream')
var hyperlog = require('hyperlog')
var db = require('memdb')
var emStream = require('emit-stream')

var person = spawnBot()
var friend = spawnBot()

console.log(friend.address)
friend.on('rpc:connect', function(whom){
  console.log(whom)
})

friend.do.connect(person, function(peer){

  var rs = peer.dexbot.replicate.sync({live: true}, function(err){
    //console.log('*************************\n', err)
  })
/*  // this was added to dexbot.connect 
  var dupe = emStream(toStream(peer.dexbot.callback(friend.keys.public)))

  dupe.on('to:'+friend.keys.public, function(data){
    console.log(data)
  })
*/

// this should become part of replicate
// mkdirp a log per public key
// treat all logs the same

  var srs = friend.do.createLog(person.keys.id) // cheatcode for id
  var xrs = friend.do.assimilate(Math.random() + "") // cheatcode for id

  ps(rs, srs, rs)


  // one way, get a rpc log, toStream it and listen to data events
  var hlog = friend.do.getLog(person.keys.id)
  var log = toStream.source(hlog)

  // another way, but the same, listen for the rpc pull stream drain events or use the following flow
  //ps(hlog, ps.log())


  // local bot way, get the hyperlog replication stream directly
  // note, should modify this to be a createReadStream, not replication?
  // or, make replicate{push,pull,sync} general

  log = friend.logs[person.keys.id] // a replication stream

  log.on('add', function(data){
    console.log(data.value.toString())
  })

})

setInterval(function(){
 var msg = `helloworld, it's ${(Math.ceil(Date.now() * Math.random()))} fast 0'clock.` 
 //console.log(msg)
 person.log.add([], msg, function(err, ok){ 
})}, 3000)



/*


friend.do.bonjour()
friend.do.onConnect(function(peer){
  peer.dexbot.greeting(friend.name, function(err, address){
    console.log(err, address)
    peer.dexbot.sign(`${friend.name} says ${peer.id} is all right with ${friend.keys.id}`, function(err, msg){
      console.log(err, msg)
    })
    //friend.do.greeting(friend.name, console.log)
  })
})
mom.do.bonjour()
mom.do.greet(function(bot){
  //console.log(bot)
  mom.do.connect(bot, function(rpc){
  
  })
})
*/
