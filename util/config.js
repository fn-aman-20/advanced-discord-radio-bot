const {
  ActivityType: {
    Playing,
    Listening,
    Streaming,
    Watching,
    Competing
  }
} = require('discord.js'),
onboot = require('./onboot');

module.exports = {
  onboot: onboot,
  auth: process.env.token, // bot token
  channel: process.env.channel, // voice/stage channel id
  status: {
    afk: false,
    status: 'idle', // idle, dnd, online, invisible
    activities: [{
      name: '24/7', // activity name
      type: Playing, // Listening, Watching, Competing, Streaming, Playing
      url: 'https://twitch.tv/nocopyrightsounds', // url for type 'Streaming'
    }]
  },
  interval: 6 * 60 * 60 * 1000, // interval to switch to random stream in milliseconds
}
