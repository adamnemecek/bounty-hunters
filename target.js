var async = require('async'),
    database = require('./database'),
    _user = require('./user'),
    expose = require('./utils').expose(exports),
    _ = require('underscore');

var targets = null;
database.notifications.once("open", function() {
  database.getCollection("targets", function(err, collection) {
    targets = collection;
  });
});


function randomLoop(cb) {
  _user.getAll(function(err, docs) {
    if(err) {
      cb(err);
    } else {
      var ordering = _.shuffle(_.range(docs.length));
      var pairings = _.zip(ordering, _.flatten([_.rest(ordering), _.first(ordering)]));
      async.forEach(pairings, function(bit, cb) {
        var user = docs[bit[0]],
            target = docs[bit[1]];
        setTarget(user, target, cb);
      }, cb);
    }
  });
}


function initUser(user, cb) {
  setRandomTarget(user, cb);
}
function setRandomTarget(user, cb) {
  _user.getAll(function(err, docs) {
    if(err) {
      cb(err);
    } else {
      var offset, doc;
      do {
        offset = Math.floor(docs.length * Math.random());
        doc = docs[offset];
      } while(doc.username == user.username);
      setTarget(user, doc, cb);
    }
  });
}
function setTarget(user, target, cb) {
  targets.update({uid: user._id}, {
    uid: user._id,
    target: target._id
  }, {upsert: true}, cb);
}
function getTarget(user, cb) {
  targets.findOne({uid: user._id}, function(err, doc) {
    if(err || !doc) {
      cb(err);
    } else {
      _user.getById(doc.target, cb, {
        getTarget: false
      });
    }
  });
}
function getNumHunters(user, cb) {
  targets.find({target: user._id}).count(cb);
}

expose(initUser, randomLoop);
expose(setRandomTarget, setTarget, getTarget, getNumHunters);