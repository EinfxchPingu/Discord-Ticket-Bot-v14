const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, EmbedBuilder, StringSelectMenuBuilder, PermissionFlagsBits, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('📚〢Ticket Commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('🔧〢Create a Ticket'),
  ),
  async execute(interaction) {
    
    if (interaction.options.getSubcommand() === 'setup') {
      
      const ticketEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setDescription(`### \`👋\`〢Create a Ticket
・ Welcome to our Ticket Support, the first point of contact if you have a problem or just want to contact the server team!
### \`📋\`〢Support Selection
・ Select what kind of support you need in the select menu below!

x General Support
x Report a User or Bug
x Join the team
`);
        const ticketselect = new StringSelectMenuBuilder()
			.setCustomId('ticketselect')
			.setPlaceholder('📌〢Select a Option...')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('📌 x General Support')
					.setDescription('Click on me to open a ticket')
					.setValue('support'),
				new StringSelectMenuOptionBuilder()
					.setLabel('📡 x Report a User or Bug')
					.setDescription('Click on me to open a ticket')
					.setValue('report'),
				new StringSelectMenuOptionBuilder()
					.setLabel('🚀 x Join the team')
					.setDescription('Click on me to open a ticket')
					.setValue('apply'),
                
			);
      const row = new ActionRowBuilder()
			.addComponents(ticketselect);
      await interaction.channel.send({ embeds: [ticketEmbed], components: [row] });
      await interaction.reply({ content: '`✅`〢The ticket system has been successfully created!', ephemeral: true });
    }
  },
};
