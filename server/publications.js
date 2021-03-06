import { BotChannels, BotCommands, BotMessage, GreetMessages, Images, QuizzQuestions, QuizzScores, Raiders, Settings, ShoutOuts, Stats, UserLocations } from '../imports/api/collections.js';
import { getUserGroups, hasRole } from './user_management.js';

export function init_publications() {
  //
  // ---------------------- CHANNELS -------------------------------
  //
  Meteor.publish('botChannels', function (sel) {
    if (!sel) sel = {};
    let opt = { sort: { channel: 1 } };

    let uid = this.userId;
    if (uid) {
      // If non admin, only publish enabled channels corresponding to groups associated to the user

      if (!hasRole(uid, ['admin'])) {
        //sel.channel = { $in: getUserGroups(uid) };
      }
      else {
        //opt.fields = { channel:1, live:1, 
        //}
      }
    }
    else {
      // Limited access for non logged users 
      // Only required fields
      //);
    }

    return BotChannels.find(sel, opt);

    //   this.ready();
  });

  //Publish the list of all channels where the bot is enabled
  Meteor.publish('EnabledChannels', function (sel) {
    if (!sel) sel = {};
    sel.enabled = true;
    return BotChannels.find(sel, { fields: { enabled: 1, channel: 1, live: 1, team: 1 } });
  });

  //Publish the list of all channels where the bot is enabled
  Meteor.publish('LiveChannels', function (sel) {
    if (!sel) sel = {};
    sel.live = true;
    return BotChannels.find(sel, {
      fields:
      {
        enabled: 1,
        channel: 1,
        live: 1,
        live_title: 1,
        live_started: 1,
        live_thumbnail_url: 1,
        live_viewers: 1,
        team: 1
      }
    });
  });

  // Liste des channels qui ont la fonction greet activée
  // Pour la greetings table (filtre exclusion de channel)
  Meteor.publish('GreetChannels', function () {
    if (hasRole(this.userId, ['admin', 'greet'])) {
      let sel = {
        enabled: true,
        greet: true
      };
      return BotChannels.find(sel);
    }
    this.ready();
  });


  // ----------------- SHOUTOUTS ------------------
  Meteor.publish('shoutouts', function (sel) {
    //    if (hasRole(this.userId, ['admin', 'quizz'])) {
    if (!sel) sel = {};
    return ShoutOuts.find(sel);
    //   }
    //  this.ready();
  });

  ShoutOuts.allow({
    insert(userid, doc) {
      //      if (userid) return true;
    },
    update(userid, doc) {
      //      if (userid) return true;
    },
    remove(userid, doc) {
      if (hasRole(userid, 'admin'))
        return true;

    }
  });


  //
  // ---------------------- QUIZZ -------------------------------
  //

  Meteor.publish('quizzQuestions', function (sel) {
    if (hasRole(this.userId, ['admin', 'quizz'])) {
      if (!sel) sel = {};
      return QuizzQuestions.find(sel);
    }
    this.ready();
  });



  Meteor.publish('quizzScores', function (sel) {
    //if (this.userId) {
    if (!sel) sel = {};
    return QuizzScores.find(sel, { sort: { score: -1 }, limit: 50 });
    //}
    //this.ready();
  });

  //
  // ---------------------- LOCATIONS -------------------------------
  //

  UserLocations.before.insert(function (userid, doc) {
    console.error('before insert', doc);
    if (doc.allow === true)
      doc.mapname = doc.dname;
  });

  UserLocations.before.update(function (userid, doc, fieldNames, modifier, options) {
    if (fieldNames.indexOf('allow') >= 0) {
      if (modifier.$set != undefined) {
        if (modifier.$set.allow === true)
          modifier.$set.mapname = doc.dname;
        else {
          if (!modifier.$unset)
            modifier.$unset = {};
          modifier.$unset.mapname = "";
        }
      }
    }
  });

// Custom Commands
//


Meteor.publish('customcommands', function (sel) {
  if (hasRole(this.userId, ['admin'])) {
    sel = sel || {};
    return BotCommands.find(sel);
  }
  this.ready();
});

BotCommands.allow({
  insert(userid, doc) {
    if (hasRole(userid, 'admin'))
      return true;
  },
  update(userid, doc) {
    if (hasRole(userid, 'admin'))
      return true;
  },
  remove(userid, doc) {
    if (hasRole(userid, 'admin'))
      return true;
  }
});
  //
  // ---------------------- GREET MESSAGES -------------------------------
  //

  Meteor.publish('greetMessages', function (sel) {
    if (hasRole(this.userId, ['admin', 'greet'])) {
      sel = sel || {};
      return GreetMessages.find(sel);
    }
    this.ready();
  });



  Meteor.publish('settings', function (sel) {
    if (hasRole(this.userId, 'admin')) {
      sel = sel || {};
      return Settings.find(sel);
    }
    this.ready();
  });


  // ------------------- RAIDERS --------------

  Meteor.publish('raiders', function (sel) {
    //if (hasRole(this.userId, 'admin')) {
    if (this.userId) {
      sel = sel || {};
      return Raiders.find(sel);
    }
    this.ready();
  });

  // ------------------- Bot Messages for OSD --------------
  // No need to be logged
  Meteor.publish('lastmessages', function (sel) {
    sel = sel || {};
    if (sel.channel) {
      return BotMessage.find(sel);
    }
    this.ready();
  });


  //
  // ---------------------- TRANSLATOR USAGE STATS -------------------------------
  //

  Meteor.publish('statistics', function (sel) {
    if (hasRole(this.userId, ['streamer'])) {
      sel = sel || {};
      return Stats.find(sel);
    }
    this.ready();
  });

  Meteor.publish('images', function (sel) {
    sel = sel || {};
    //    return (Images.find(sel).cursor);
    return (Images.collection.find(sel));
  });

  Images.allow({
    insert(userid, doc) {
      if (userid) return true;
    },
    update(userid, doc) {
      if (userid) return true;
    },
    remove(userid, doc) {
      //      if (userid) return true;
      if (hasRole(userid, 'admin'))
        return true;

    }
  });

  Meteor.methods({
    getGroups: function () {
      if (hasRole(this.userId, ['admin'])) {
        let cur = BotChannels.find({}, { fields: { channel: 1 }, sort: { channel: 1 } });
        let a = cur.fetch();
        //      console.error(a)
        let res = a.map((item) => item.channel);
        //      console.error(res);
        return res;
      }
      return getUserGroups(this.userId);
    }
  });


  // publication des Roles
  Meteor.publish('userRoles', function () {
    // Si admin
    if (hasRole(this.userId, ['admin'])) {
      return Meteor.roleAssignment.find();
      //      return Meteor.roleAssignment.find({}, {fields: {'role':1}});
    } else {
      this.ready();
    }
  });


}


