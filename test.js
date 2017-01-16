var spawnBot = require('./bot')
var ps = require('pull-stream')

var person = spawnBot()
var friend = spawnBot()

friend.do.connect(person, function(peer){
  var rs = peer.dexbot.replicate.sync({live: true}, function(err){
    console.log('*************************', err)
  })
  var srs = friend.do.createLog(person.keys.id) // cheat
  
  ps(rs, srs, rs)
})

person.log.add([], 'helloworld', function(err, ok){
})



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
