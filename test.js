'use strict'
var spawnBot = require('./bot')

var mom = spawnBot()
var friend = spawnBot()



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
