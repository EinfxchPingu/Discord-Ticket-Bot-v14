const { Client, GatewayIntentBits, Partials, ActivityType, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const path = require('path');
const ftp = require('basic-ftp');
const discordTranscripts = require('discord-html-transcripts');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const dataFilePath = path.join(__dirname, 'data.json');
let data = require(dataFilePath);

if (!data.tickets) {
  data.tickets = [];
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Channel],
});

const clientId = 'BOT_CLIENT_ID';
const token = 'BOT_TOKEN';
const logChannelId = 'LOG_CHANNEL_ID';

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
  const openTicketsCount = data.tickets.length;
  client.user.setPresence({
    activities: [{ name: `📖 - auf ${totalMembers} Mitglieder`, type: ActivityType.Watching }],
    status: 'dnd',
  });
});


function formatDateInBerlinTimezone(date) {
  const berlinTimezone = 'Europe/Berlin';
  return new Date(date).toLocaleString('de-DE', { timeZone: berlinTimezone });
}



//Module - Ticket interaction

client.on('interactionCreate', async interaction => {
  if (!interaction.isSelectMenu()) return;

  const selectedValue = interaction.values[0];

  if (selectedValue === 'support' || selectedValue === 'apply' || selectedValue === 'report') {
    const username = interaction.user.username;
    const formattedUsername = username.charAt(0).match(/[a-zA-Z]/) ? username.charAt(0).toUpperCase() + username.slice(1) : username;
    const fselect = selectedValue.charAt(0).match(/[a-zA-Z]/) ? selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1) : selectedValue;

    const channelName = `🎫︱${formattedUsername}`;
    const categoryId = interaction.channel.parentId;

    try {
      const thread = await interaction.channel.threads.create({
        name: channelName,
        type: ChannelType.PrivateThread,
        permissionOverwrites: [
        {
			id: interaction.guild.id,
			allow: [PermissionsBitField.Flags.SendMessages],
		},
		{
			id: interaction.guild.id,
			allow: [PermissionsBitField.Flags.SendMessages],
		},
		],
       })
        .then(async (thread) => {
          await thread.members.add(interaction.user);
		  const ticketembed = new EmbedBuilder()
            .setTitle(`\`🎫\`〢Welcome in your Ticket!`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(`Hey <@${interaction.user.id}>!
>>> Your support ticket has been successfully created and a responsible team member has been contacted. It's best to think in advance about how you want to formulate your request.

**Ticket Details**
Theme: \`${fselect}\`
Creator: \`${interaction.user.tag}\`
`)
            .setColor('#0798e3');

          const closebutton = new ButtonBuilder()
            .setCustomId('close')
            .setLabel('⛔ x Close Ticket')
            .setStyle(ButtonStyle.Secondary);

         
          const embedrow = new ActionRowBuilder()
            .addComponents(closebutton);
          thread.send({ embeds: [ticketembed], components: [embedrow] });

          const logEmbed2 = new EmbedBuilder()
              .setTitle(`\`🔓\`〢A ticket has been opened!`)
        .setDescription(`・Ticket-ID: #${interaction.channel.id}
					・Ticket Panel: ${fselect}
                    ・Ticket created by: <@${interaction.user.id}> *(${interaction.user.tag})*
                    ・Date and time: ${formatDateInBerlinTimezone(new Date())}`)
        .setColor('#89CA8C');

          const buttonlog = new ButtonBuilder()
            .setCustomId('join')
            .setLabel('🚪 x Join the Ticket')
            .setStyle(ButtonStyle.Secondary);
          const logChannel = await interaction.guild.channels.cache.get(logChannelId);
		  const logembedrow = new ActionRowBuilder()
            .addComponents(buttonlog);
          
          const sentLogEmbed2 = await logChannel.send({ embeds: [logEmbed2], components: [logembedrow] });

          const ticketData = {
            ticketId: thread.id,
            logEmbed2Id: sentLogEmbed2.id,
          };

          data.tickets.push(ticketData);
          fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

          await interaction.reply({ content: `\`✅\`〢Your ticket was created here: <#${thread.id}>`, ephemeral: true });
        })
    } catch (error) {
      interaction.reply({ content: '`❌`〢An error has occurred! Please report the following error to an administrator:``` ' + error + "```", ephemeral: true });
    };
  }
  
});


client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const threadId = interaction.channelId;
  const thread = await client.channels.fetch(threadId);

  if (interaction.customId === 'close') {
    const confembed = new EmbedBuilder()
      .setTitle(`\`❗\`〢Are you sure?`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(`>>> Are you sure you want to close the ticket? This process cannot be undone!`)
      .setColor('#FF0000');

    const closeconfbutton = new ButtonBuilder()
      .setCustomId('close_conf')
      .setLabel('⛔ x Close Ticket')
      .setStyle(ButtonStyle.Secondary);
    const buttonsRow2 = new ActionRowBuilder()
      .addComponents(closeconfbutton);

    interaction.reply({ embeds: [confembed], components: [buttonsRow2] });

  } else if (interaction.customId === 'close_conf') {
    try {
      const transcriptAttachment = await discordTranscripts.createTranscript(interaction.channel);

      const transcriptsFolder = 'transcripts';
      if (!fs.existsSync(transcriptsFolder)) {
        fs.mkdirSync(transcriptsFolder);
      }
      const transcriptFilePath = path.join(transcriptsFolder, `${interaction.channel.id}.html`);
      fs.writeFileSync(transcriptFilePath, transcriptAttachment.attachment);

      const logEmbed = new EmbedBuilder()
        .setTitle(`\`🔒\`〢A ticket has been closed!`)
        .setDescription(`・Ticket-ID: ${interaction.channel.id}
                    ・Ticket closed by: <@${interaction.user.id}> *(${interaction.user.tag})*
                    ・Date and Time: ${formatDateInBerlinTimezone(new Date())}`)
        .setColor('#E17272');

      const viewTranscriptButton = new ButtonBuilder()
        .setLabel('📝 x Open Transcript')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://einfxchpingu.net/ticket/${interaction.channel.id}.html`);

      const TButton = new ActionRowBuilder().addComponents(viewTranscriptButton);

      const ftpClient = new ftp.Client();
      await ftpClient.access({
        host: 'HOSTNAME',
        user: 'USERNAME',
        password: 'PASSWORD',
      });

      await ftpClient.uploadFrom(transcriptFilePath, `/www/ticket/${interaction.channel.id}.html`);

      const logChannel = await interaction.guild.channels.cache.get(logChannelId);

      await logChannel.send({ embeds: [logEmbed], components: [TButton] });
      await thread.send('Ticket wurde geschlossen!');
      await thread.setArchived(true);

      const ticketData = data.tickets.find(t => t.ticketId === thread.id);

      if (ticketData) {
        const dataIndex = data.tickets.indexOf(ticketData);
        data.tickets.splice(dataIndex, 1);
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
      }

    } catch (error) {
      interaction.reply({ content: '`❌`〢An error has occurred!Please report the following error to an administrator:``` ' + error + "```", ephemeral: true });
    }
  
} else if (interaction.customId === 'join') {
    try {
      const ticketData = data.tickets.find(t => t.logEmbed2Id === interaction.message.id);

      if (ticketData) {
        const threadId = ticketData.ticketId;
        const thread = await client.channels.fetch(threadId);

        if (thread) {
          await thread.members.add(interaction.user);
          await interaction.reply({ content: `\`✅\`〢You have been added to the ticket: <#${thread.id}>`, ephemeral: true });
        } else {
          await interaction.reply({ content: '`❌`〢An error has occurred!', ephemeral: true });
        }
      } else {
        await interaction.reply({ content: '`❌`〢The ticket could not be found!', ephemeral: true });
      }
    } catch (error) {
      interaction.reply({ content: '`❌`〢An error has occurred!Please report the following error to an administrator:``` ' + error + "```", ephemeral: true });
    }
  }  
});
      
//Modul - Ticket interaction end

client.commands = new Map();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [...client.commands.values()].map(command => command.data.toJSON()) },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (!client.commands.has(commandName)) return;

  try {
    await client.commands.get(commandName).execute(interaction);
    } catch (error) {
    await interaction.reply({ content: '`❌`〢Es ist ein Fehler aufgetreten! Bitte melde folgenden Error einem Administrator:``` ' + error + "```", ephemeral: true });
    console.error(error);
  }
});
startCooldownUpdateLoop();
client.login(token);
