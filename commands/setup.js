const { SlashCommandBuilder } = require('@discordjs/builders');
const { database } = require("../lib/index.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName(`setup`)
        .setDescription(`Simple Bot Setup. For advanced setup, please use the setup command.`)
        .addStringOption(option =>
            option
                .setName("prefix")
                .setDescription(`New bot prefix. To see current prefix, /prefix.`)
                .setRequired(true)
        ),
    execute: async (interaction, client, Discord) => {
        return new Promise(async (resolve, reject) => {
            if (!interaction.guild) return interaction.reply("This must be used in a guild.")

            await database.updateGuildSettings(interaction.guild.id, { prefix: interaction.options.getString("prefix") }, interaction)
    
            let response = new Discord.MessageEmbed()
                .setColor("#30ffea")
                .setAuthor("Prefix Changed")
                .setDescription(`Your new prefix is: \`${interaction.options.getString("prefix")}\``)
                .setFooter(`Performed by ${interaction.user.tag}`)
            await interaction.reply({ content: "Done!", ephemeral: true })
            await interaction.channel.send({ embeds: [response] })
            resolve(true)
        })
    },
    run: async (client, message, args, Discord) => {
        return new Promise(async (resolve, reject) => {
            try{

            }catch(e){
                resolve(e)
            }
        })
    }
}