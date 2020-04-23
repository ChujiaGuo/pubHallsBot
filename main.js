const fs = require("fs");
const dist = require("js-levenshtein")
const Discord = require("discord.js");
const client = new Discord.Client();
var config = JSON.parse(fs.readFileSync("config.json"))
var commands = JSON.parse(fs.readFileSync("commands.json"))

client.once("ready", async () => {
    /* var time = Date.now()
    var reset = 86400000 - (time % 86400000)
    setTimeout(async () => {
        let owner = await client.users.fetch(config.dev)
        await owner.send("Daily Restart.")
        process.exit(1)
    }, reset) */
    let commandFile = require(`./commands/updatesuspensions.js`);
    let message = undefined,
        args = undefined
    try {
        commandFile.run(client, message, args, Discord);
    } catch (e) {
        console.log(e)
    }

    console.log("Bot Up.")
    let owner = await client.users.fetch(config.dev)
    await owner.send("Bot Started.")
})

client.on("message", async message => {


    //Filters
    //Bot
    if (message.author.bot) return;
    //Not a command
    if (message.content.charAt(0) != config.prefix) return;
    /*
    //Not a command channel
    let commandArray = Object.values(config.channels.command)
    commandArray.push(config.channels.veteran.command)
    commandArray.push(config.channels.normal.command)
    commandArray.push(config.channels.event.command)
    if (!commandArray.includes(message.channel.id)) return message.channel.send("Command has to be used in a designated command channel.");
    */
    //Define Command
    let args = message.content.slice(config.prefix.length).trim().split(' ');
    let cmd = args.shift().toLowerCase();

    if (cmd.length == 0) return;
    //Attempt Command
    try {

        //Retrive Command File
        cmd = commands.aliases[cmd] || cmd
        delete require.cache[require.resolve(`./commands/${cmd}.js`)];
        let commandFile = require(`./commands/${cmd}.js`);
        commandFile.run(client, message, args, Discord);

    } catch (e) {
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
        if (e.code == "MODULE_NOT_FOUND") {
            var suggestionString = []
            var listAlias = Object.keys(commands.aliases)
            for (var i = 0; i < listAlias.length; i++) {
                if (dist(cmd, listAlias[i]) <= 4) {
                    suggestionString.push(`\`${commands.aliases[listAlias[i]]}\``)
                }
            }
            suggestionString = [...new Set(suggestionString)]
            suggestionString = suggestionString.join(', ')
            errorEmbed.setDescription(`There was a problem processing \`$${cmd}\` for the following reason: \n\n\`$${cmd}\` is not a command.\nPerhaps you mean one of these or their aliases?\n${suggestionString}`)
            message.channel.send(errorEmbed)
        } else {
            console.log(e)
            var owner = await client.users.fetch(config.dev)
            errorEmbed.setDescription(`There was a problem processing \`$${cmd}\` for the following reason: \n\nAn internal error occured. The developer has been notified of this and will fix it as soon as possible. The bot will DM you once finished.`)
            await message.channel.send(errorEmbed)
            errorEmbed.setDescription(`Error Processing: \`${cmd}\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
            await owner.send(errorEmbed)
        }
    }
})

client.login(config.auth)