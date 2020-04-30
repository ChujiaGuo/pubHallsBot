exports.run = async (client, message, args, Discord, sudo = false) => {
    const m = await message.channel.send("Ping?");
    m.edit(`Bot latency is \`${m.createdTimestamp - message.createdTimestamp}\` ms. API Latency is \`${Math.round(client.ws.ping)}\` ms.`);
}