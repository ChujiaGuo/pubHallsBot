const fs = require('fs')
const { config } = require('process')

exports.run = async (client, message, args, Discord) => {
    let config = JSON.parse(fs.readFileSync('config.json'))
    let guides = {
        "New Channels (All Staff) Part 1": "Welcome to the staff team! You may notice a large amount of new channels. This will give you a rundown of most of these new channels.\n<#397616976337436692> = These are staff rules. Do not break them or you will be demoted.\n<#661316400077471764> = There are many helpful resources in this channel to further your raid leading skills.\n<#460732290117533696> = This is where higher-ups post important announcements that may impact you.\n<#550474278357696522> = This is where promotions, demotions, and breaks are logged. Watch this to find out when your fellow leaders receive their promotions!\n<#722957101294420068> = Basically useless for the time being. Ignore this channel unless BlueBot goes down.",
        "New Channels (All Staff) Part 2": "<#488881485366165515> = The primary staff social channel. Head on over and say hi!\n<#556627985227055155> = If you have any serious ideas, concerns, questions, or requests you can send them here. Please don't joke around here, or <@!756731789145538646> will find you.\n<#734958358557360179> = This is where your weekly runs are logged. If you aren't sure you've met quota, this is where to look.\n<#428635482872741893> and <#446916716455395328> = Mute these channels, you will never need them.\n<#432995686678790144> = The primary commands channel. If you need to start an afk, or something, this is where to do it.\n<#395718182708445204> = Raid logs. If you need to find a past run, look here.\n<#718232943364931595> = This is where you can find your afk channel after you're done with your run and delete it. Don't delete other people's channels.",
        "New Channels (RL)": "Congratulations on Raid Leader! You will now have access to two more channels.\n<#378994910927388683> = Your chat with fellow Raid Leaders. Here, you will be able to vote on ARL -> RL Promotions as well as TRL -> ARL Promotions. There are some other things that happen here, but you'll find those out in time.\n<#798606199246290945> = You may remember this from your TRL days. As an RL, you will be expected to provide incoming TRLs with their Trials, as previous RLs did for you. After doing a trial, you can post feedback into <#691639289838043236>.",
        "New Channels (VRL)": "Congratulations on Veteran Raid Leader! You now have access to a few new channels.\n<#591037506942795777> = Your chat with fellow Veteran Raid Leaders. Here, you will be able to vote on RL -> Fullskip Promotions as well as Fullskip -> VRL Promotions. This is also a place to discuss future VRL candidates and anything relating to Veteran Runs. \n<#556932682316120109> = The primary commands channel for anything pertaining to Veteran Runs. This includes starting afk checks, logging runs as well as vet bans.\n<#721046869366669403> = The equivalent of <#718232943364931595>, but for VC's in the Veteran Section.",
        "New Channels (Security) Part 1": "As a security, you will be able to see a few channels that normal raid leaders can't. For the time being, these are found at the top of the server.\n<#523701214723178506> <#746634644644167680> = These are for developers and higher ups. Ignore these for the time being, unless you are interested in recent bot updates.\n<#756246227766738994> = This is where you can submit bug reports. Read the pinned message.\n<#396694518738714634> <#525238682559578112> <#742208042044620881> = These are log channels. Keep them muted. You'll only need these to check on past raids and other stuff.\n<#526477213831528460> = Announcements for mods. Kinda obvious.\n<#420322594604974080> = Remember Cansonio's Basement? This is that but for security+\n<#347885119349981194> = Serious discussion or questions about server sided actions. Please do not joke around here. <@!756731789145538646> won't find you, but the officers and mods will look at you with disappointment in their eyes.",
        "New Channels (Security) Part 2": "<#777320384219185182> <#777323038559436841> = To keep track of security quota. These will be automatically updated upon using parse.\n<#464829705728819220> = This is where you do server-sided commands such as manual verification and adding alts. Please **do not** do those in <#432995686678790144>.\n<#362714467257286656> = This is where server-sided things are logged. If something requires you to do something, such as mute, post a reason with proof here if the bot does not already.",
        "Start a run": "Head on over to <#432995686678790144>, the command to start an afk check is `afk`.\nThe full usage of this command is `afk (runType) (runLocation)`.\nBefore reaching VRL, your options for (runType) are cults, voids, and fullskip voids (Fullskip+).\n(runLocation) is the location your run will be taking place.\nFor example, if you want to start a void in USSW R, your command would be `afk c ussw r`.\nOnce you have entered the command, you will be given two options, to abort the afk, and to open the channel.\nMake sure to have all your reactions before opening the channel.\nOnce the channel is open, you can end the afk by reacting to the ❌ in <#379779029479194624>",
        "Log a run": "The command for logging runs is `log (runType) (assists) (quantity)`.\n(runType) is the same as for starting runs, but fullskip voids are counted as normal voids.\n(assists) are optional, if someone parsed your run or contributed in a helpful manner, ping them here. You can assist multiple people per run.\n(quantity) defaults to 1, if you need to log multiple just put a higher number. This parameter is optional. Also, once your run is finished, you can delete your raiding channel by reacting to the corresponding ❌ in <#718232943364931595>",
        "Log various things": "As a raid leader, you might have to log things like vials .\nIn order to log vials, you have two commands, `uv (user)` and `av (user)`. Use `uv` for when a raider pops a vial, and `av` when a raider obtains a vial.\n(user) can be the raider's ign or mention.",
        "Ask for feedback": "Head on over to <#773039098839302164>, and ping the role above you for feedback.\nIf you're an ARL, you can ping Raid Leader for feedback.\nIf you're an RL, you can ping Fullskip for ghost trials and Veteran Raid Leader for fullskip trials.\nEx: `;Blazepig @Raid Leader Can I get some feedback for my Void run?`",
        "Suspend as an ARL": "As an ARL, you do not have access to the `suspend` command. However, there might still be those in your runs who are breaking rules.\nIn such a scenario, take a screenshot of the infraction, and post it in <#446912827127758848>. Afterwards, do a `find` on the user, and if the person is in the server, ping Security.",
        "Suspend as an RL+": "Now that you are a Raid Leader (or Security), you have access to the `suspend` command. Like before, post suspension proof in <#446912827127758848>. Once again, do the `find` on the user. However, you can now suspend them yourself. The command for suspending is `suspend (users) (length) (reason)`.\n(users) can be either a single raider ign or multiple igns separated with spaces.\n(length) is the suspension duration. The most common ones are crashing and not meeting reqs, these are `2 d`. If there is a different infraction, there is a more detailed list in <#397616976337436692>.\n(reason) is kinda self-explanatory, this is why you're suspending those raider(s).",
        "Security Disclaimer": "**There are many things that a security has to keep track of. This is only a brief overview. Do not treat this like a step by step guide on how to moderate the server**",
        "Parse a run (Part 1: VC Parse)": "When raiding, there will be people joining the run who aren't supposed to be in the run. If you have the time, you can go ahead and parse the raid. In order to do this, you will need a screenshot of the `/who` in-game (Windows + Shift + S). Make sure that everyone is already in the run and that the screenshot is taken over black tiles to make it easier to read.\nThe command is `pm`, and you can attach the screenshot as a normal image or a image link. The bot will compare the people shown in the screenshot to those in the voice channel. For all the names the bot shows, do a `find` on them, and check if they are in the correct channel. If they are ignore them, otherwise lock them and tell the key to kick them. There are times when the bot reads characters incorrectly. In this scenario, compare the names to people listed in the \"Suspected Alts\" portion of the parse.",
        "Parse a run (Part 2: Character Parse)": "Lock everyone on the character parse. If they are meeting requirements, ignore them. If they are not, take a screenshot of them in game. A screenshot of the parse itself is not enough. Post the screenshot in <#446912827127758848> along with a `find`. If they are not meeting stat requirements, screenshot the user's realmeye along with proof that they were on the character that doesn't meet requirements.",
        "Create and use raiding templates": "",
        "Manually verify": "You should have received a full breakdown of alts vs. not alts during your promotion. You have a good understanding of what a realmeye of a main looks like. Things to keep in mind are:\n1. Character list. Do they have a lot of slots? Do they have a lot of alive fame that would indicate play time? Do they have a good amount of non tradable items?\n2. Skins. Do they have skins that you need to grind for (non tradable)?\n3. Do they have a good pet? Usually a max rare is decent.\n4. Graveyard DEATHS: Do they have a lot of deaths that seem worthwhile (Not 50 level 3 deaths)? Do they have a good amount of 1/8 deaths?\n5. Graveyard SUMMARY: Look at dungeon completes, mainly sprites, udls, snakes. How much \"active for\" time do they have? Usually 3 days is the bare minimum.\n6. Fame history. Have they been playing recently? Look at weekly and total fame history. Look for consistent and prolonged game play.",
        "Add an alt": "In order to prove that they own the alt, the user must provide a screenshot of them on the alt, in vault, saying their discord tag. Text bubbles must be on. If any of these criteria are not met, then ask for a screenshot that has all of these criteria. The command for adding alts is `addalt` or `aa`. The full usage is `addalt (user) (altname) (proof)`\n(user) should be the user's id.\n(altname) is the alt that they want added.\n(proof) is the image proof that they own that alt. This can be the raw image.",
        "Change a name": "The command is similar to `addalt`, but `changename` or `cn`. Instead of image of them in vault, please use a screenshot of the user's realmeye with all past names shown, and instead of an altname, use their new name.",
        "Answer mod mail (Part 1)": "There is a list of reactions pinned in <#525683068745547776> that tell you what each reaction does. There is no one thing to do for modmails.\nIncorrect Command: The most common ones are an incorrect version of either the `join` or `stats` command. In this scenario, you can either respond with the correct version of the command, or just trash it.\nFeedback for RLs: Depending on how detailed and constructive the feedback is, you have two options. If it's constructive and detailed, you can thank them and ping an HRL (individually please!) and have them log it. If it's a simple feedback, you should ask for clarification.\nServer Feedback: You can always provide your own stance of feedback. If there is a piece of well-thought out feedback or suggestion, feel free to put it in <#347885119349981194> and ask for general opinions.",
        "Answer modmail (Part 2)": "Verification help: Copy the user id, it can be found under `USER ID` in the modmail. Head on over to <#477203736444403722> to see where the user is getting stuck. If they have been blacklisted, look up who blacklisted them in <#473702116213653504> and refer the user to that person.",
        "Create a mod log": "There is no be all end all for manual mod logs. If you find yourself in a situation where you need to manually log something, make sure you put the affected user's mention as well as any actions done in that message. "
    }
    let roles = {
        "arl": ["New Channels (All Staff) Part 1", "New Channels (All Staff) Part 2", "Start a run", "Log a run", "Log various things", "Ask for feedback", "Suspend as an ARL"],
        "rl": ["New Channels (RL)", "Parse a run (Part 1: VC Parse)", "Parse a run (Part 2: Character Parse)", "Suspend as an RL+"],
        "vrl": ["New Channels (VRL)", "Create and use raiding templates"],
        "security": ["New Channels (All Staff) Part 1", "New Channels (All Staff) Part 2", "New Channels (Security) Part 1", "New Channels (Security) Part 2", "Security Disclaimer", "Parse a run (Part 1: VC Parse)", "Parse a run (Part 2: Character Parse)", "Suspend as an RL+", "Manually verify", "Add an alt", "Change a name", "Answer mod mail (Part 1)", "Answer modmail (Part 2)", "Create a mod log"]
    }
    if (!args[0]) return message.channel.send("Please specify a role you would like help for.")
    if (!roles[args[0]]) return message.channel.send("Please specify a valid role. Valid roles are: `arl` `rl` `vrl` `security`")
    let role = await message.guild.roles.cache.find(r => r.id == config.roles.staff[args[0]])
    let permcheck = require('./permcheck.js')
    let auth = await permcheck.run(client, message.member, role.id)
    if (!auth) { return message.channel.send("You do not have permission to view this guide.") }
    let helpEmbed = new Discord.MessageEmbed()
        .setColor(role.hexColor)
        .setAuthor("This embed will teach you how to do your job")
        .setDescription(`As **${role.name}**, you will be able to do the following:\n${roles[args[0]].join(", ")}`)
    for (var h of roles[args[0]]) {
        helpEmbed.addField(`How to: ${h}`, guides[h] || "N/A")
    }
    if (helpEmbed.length > 6000) {
        let allFields = helpEmbed.fields
        let helpEmbed2 = new Discord.MessageEmbed()
            .setColor(role.hexColor)
        helpEmbed.fields = allFields.slice(0, allFields.length / 2)
        helpEmbed2.fields = allFields.slice(allFields.length / 2)
        await message.author.send(helpEmbed)
        await message.author.send(helpEmbed2)
    } else {
        message.author.send(helpEmbed)
    }
}
