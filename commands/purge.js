const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync(`./configs/${message.guild.id}.json`));
    try {
        if (isNaN(args[0])) {
            return message.channel.send(`${args[0]} is not a number.`)
        }
        console.log(args[0])
        message.channel.bulkDelete(parseInt(args[0]) + 1)
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`purge\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}