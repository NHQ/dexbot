var net = require('net')
var bind = require('tcp-bind')
var keys =  require('ssb-keys')
var ref = require('jssb-ref')

var answer = require('answerver')

module.exports.name = 'proxy'
module.exports.version = '0.0.0'
module.exports.init = function(dex, bot){
  
  dex.on('to:'+bot.keys.id, function(data){
    if(data.type === 'proxy'){ // :\
      var id = data.from
      var service = data.service // walking it out...
      // wat
      if(service === 'start'){
        dex.dexbot.createSearver({host: data.host , port: data.port}, function(err, addr){
          console.log(err, addr)
        })
      }
    }
  })

  return {
    createServer: function(op, cb){
      var server = new net.Server 
      var pkey = op.key // the requestor of this service

      server.on('connection', function(socket){
        // pipe this socket directly to a bot's next socket
        var link = ref.hasFeed(socket.remoteAddress)
      })
      server.listen(op.port, function(err){
        cb(err, server.address())
      })
    },
    proxy: function(remote, local, cb){ // local is usually going to be the bo
      
      var Socket = function() {
        return new net.Socket({
          readable: true,
          writable: true,
          allowHalfOpen: true
        })
      }

      var remoteSocket = Socket() 

      remoteSocket.connect(remote)

      remoteSocket.on('error', function(err){
        console.log(err)
      })

      remoteSocket.on('connect', function(){

        var localSocket = Socket()

        localSocket.connect(local)

        localSocket.on('error', function(err){
          console.log(err)
        })

        localSocket.on('connect', function(){

          localSocket.pipe(remoteSocket {end: false}).pipe(localSocket, {end: false})
            
        })
          
      })
      
    }


  }

}

var streams = []
var proxies = []

module.exports.server = function(farout, homie){

  var server = net.createServer(function(stream){


    // herein where its at
    // what it is
    // doin what it whiz
    // a new connect from outer space
    // use rpc to alert proximal bot to create to create a new proxy connection
    
    // rpc do, wait for connection

    var i = streams.push(stream)
    
    stream.on('end', function(){
      streams.splice(i, null)
    })
    

  })

  server.listen(port || process.argv[2])

}

// when an rpc says, create a new proxy, it means, two sockets
// one to the server, and one to the local bot itself
// the rpc will have all the connection details (ie port)

