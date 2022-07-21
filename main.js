//Importing Discord
const Discord = require("discord.js")
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'], intents: 0b11111111111111111 })
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord.js');


//Importing External Libraries
const fs = require('fs')

//Importing Local Libraries
const { logs, database } = require("./lib")
const { newProcess, deleteProcess } = require("./lib/database")

//Read Config File
let config = JSON.parse(fs.readFileSync("config.json"))
if (!config.auth) {
    console.log("No bot token detected, please put a token in config.json")
    return
}

//Load Commands
const commands = []
client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    commands.push(command.data.toJSON())
    client.commands.set(command.data.name, command)
}

//Main Method
main()
async function main() {
    //Connect to databases
    // Local DB
    await database.initializeLocalConnection("local.db")
    // External DB
    let connection = await database.initializeRemoteConnection(config.dbinfo)
    let auth = await database.testConnection()
    console.log(connection)
    console.log(auth)
    
    client.dev = config.dev

    //Log in to Discord
    await client.login(config.auth)

    //Deploy commands
    const rest = new REST({ version: '9' }).setToken(config.auth)
    try {
        console.log(`Loading slash commands...`)
        await rest.put(Routes.applicationGuildCommands(client.user.id, "917503567714213958"), { body: commands },)
        console.log('Slash commands loaded.')
    } catch (error) {
        console.error(error)
    }
}

client.once("ready", async () => {
    client.user.setPresence({ activity: { type: "WATCHING", name: "something do a thing" } })
    console.log("Connected to Discord.")
    await database.resetProcesses()

})

client.on("messageReactionAdd", async (r, u) => {
    if (u.bot) return;
    if (r.partial) await r.fetch().catch(e => console.log(e))
    let messageReactionAdd = require('./events/messageReactionAdd.js')
    await messageReactionAdd.run(client, r.message, Discord, r, u).catch(e => e.toString().includes('Error') ? logs.error(r.message, client, e) : e)
})

client.on("interactionCreate", async interaction => {
    if (interaction.isCommand()) {
        let command = client.commands.get(interaction.commandName)
        let permission = await database.getPermission(interaction.member || interaction.user, interaction.commandName, client)
        console.log(permission)
        if (permission == true) {
            await newProcess(interaction, interaction.commandName)
            await command.execute(interaction, client, Discord)
            await deleteProcess(interaction, interaction.commandName)
        } else {
            let embed = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setAuthor("Permission Denied")
                .setDescription(`You do not have permission to use this command.\n<@&${permission}> or higher is required to use it.`)
            await interaction.reply({ embeds: [embed], ephemeral: true })
        }
    } else if (interaction.isButton()) {

    } else if (interaction.isSelectMenu()) {

    }

})

client.on("messageCreate", async message => {
    if (message.author.bot) return

    if (message.channel.type == "DM") {

    } else {
        //Guild Commands
        let guildSettings = await database.getGuildSettings(message.guild.id)
        if (guildSettings?.length == 0) return message.channel.send(`This server has not been set up. Please use \`/setup\` to set up the bot.`)
        let prefix = guildSettings[0].prefix

        //Valid Commands
        if (message.content.indexOf(prefix) != 0) return;
        let args = message.content.slice(prefix.length).trim().split(' ')
        let commandName = args.shift().toLowerCase()
        let command = client.commands.get(commandName)
        if (command) {
            await newProcess(message, commandName)
            let res = await command.run(client, message, args, Discord)
            await deleteProcess(message, commandName)
            if (res && res.stack && res.message) {
                logs.error(res)
            }
        } else {
            let embed = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setAuthor("Invalid Command")
                .setDescription(`There was a problem processing \`${commandName}\` for the following reason:\nCommand does not exist.`)
            return message.reply({ embeds: [embed], ephemeral: true })
        }
    }
})