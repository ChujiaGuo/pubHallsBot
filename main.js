const fs = require("fs");
const dist = require("js-levenshtein")
const Discord = require("discord.js");
const client = new Discord.Client();
var config = JSON.parse(fs.readFileSync("config.json"))

client.once("ready", async () => {
    console.log("Bot Up.")
    let owner = await client.users.fetch(config.dev)
    await owner.send("Bot Started.")
})

client.on("message", async message => {
    //Filters
    if (message.author.bot) return;
    if (message.content.charAt(0) != config.prefix) return;

    //Define Command
    let args = message.content.slice(config.prefix.length).trim().split(' ');
    let cmd = args.shift().toLowerCase();

    if (cmd.length == 0) return;
    //Attempt Command
    try {

        //Retrive Command File
        //cmd = commands.aliases[cmd] || cmd
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
            var owner = await client.users.fetch(config.dev)
            errorEmbed.setDescription(`There was a problem processing \`$${cmd}\` for the following reason: \n\nAn internal error occured. The developer has been notified of this and will fix it as soon as possible. The bot will DM you once finished.`)
            await message.channel.send(errorEmbed)
            errorEmbed.setDescription(`Error Processing: \`${cmd}\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
            await owner.send(errorEmbed)
        }
    }
})

client.login(config.auth)