var sublevel = require('level-sublevel')
var memdb = sublevel(require('memdb')())
var hyperlog = require('hyperlog')
var namegen = require('cat-names')
var keygen = require('ssb-keys').generate

module.exports = function(){
  var keys = keygen()
  var name = namegen.random()
  var bot = require('./')({
    keys: keys,
    name: name,
    log: hyperlog(memdb.sublevel(keys.id)),
    db: memdb.sublevel(keys.public)
  })
  return bot
}

//module.exports()
