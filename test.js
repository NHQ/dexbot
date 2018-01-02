var spawnBot = require('./bot')
var ps = require('pull-stream')
var toStream = require('pull-stream-to-stream')
var hyperlog = require('hyperlog')
var db = require('memdb')
var emStream = require('emit-stream')

var person = spawnBot()
var friend = spawnBot()

friend.on('rpc:connect', function(whom){
  console.log(whom)
})

friend.do.connect(person, function(err, peer){

  friend.do.assimilate({id: person.keys.id}) // cheatcode for id

  // grab local copy of that hyperlog and listen to add events from remote
  log = friend.logs[person.keys.id] 
  log.on('add', function(data){
    console.log(data.value.toString())
  })
})

friend.on(person.keys.id, function(data){
  console.log(data)
})

// remote (person) adding stuff
// also remote rpc messages to local (friend) 

setInterval(function(){
 var msg = `Helloworld, it is currently 3.${(Math.ceil(Date.now() * Math.random()))} Hz 0'clock.` 
 person.do.hyperlog.add([], msg, function(err, ok){ 
 person.do.emit('to:' + friend.keys.id, "PHONE HOME")
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
