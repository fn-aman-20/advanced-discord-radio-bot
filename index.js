const host = require('express')();
host.get('/', (req, res) => res.send('Status: online'));
host.listen(2022);

const {
  Client, ActivityType,
  GatewayIntentBits: {
    GuildVoiceStates
  },
  ChannelType: {
    GuildStageVoice
  }
} = require('discord.js'),
{
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require('@discordjs/voice'),
{ exec } = require('child_process'),
main = require('./config');

const client = new Client({
  intents: [
    GuildVoiceStates
  ]
}),
player = createAudioPlayer({
  behaviors: {
    noSubscriber: 'pause'
  }
}),
join = (vc) => joinVoiceChannel({
  channelId: vc.id,
  guildId: vc.guild.id,
  adapterCreator: vc.guild.voiceAdapterCreator
}),
setTopic = async (channel, topic) => {
  if (channel.stageInstance?.topic === topic) return;
  await channel.guild.stageInstances.fetch(channel.id)
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

let sources = main.sources, resource,
length = (24 * 3600)/sources.length,
tryPlaying = (res) => {
  try {
    if (player._state.status === 'playing') {
      player.stop();
      player.play(res);
    } else {
      player.play(res);
    }
  } catch { exec('kill 1') }
};

/* 
   Bot Coded by Adios#4891
   fn-aman-20 on GitHub
   bit.ly/fantellive
*/

client.on('ready', async () => {
  const channel = await client.channels.fetch(main.channel);
  setInterval(() => {
    const d = new Date(),
    time = (d.getUTCHours() * 3600) + (d.getUTCMinutes() * 60) + d.getUTCSeconds(),
    position = Math.floor(time/length);
    if (channel.stageInstance) {
      if (sources[position].topic === channel.stageInstance.topic) return;
      resource = createAudioResource(sources[position].url, {
        metadata: sources[position]
      });
      tryPlaying(resource);
      instance = setTopic(channel, resource.metadata.topic);
    } else {
      if (resource) {
        if (resource.metadata.topic === sources[position].topic) return;
        resource = createAudioResource(sources[position].url, {
          metadata: sources[position]
        });
        tryPlaying(resource);
      } else {
        resource = createAudioResource(sources[position].url, {
          metadata: sources[position]
        });
        tryPlaying(resource);
        if (channel.type === GuildStageVoice) setTopic(channel, resource.metadata.topic);
      }
    }
  }, 15 * 1000);

  player.on('error', () => tryPlaying(resource));
  player.on('stateChange', (previous, current) => {
    console.log(`[audio] :: ${previous.status} => ${current.status}`);
    if (previous.status !== 'idle' && current.status === 'buffering' || current.status === 'idle') tryPlaying(resource);
  });
  
  const connection = join(channel);
  connection.subscribe(player);
  
  connection.on('ready', async () => {
    if (channel.type !== GuildStageVoice) return;
    await channel.guild.members.me.voice.setSuppressed(false);
  });

  connection.on('stateChange', (previous, current) => {
    console.log(`[voice] :: ${previous.status} => ${current.status}`);
    if (current.status === 'disconnected') connection = join(channel);
  });

  let presence = main.status.activity,
  activity = {
    activities: [{
      name: presence.name.toString() || '24/7',
      type: typeof presence.type === 'number' ? presence.type : ActivityType.Streaming
    }]
  };
  if (presence.type === ActivityType.Streaming) {
    activity.activities[0].url = presence.url || 'https://twitch.tv/nocopyrightsounds';
  } else activity.status = typeof presence.status === 'string' ? presence.status : 'idle';
  client.user.setPresence(activity);
});

main.onboot(client, process.env.token);
