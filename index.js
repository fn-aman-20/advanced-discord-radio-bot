const host = require('express')();
host.get('/', (req, res) => res.send('Status: online'));
host.listen(2022);

const {
  Client,
  ChannelType,
  GatewayIntentBits
} = require('discord.js'),
{
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require('@discordjs/voice'),
config = require('./util/config'),
{ EventEmitter } = require('events'),
fetch = (...args) => import('node-fetch')
  .then(({ default: fetch }) => fetch(...args)),
cheerio = require('cheerio');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
  presence: config.status
}), radio = new EventEmitter();

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: 'play'
  }
}),
join = (channel) => {
  let connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator
  });
  connection.subscribe(player);
  connection.on('stateChange', (previous, current) => {
    if (current.status === 'disconnected') {
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator
      });
      connection.subscribe(player);
    }
  });
  return connection;
}, res = (...args) => createAudioResource(...args);

const setTopic = (channel, topic) => {
  if (channel.stageInstance?.topic === topic) return;
  channel.guild.stageInstances.fetch(channel.id)
  .then(i => {
    if (i.topic === topic) return;
    i.edit({
      topic: topic,
      privacyLevel: 1
    });
  })
  .catch(() => {
    channel.createStageInstance({
      topic: topic,
      privacyLevel: 1
    });
  });
},
streams = () => new Promise((resolve, reject) => {
  fetch('https://ilovemusic.de/streams')
  .then(raw => raw.text()
  .then(body => {
    const $ = cheerio.load(body), list = [];
    $('.content').each((i, content) => {
      const stream = $(content),
      text = stream.text().trim().split(`\n`),
      title = text.shift(),
      url = text.pop()?.trim()?.split(' ')?.pop();
      if (!title || !url) return;
      list.push({
        topic: title,
        url: url
      });
    });
    resolve(list);
  })
  .catch(err => reject(err)))
  .catch(err => reject(err));
});

client.once('ready', async () => {
  let sources = await streams(), timeout;
  if (!sources) return;

  player.on('error', () => radio.emit('play', sources));
  player.on('stateChange', (previous, current) => {
    if (previous.status === 'playing' && current.status === 'idle') {
      radio.emit('play', sources);
    }
  });
  
  radio.on('play', async (sources) => {
    if (timeout) clearTimeout(timeout);
    const source = sources[Math.floor(Math.random() * sources.length)],
    channel = await client.channels.fetch(config.channel);
    join(channel);
    if (channel.type === ChannelType.GuildStageVoice) {
      setTopic(channel, source.topic);
      if (channel.guild.members.me.voice?.suppress) {
        await channel.guild.members.me.voice.setSuppressed(false);
      }
    }
    player.play(res(source.url));
    timeout = setTimeout(() => radio.emit('play', sources), config.interval);
  });
  radio.emit('play', sources);
});

config.onboot(client, config.auth);
