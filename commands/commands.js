const fs = require('fs')

exports.run = async (client, message, args, Discord) => {
    var config = JSON.parse(fs.readFileSync("config.json"))
    var commands = JSON.parse(fs.readFileSync("commands.json"))
    var commandsEmbed = new Discord.MessageEmbed()
    .setColor("#ff1212")
    .setTitle("Commands List")
    .setDescription("**__Raiding:__**\n```css\nafk, resetafk, clean, lock, unlock, bazaarparse```\n**__Moderation:__**```css\nmanualverify, manualvetverify, suspend, vetsuspend, unsuspend, unvetsuspend, kick, addalt, changename```\n**__Restricted:__**```css\nsetup```")
    await message.channel.send(commandsEmbed)
}