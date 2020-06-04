exports.run = async (client, message, args, Discord) => {
    await message.channel.send(`There are currently ${message.guild.members.cache.size} members logged in the cache.`)
    await message.channel.send(`Updating cache...`)
    try {
        user = await message.guild.members.fetch()
    } catch (e) {
        await message.channel.send(e)
    }
    await message.channel.send(`There are now ${message.guild.members.cache.size} members logged in the cache.`)
}