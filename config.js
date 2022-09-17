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
  auth: process.env.token,
  channel: process.env.channel,
  status: {
    activity: {
      name: '24/7', // activity name
      type: Playing, // Listening, Watching, Competing, Streaming, Playing
      url: 'https://twitch.tv/nocopyrightsounds', // url for type 'Streaming'
      status: 'idle' // idle, dnd, online, invisible
    }
  },
  sources: [ // responsive streams! just put in your sources below and enjoy :)
    {
      topic: 'I Love Radio', // for stage channels (stage topic)
      url: 'https://streams.ilovemusic.de/iloveradio1.mp3' // source
    },
    {
      topic: 'I Love The Sun',
      url: 'https://streams.ilovemusic.de/iloveradio15.mp3'
    },
    {
      topic: 'I Love Chill Hop',
      url: 'https://streams.ilovemusic.de/iloveradio17.mp3'
    },
    {
      topic: 'I Love Greatest Hits',
      url: 'https://streams.ilovemusic.de/iloveradio16.mp3'
    }
  ]
}
