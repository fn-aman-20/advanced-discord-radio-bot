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
{ EventEmitter } = require('events');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ],
  presence: config.status
}),
radio = new EventEmitter(),
player = createAudioPlayer({
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
},
res = (...args) => createAudioResource(...args),
setTopic = (channel, topic) => {
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
};

player.on('error', () => radio.emit('play'));
player.on('stateChange', (previous, current) => {
  if (previous.status === 'playing' && current.status !== 'playing') radio.emit('play', config.sources);
});

client.once('ready', async () => {
  const channel = await client.channels.fetch(config.channel);
  join(channel);
  radio.on('play', async (sources) => {
    const source = sources[Math.floor(Math.random() * sources.length)];
    if (channel.type === ChannelType.GuildStageVoice) {
      setTopic(channel, source.topic);
      if (channel.guild.members.me.voice?.suppress) await channel.guild.members.me.voice.setSuppressed(false);
    }
    player.play(res(source.url));
    setTimeout(() => radio.emit('play', config.sources), config.interval);
  });
  radio.emit('play', config.sources);
});

config.onboot(client, config.auth);
