const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
	//Permissions Check
	if (message.channel.type != 'text') {
		return message.channel.send("You cannot use this command here.")
	}
	if (!sudo) {
		let commandFile = require(`./permcheck.js`);
		let auth = await commandFile.run(client, message.member, 1000000000);
		if (!auth) {
			return message.channel.send("You do not have permission to use this command.")
		}
	}
	//Actual doing stuff
	var config = JSON.parse(fs.readFileSync('config.json'))
	if (args[0] == 'help' || args.length == 0) {
		var helpEmbed = new Discord.MessageEmbed()
			.setColor('#41f230')
			.setTitle('`setup` Usage')
			.setDescription('This is how to use `setup`')
			.addField("**Syntax:**", '`$setup [help][show][(p)refix (r)oles (c)hannels]`', true)
			.addField("**Example:**", '`setup p r c` to setup guild prefix, roles, and channels.\n`$setup p c` to setup only prefix and channels.\n`setup help` to display this message.\n`setup show` to display your current settings.', true)
			.setFooter("Must have \"Bot Owner\" permissions in the config file to use.")
		if (args.length == 0) {
			helpEmbed.setTitle('`setup` Usage \n(No Parameters Specified. Displaying help screen instead.)')
		}
		await message.channel.send(`<@${message.author.id}>`)
		return message.channel.send(helpEmbed)
	}
	var flag = {
		"p": false,
		"r": false,
		"c": false,
		"a": false,
		"error": [],
		"change": false
	}
	for (var i = 0; i < args.length; i++) {
		if (args[i].toLowerCase() == 'all') {
			flag['p'] = true
			flag['r'] = true
			flag['c'] = true
			flag['a'] = true
			i = args.length
		} else {
			if (args[i].toLowerCase().charAt(0) in flag) {
				flag[args[i].toLowerCase().charAt(0)] = true;
			} else {
				flag['error'].push(args[i])
			}
		}
	}
	if (flag.error.length > 0) {
		return message.channel.send(`One or more of your arguments (\`${flag.error.toString()}\`) are invalid. Please try again.`)
	}
	var canceledP, canceledR, canceledC;

	//Prefix setup
	if (flag["p"]) {
		var prefixEmbed = new Discord.MessageEmbed()
			.setColor("#41f230")
			.setThumbnail('https://cdn2.iconfinder.com/data/icons/web-technology-solid/100/solid_settings_gear_edit_configuration_config-512.png')
			.setTitle("Prefix Setup")
			.setDescription(`The portal to change the bot prefix.\nThe current prefix is: \`${config.prefix}\`.\nPlease enter a new prefix.\nThe prompt will end after 30 seconds or type \`cancel\` to cancel at any time.`)
		var prefixMessage = await message.channel.send(prefixEmbed)
		var filter = response => {
			return response.author.id == message.author.id && response.channel.id == message.channel.id;
		}
		await message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
			.then(async m => {
				await m.first().delete()
				m = m.map(c => c.content)[0]
				var y = m
				if (m != 'cancel' && m != config.prefix) {
					//Confirmation
					prefixEmbed.setDescription(`Are you sure that you want to set \`${m}\` as your prefix?\n(Reply with \`yes\`/\`no\` within 30 seconds)`)
					prefixMessage.edit(prefixEmbed);

					var confirmFilter = f => {
						return filter && f.content.charAt(0).toLowerCase() == 'y' || f.content.charAt(0).toLowerCase() == 'n';
					}
					await message.channel.awaitMessages(confirmFilter, { max: 1, time: 30000, errors: ['time'] })
						.then(async m => {
							await m.first().delete()
							m = m.map(c => c.content)[0];
							if (m.charAt(0).toLowerCase() == 'y') {
								config['prefix'] = y;
								prefixEmbed.setTitle("Prefix Setup Successful")
								prefixEmbed.setDescription(`The prefix setup has been completed.\n\`${config['prefix']}\` is your new prefix.`)
								prefixMessage.edit(prefixEmbed);
								fs.writeFileSync('config.json', JSON.stringify(config));
								flag.change = true
							}
							else {
								canceledP = true
								prefixEmbed.setTitle("Prefix Setup Cancelled")
								prefixEmbed.setColor("#ff1212")
								prefixEmbed.setDescription("The prefix setup has been cancelled.")
								prefixMessage.edit(prefixEmbed);
							}
						})
						.catch(c => {
							prefixEmbed.setTitle("Prefix Setup Ended")
							prefixEmbed.setColor("#ff1212")
							prefixEmbed.setDescription("The prefix setup has ended automatically.")
							prefixMessage.edit(prefixEmbed);
						})

				} else if (m == config.prefix) {
					prefixEmbed.setColor("#ff1212")
					prefixEmbed.setDescription(`\`${m}\` is already the prefix. \nThe prefix setup has ended.`)
					prefixMessage.edit(prefixEmbed);
				} else {
					prefixEmbed.setTitle("Prefix Setup Cancelled")
					prefixEmbed.setColor("#ff1212")
					prefixEmbed.setDescription("The prefix setup has been canceled.")
					prefixMessage.edit(prefixEmbed);
				}
			})
			.catch(c => {
				prefixEmbed.setTitle("Prefix Setup Ended")
				prefixEmbed.setColor("#ff1212")
				prefixEmbed.setDescription("The prefix setup has ended automatically.")
				prefixMessage.edit(prefixEmbed);
			})
	}

	//Roles
	if (flag['r']) {
		//Role Message
		var rolesEmbed = new Discord.MessageEmbed()
			.setColor("#41f230")
			.setThumbnail('https://cdn2.iconfinder.com/data/icons/web-technology-solid/100/solid_settings_gear_edit_configuration_config-512.png')
			.setTitle("Roles Setup")
			//0-7
			.addField("**Perma Suspended Role:**", `This is for people who are perma suspended`, true)
			.addField("**Temp Suspended Role:**", `This is for people who are temp suspended`, true)
			.addField("**Vet Suspended Role:**", `This is for people who are veteran suspended`, true)
			.addField("**Verified Raider Role:**", `This is the generic member`, true)
			.addField("**Veteran Raider Role:**", `This is for veteran raiders`, true)
			.addField("**Rusher Role:**", `This is for rusher role`, true)
			.addField("**Nitro Booster Role:**", `This is the nitro booster role`, true)
			.addField("**Muted Role:**", `This is for people who are not allowed to talk`, true)
			//8-17
			.addField("**Event Organizer Role:**", `This is for Event Organizers`, true)
			.addField("**Head Event Organizer Role:**", `This is for Head Event Organizers`, true)
			.addField("**Almost Raid Leader Role:**", `This is for the ARL role`, true)
			.addField("**Raid Leader Role:**", `This is for RL role`, true)
			.addField("**Veteran Raid Leader Role:**", `This is for VRL role`, true)
			.addField("**Security Role:**", `This is for Security role`, true)
			.addField("**Officer Role:**", `This is for Officer role`, true)
			.addField("**Head Raid Leader Role:**", `This is for Head Raid Leader role`, true)
			.addField("**Moderator Role:**", `This is for Moderator role`, true)
			.addField("**Admin Role:**", `This is for the Admin role`, true)
		//Editing the role message
		var counter = 0
		var nonStaff = ["Perma Suspended", "Temp Suspended", "Vet Suspended", "Verified Raider", "Veteran Raider", "Rusher", "Nitro Booster", "Muted"]
		for (var i in config.roles.general) {
			let roleId = config.roles.general[i]
			if (roleId.length > 0) {
				rolesEmbed.spliceFields(counter, 1, { name: `**${nonStaff[counter]} Role:**`, value: `<@&${roleId}>`, inline: true })
			}
			counter += 1
		}
		counter = 0
		var staff = ["Event Organizer", "Head Event Organizer", "Almost Raid Leader", "Raid Leader", "Veteran Raid Leader", "Security", "Officer", "Head Raid Leader", "Moderator", "Admin"]
		for (var i in config.roles.staff) {
			let roleId = config.roles.staff[i]
			if (roleId.length > 0) {
				rolesEmbed.spliceFields(counter + 8, 1, { name: `**${staff[counter]} Role:**`, value: `<@&${roleId}>`, inline: true })
			}
			counter += 1
		}
		counter = 0

		//Beginning roles setup
		var rolesMessage = await message.channel.send(rolesEmbed)
		//General Roles
		for (var i in config.roles.general) {
			if (canceledR != true) {
				rolesEmbed.setDescription(`Please mention your \`${nonStaff[counter]}\` role.\nIf you would like to keep the current role, respond with \`keep\`.\nIf you do not have this role, respond with \`none\`.\nYou have 2 minutes per role to respond.`)
				await rolesMessage.edit(rolesEmbed)
				var filter = response => {
					return response.author.id == message.author.id && response.channel.id == message.channel.id;
				}
				await rolesMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
					.then(async m => {
						await m.first().delete()
						m = m.map(c => c.content)[0]
						if (m.toLowerCase() != 'keep' && m.toLowerCase() != 'none' && m.toLowerCase() != 'cancel') {
							let ID = m.slice(3, -1)
							config.roles.general[i] = ID
							rolesEmbed.spliceFields(counter, 1, { name: `**${nonStaff[counter]} Role:**`, value: `<@&${config.roles.general[i]}>`, inline: true })
						} else if (m.toLowerCase() == 'none') {
							config.roles.general[i] == ""
						} else if (m.toLowerCase() == 'cancel') {
							return canceledR = true
						}
					})
					.catch(async c => {
						console.log(c)
						let errorEmbed = new Discord.MessageEmbed()
						var owner = await client.users.fetch(config.dev)
						errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
						await owner.send(errorEmbed)
					})
				counter += 1
			}
		}
		//Staff Roles
		counter = 0
		for (var i in config.roles.staff) {
			if (canceledR != true) {
				rolesEmbed.setDescription(`Please mention your \`${staff[counter]}\` role.\nIf you would like to keep the current role, respond with \`keep\`.\nIf you do not have this role, respond with \`none\`.\nYou have 2 minutes per role to respond.`)
				await rolesMessage.edit(rolesEmbed)
				var filter = response => {
					return response.author.id == message.author.id && response.channel.id == message.channel.id;
				}
				await rolesMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
					.then(async m => {
						await m.first().delete()
						m = m.map(c => c.content)[0]
						if (m.toLowerCase() != 'keep' && m.toLowerCase() != 'none' && m.toLowerCase() != 'cancel') {
							let ID = m.slice(3, -1)
							config.roles.staff[i] = ID
							rolesEmbed.spliceFields(counter + 8, 1, { name: `**${staff[counter]} Role:**`, value: `<@&${config.roles.staff[i]}>`, inline: true })
							rolesMessage.edit(rolesEmbed)
						} else if (m.toLowerCase() == 'none') {
							config.roles.general[i] == ""
						} else if (m.toLowerCase() == 'cancel') {
							return canceledR = true
						}
					})
					.catch(async c => {
						console.log(c)
						let errorEmbed = new Discord.MessageEmbed()
						var owner = await client.users.fetch(config.dev)
						errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
						await owner.send(errorEmbed)
					})
				counter += 1
			}
		}
		//Cancelled otherwise confirms
		if (canceledR == true) {
			rolesEmbed.setColor("#ff1212")
			rolesEmbed.setDescription("The roles setup has been cancelled.")
			rolesEmbed.spliceFields(0, 18)
			await rolesMessage.edit(rolesEmbed)
		} else {
			rolesEmbed.setDescription(`Please confirm the following role tiers: \n(Reply with \`yes\`/\`no\`)`)
			await rolesMessage.edit(rolesEmbed)

			var confirmFilter = f => {
				return filter && f.content.charAt(0).toLowerCase() == 'y' || f.content.charAt(0).toLowerCase() == 'n';
			}
			await message.channel.awaitMessages(confirmFilter, { max: 1, time: 30000, errors: ['time'] })
				.then(async m => {
					await m.first().delete()
					m = m.map(c => c.content)[0]
					if (m.charAt(0).toLowerCase() == 'y') {
						rolesEmbed.setTitle("Roles Setup Successful")
						rolesEmbed.setDescription(`The roles setup has completed.\nYour roles are now ranked as the following:`)
						await rolesMessage.edit(rolesEmbed)
						fs.writeFileSync('config.json', JSON.stringify(config));
						flag.change = true
					} else {
						rolesEmbed.setTitle("Roles Setup Cancelled");
						rolesEmbed.setColor("#ff1212")
						rolesEmbed.setDescription(`The roles setup has been cancelled.`)
						rolesEmbed.spliceFields(0, 18)
						await rolesMessage.edit(rolesEmbed)
					}
				})
				.catch(async c => {
					console.log(c)
					rolesEmbed.setTitle("Roles Setup Ended")
					rolesEmbed.setColor("#ff1212")
					rolesEmbed.setDescription("The roles setup has ended automatically.");
					rolesEmbed.spliceFields(0, 18)
					await rolesMessage.edit(rolesEmbed)
					var owner = await client.users.fetch(config.dev)
					await owner.send(`\`\`\`${c}\`\`\``)
				})
		}
	}

	//Channel Amount
	if (flag['a']) {
		var amountEmbed = new Discord.MessageEmbed()
			.setColor("#41f230")
			.setThumbnail('https://cdn2.iconfinder.com/data/icons/web-technology-solid/100/solid_settings_gear_edit_configuration_config-512.png')
			.setTitle("Channel Amount Setup")
			.setDescription(`The portal to change the bot prefix.\nThe current amount is: \`${config.prefix}\`.\nPlease enter a new amount.\nThe prompt will end after 30 seconds or type \`cancel\` to cancel at any time.`)
		var amountMessage = await message.channel.send(amountEmbed)
		var filter = response => {
			return response.author.id == message.author.id && response.channel.id == message.channel.id;
		}
		await message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
			.then(async m => {
				await m.first().delete()
				m = m.map(c => c.content)[0]
			})
			.catch(c => {
				amountEmbed.setTitle("Channel Amount Setup Ended")
				amountEmbed.setColor("#ff1212")
				amountEmbed.setDescription("The channel amount setup has ended automatically.")
				amountMessage.edit(amountEmbed);
			})

	}

	//Channels
	if (flag['c']) {
		var channelsFlag = {
			'v': false,
			'r': false,
			'e': false,
			'g': false,
			'error': []
		}

		//Ask which channel to setup
		var canceledC = false;
		let questionEmbed = new Discord.MessageEmbed()
			.setColor("#41f230")
			.setThumbnail('https://cdn2.iconfinder.com/data/icons/web-technology-solid/100/solid_settings_gear_edit_configuration_config-512.png')
			.setTitle("Channel Setup Options")
			.setDescription("Please select which channels you would like to setup.\nSend:\n - `g` to set up general channels\n - `v` to set up veteran channels\n - `r` to set up raiding channels\n - `e` to set up event channels\n - `all` to set up all of the above\n\nIf you would like to set up multiple, simply separate your options with spaces.\nLike so: `g v r e` to set up all of them.\nThis prompt will end in 30 seconds. You can also send `cancel` to cancel the setup")
		let questionMessage = await message.channel.send(questionEmbed)
		let optionsFilter = response => {
			return response.author.id == message.author.id
		}
		await message.channel.awaitMessages(optionsFilter, { time: 30000, max: 1, errors: ['time'] })
			.then(async m => {
				await m.first().delete()
				m = m.map(m => m.content)[0]
				if (m != "cancel") {
					let options = m.split(' ')
					for (var i = 0; i < options.length; i++) {
						if (options[i].toLowerCase() == 'all') {
							channelsFlag['g'] = true
							channelsFlag['v'] = true
							channelsFlag['r'] = true
							channelsFlag['e'] = true
							i = options.length
						} else {
							if (options[i].toLowerCase().charAt(0) in channelsFlag) {
								channelsFlag[options[i].toLowerCase().charAt(0)] = true;
							} else {
								channelsFlag['error'].push(options[i])
							}
						}
					}

				} else {
					canceledC = true
				}

			})
			.catch(async c => {
				canceledC = true
			})
		if (flag.error.length > 0) {
			message.channel.send(`One or more of your arguments (\`${channelsFlag.error.toString()}\`) are invalid. They will be ignored for the duration of this setup.`)
		}
		if (!canceledC == true) {
			//General Channels
			if (channelsFlag['g']) {
				//Channels Embed
				var channelsEmbed = new Discord.MessageEmbed()
					.setColor("#41f230")
					.setThumbnail('https://cdn2.iconfinder.com/data/icons/web-technology-solid/100/solid_settings_gear_edit_configuration_config-512.png')
					.setTitle("Channels Setup")
					//0-2
					.addField("**General Bot:**", `Command channel for public use`, true)
					.addField("**Mod Bot:**", `Command channel for mod commands`, true)
					.addField("**Admin Bot:**", `Command channel for admin commands`, true)
					//3-4
					.addField("**Command Log:**", `Channel to log AFKs (eg. dylanbot-info)`, true)
					.addField("**Suspend Log:**", `Channel to log suspensions`, true)
				//End Channels Embed

				//Begin Editing the channel embed
				var counter = 0
				var commands = ["General", "Mod", "Admin"]
				for (var i in config.channels.command) {
					let channelId = config.channels.command[i]
					if (channelId.length > 0) {
						channelsEmbed.spliceFields(counter, 1, { name: `**${commands[counter]} Bot:**`, value: `<#${channelId}>`, inline: true })
					}
					counter += 1
				}
				counter = 0
				var log = ["Command", "Suspend"]
				for (var i in config.channels.log) {
					let channelId = config.channels.log[i]
					if (channelId.length > 0) {
						channelsEmbed.spliceFields(counter + 3, 1, { name: `**${log[counter]} Log:**`, value: `<#${channelId}>`, inline: true })
					}
					counter += 1
				}
				var channelsMessage = await message.channel.send(channelsEmbed)
				//End Editing the channel embed

				//Begin Setup
				//General Channels
				counter = 0
				for (var i in config.channels.command) {
					if (canceledC != true) {
						channelsEmbed.setDescription(`Please mention your \`${commands[counter]} Bot\` channel.\nRemember, mentioning channels uses a \`#\` instead of a \`@\`.\nIf you would like to keep the current channel, respond with \`keep\`.\nIf you do not have this channel, respond with \`none\`.\nYou have 2 minutes per channel to respond.`)
						await channelsMessage.edit(channelsEmbed)
						var filter = response => {
							return response.author.id == message.author.id && response.channel.id == message.channel.id;
						}
						await channelsMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
							.then(async m => {
								await m.first().delete()
								content = m.map(m => m.content)[0]
								if (content.toLowerCase() != 'keep' && content.toLowerCase() != 'none' && content.toLowerCase() != 'cancel') {
									let ID = content.slice(2, -1)
									config.channels.command[i] = ID
									channelsEmbed.spliceFields(counter, 1, { name: `**${commands[counter]} Bot:**`, value: `<#${config.channels.command[i]}>`, inline: true })
									await channelsMessage.edit(channelsEmbed)
								} else if (content.toLowerCase() == 'none') {
									config.channels.command[i] = ""
								} else if (content.toLowerCase() == 'cancel') {
									await channelsMessage.delete()
									return canceledC = true
								}
							})
							.catch(async c => {
								console.log(c)
								let errorEmbed = new Discord.MessageEmbed()
								var owner = await client.users.fetch(config.dev)
								errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
								await owner.send(errorEmbed)
							})
						counter += 1
					}
				}
				//Log Channels
				counter = 0
				for (var i in config.channels.log) {
					if (canceledC != true) {
						channelsEmbed.setDescription(`Please mention your \`${log[counter]} Log\` channel.\nRemember, mentioning channels uses a \`#\` instead of a \`@\`.\nIf you would like to keep the current channel, respond with \`keep\`.\nIf you do not have this channel, respond with \`none\`.\nYou have 2 minutes per channel to respond.`)
						await channelsMessage.edit(channelsEmbed)
						var filter = response => {
							return response.author.id == message.author.id && response.channel.id == message.channel.id;
						}
						await channelsMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
							.then(async m => {
								await m.first().delete()
								content = m.map(m => m.content)[0]
								if (content.toLowerCase() != 'keep' && content.toLowerCase() != 'none' && content.toLowerCase() != 'cancel') {
									let ID = content.slice(2, -1)
									config.channels.log[i] = ID
									channelsEmbed.spliceFields(counter + 3, 1, { name: `**${log[counter]} Bot:**`, value: `<#${config.channels.log[i]}>`, inline: true })
									await channelsMessage.edit(channelsEmbed)
								} else if (content.toLowerCase() == 'none') {
									config.channels.log[i] = ""
								} else if (content.toLowerCase() == 'cancel') {
									await channelsMessage.delete()
									return canceledC = true
								}
							})
							.catch(async c => {
								console.log(c)
								let errorEmbed = new Discord.MessageEmbed()
								var owner = await client.users.fetch(config.dev)
								errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
								await owner.send(errorEmbed)
							})
						counter += 1
					}
				}
				//Confirm General Channels
				if (canceledC != true) {
					channelsEmbed.setDescription(`Please confirm the following channels.\n(Reply with \`yes\`/\`no\`)`)
					await channelsMessage.edit(channelsEmbed)
					var confirmFilter = f => {
						return filter && f.content.charAt(0).toLowerCase() == 'y' || f.content.charAt(0).toLowerCase() == 'n';
					}
					await message.channel.awaitMessages(confirmFilter, { max: 1, time: 30000, errors: ['time'] })
						.then(async m => {
							await m.first().delete()
							m = m.map(c => c.content)[0]
							if (m.charAt(0).toLowerCase() == 'y') {
								channelsEmbed.setTitle("General Channels Setup Successful")
								channelsEmbed.setDescription(`The general channels setup has completed.\nYour general channels are now the following:`)
								await channelsMessage.edit(channelsEmbed)
								fs.writeFileSync('config.json', JSON.stringify(config));
								flag.change = true
							} else {
								channelsEmbed.setTitle("General Channels Setup Cancelled");
								channelsEmbed.setColor("#ff1212")
								channelsEmbed.setDescription(`The general channels setup has been cancelled.`)
								channelsEmbed.spliceFields(0, 18)
								await channelsMessage.edit(channelsEmbed)
							}
						})
						.catch(async c => {
							console.log(c)
							channelsEmbed.setTitle("General Channels Setup Ended")
							channelsEmbed.setColor("#ff1212")
							channelsEmbed.setDescription("The general channels setup has ended automatically.");
							channelsEmbed.spliceFields(0, 18)
							await channelsMessage.edit(channelsEmbed)
							var owner = await client.users.fetch(config.dev)
							await owner.send(`\`\`\`${c}\`\`\``)
						})
				}
			}
			//End General Channels
		}

		if (!canceledC == true) {
			//Veteran Channels
			if (channelsFlag['v']) {
				var vetEmbed = new Discord.MessageEmbed()
					.setColor("#41f230")
					.setThumbnail('https://cdn2.iconfinder.com/data/icons/web-technology-solid/100/solid_settings_gear_edit_configuration_config-512.png')
					.setTitle("Veteran Channels Setup")
					.addField("**Veteran Control Channels:**", `These channels control veteran runs`)
					//1-4
					.addField("**Veteran Bot:**", `Command channel for veteran AFKs`, true)
					.addField("**Veteran Status:**", `For posting veteran AFKs`, true)
					.addField("**Veteran Lounge:**", "This is the channel for AFK veterans", true)
					.addField("**Veteran Raiding Channels:**", "These are the voice channels for veteran runs")

				//Begin Editing the veteran embed
				var counter = 0
				var control = ["Bot", "Status", "Lounge"]
				for (var i in config.channels.veteran.control) {
					let channelId = config.channels.veteran.control[i]
					if (channelId.length > 0) {
						vetEmbed.spliceFields(counter + 1, 1, { name: `**Veteran ${control[counter]}:**`, value: `<#${channelId}>`, inline: true })
					}
					counter += 1
				}
				counter = 0
				var channelNumber = Object.keys(config.channels.veteran.raiding)
				for (var i in config.channels.veteran.raiding) {
					let channelId = config.channels.veteran.raiding[i]
					if (channelId.length > 0) {
						vetEmbed.spliceFields(counter + 5, 1, { name: `**Veteran Raiding ${channelNumber[counter]}:**`, value: `<#${channelId}>`, inline: true })
					} else {
						vetEmbed.spliceFields(counter + 5, 1, { name: `**Veteran Raiding ${channelNumber[counter]}:**`, value: `None`, inline: true })
					}
					counter += 1
				}
				//End Editing the veteran embed
				var veteranMessage = await message.channel.send(vetEmbed)

				//Begin setup
				//Begin control channels
				counter = 0
				for (var i in config.channels.veteran.control) {
					if (canceledC != true) {
						vetEmbed.setDescription(`Please mention your \`Veteran ${control[counter]}\` channel.\nRemember, mentioning channels uses a \`#\` instead of a \`@\`.\nFor voice channels, you will have to manually insert the channel ID into the following template: \`<#ID>\`\nIf you would like to keep the current channel, respond with \`keep\`.\nIf you do not have this channel, respond with \`none\`.\nYou have 2 minutes per channel to respond.`)
						await veteranMessage.edit(vetEmbed)
						var filter = response => {
							return response.author.id == message.author.id && response.channel.id == message.channel.id;
						}
						await veteranMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
							.then(async m => {
								await m.first().delete()
								content = m.map(m => m.content)[0]
								if (content.toLowerCase() != 'keep' && content.toLowerCase() != 'none' && content.toLowerCase() != 'cancel') {
									let ID = content.slice(2, -1)
									config.channels.veteran.control[i] = ID
									vetEmbed.spliceFields(counter + 1, 1, { name: `**Veteran ${control[counter]} :**`, value: `<#${config.channels.veteran.control[i]}>`, inline: true })
									await veteranMessage.edit(vetEmbed)
								} else if (content.toLowerCase() == 'none') {
									config.channels.veteran.control[i] = ""
								} else if (content.toLowerCase() == 'cancel') {
									await veteranMessage.delete()
									return canceledC = true
								}
							})
							.catch(async c => {
								console.log(c)
								let errorEmbed = new Discord.MessageEmbed()
								var owner = await client.users.fetch(config.dev)
								errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
								await owner.send(errorEmbed)
							})
						counter += 1
					}
				}
				//End control channels

				//Begin raiding channels
				counter = 0
				for (var i in config.channels.veteran.raiding) {
					if (canceledC != true) {
						vetEmbed.setDescription(`Please mention your \`Veteran Raiding ${channelNumber[counter]}\` channel.\nRemember, mentioning channels uses a \`#\` instead of a \`@\`.\nFor voice channels, you will have to manually insert the channel ID into the following template: \`<#ID>\`\nIf you would like to keep the current channel, respond with \`keep\`.\nIf you do not have this channel, respond with \`none\`.\nYou have 2 minutes per channel to respond.`)
						await veteranMessage.edit(vetEmbed)
						var filter = response => {
							return response.author.id == message.author.id && response.channel.id == message.channel.id;
						}
						await veteranMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
							.then(async m => {
								await m.first().delete()
								content = m.map(m => m.content)[0]
								if (content.toLowerCase() != 'keep' && content.toLowerCase() != 'none' && content.toLowerCase() != 'cancel') {
									let ID = content.slice(2, -1)
									config.channels.veteran.raiding[i] = ID
									vetEmbed.spliceFields(counter + 5, 1, { name: `**Veteran Raiding ${channelNumber[counter]} :**`, value: `<#${config.channels.veteran.raiding[i]}>`, inline: true })
									await veteranMessage.edit(vetEmbed)
								} else if (content.toLowerCase() == 'none') {
									config.channels.veteran.raiding[i] = ""
								} else if (content.toLowerCase() == 'cancel') {
									await veteranMessage.delete()
									return canceledC = true
								}
							})
							.catch(async c => {
								console.log(c)
								await veteranMessage.delete()
								let errorEmbed = new Discord.MessageEmbed()
								var owner = await client.users.fetch(config.dev)
								errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
								await owner.send(errorEmbed)
							})
						counter += 1
					}
				}
				//End raiding channels

				//Begin confirmation
				if (canceledC != true) {
					vetEmbed.setDescription(`Please confirm the following channels.\n(Reply with \`yes\`/\`no\`)`)
					await veteranMessage.edit(vetEmbed)
					var confirmFilter = f => {
						return filter && f.content.charAt(0).toLowerCase() == 'y' || f.content.charAt(0).toLowerCase() == 'n';
					}
					await message.channel.awaitMessages(confirmFilter, { max: 1, time: 30000, errors: ['time'] })
						.then(async m => {
							await m.first().delete()
							m = m.map(c => c.content)[0]
							if (m.charAt(0).toLowerCase() == 'y') {
								vetEmbed.setTitle("Veteran Channels Setup Successful")
								vetEmbed.setDescription(`The veteran channels setup has completed.\nYour veteran channels are now the following:`)
								await veteranMessage.edit(vetEmbed)
								fs.writeFileSync('config.json', JSON.stringify(config));
								flag.change = true
							} else {
								vetEmbed.setTitle("Veteran Channels Setup Cancelled");
								vetEmbed.setColor("#ff1212")
								vetEmbed.setDescription(`The veteran channels setup has been cancelled.`)
								vetEmbed.spliceFields(0, 18)
								await veteranMessage.edit(vetEmbed)
							}
						})
						.catch(async c => {
							console.log(c)
							await veteranMessage.delete()
							vetEmbed.setTitle("Veteran Channels Setup Ended")
							vetEmbed.setColor("#ff1212")
							vetEmbed.setDescription("The veteran channels setup has ended automatically.");
							vetEmbed.spliceFields(0, 18)
							await veteranMessage.edit(vetEmbed)
							var owner = await client.users.fetch(config.dev)
							await owner.send(`\`\`\`${c}\`\`\``)
						})
				}
				//End confirmation
			}
		}
		if (!canceledC == true) {
			//Raiding Channels
			if (channelsFlag['r']) {
				var raidingEmbed = new Discord.MessageEmbed()
					.setColor("#41f230")
					.setThumbnail('https://cdn2.iconfinder.com/data/icons/web-technology-solid/100/solid_settings_gear_edit_configuration_config-512.png')
					.setTitle("Raiding Channels Setup")
					.addField("**Raid Control Channels:**", `These channels control regular runs`)
					//1-4
					.addField("**Raid Bot:**", `Command channel for normal AFKs and staff stuff`, true)
					.addField("**Raid Status:**", `For posting normal AFKS`, true)
					.addField("**Raid Lounge:**", `This is the channel for AFK people`, true)
					.addField("**Normal Raiding Channels:**", "These are the voice channels for normal runs")
				//Begin Editing the raiding embed
				var counter = 0
				var control = ["Bot", "Status", "Lounge"]
				for (var i in config.channels.normal.control) {
					let channelId = config.channels.normal.control[i]
					if (channelId.length > 0) {
						raidingEmbed.spliceFields(counter + 1, 1, { name: `**Raid ${control[counter]}:**`, value: `<#${channelId}>`, inline: true })
					}
					counter += 1
				}
				counter = 0
				var channelNumber = Object.keys(config.channels.normal.raiding)
				for (var i in config.channels.normal.raiding) {
					let channelId = config.channels.normal.raiding[i]
					if (channelId.length > 0) {
						raidingEmbed.spliceFields(counter + 5, 1, { name: `**Raiding ${channelNumber[counter]}:**`, value: `<#${channelId}>`, inline: true })
					} else {
						raidingEmbed.spliceFields(counter + 5, 1, { name: `**Raiding ${channelNumber[counter]}:**`, value: `None`, inline: true })
					}
					counter += 1
				}
				//End Editing the raiding embed
				var raidingMessage = await message.channel.send(raidingEmbed)

				//Begin setup
				//Begin control channels
				counter = 0
				for (var i in config.channels.normal.control) {
					if (canceledC != true) {
						raidingEmbed.setDescription(`Please mention your \`Raid ${control[counter]}\` channel.\nRemember, mentioning channels uses a \`#\` instead of a \`@\`.\nFor voice channels, you will have to manually insert the channel ID into the following template: \`<#ID>\`\nIf you would like to keep the current channel, respond with \`keep\`.\nIf you do not have this channel, respond with \`none\`.\nYou have 2 minutes per channel to respond.`)
						await raidingMessage.edit(raidingEmbed)
						var filter = response => {
							return response.author.id == message.author.id && response.channel.id == message.channel.id;
						}
						await raidingMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
							.then(async m => {
								await m.first().delete()
								content = m.map(m => m.content)[0]
								if (content.toLowerCase() != 'keep' && content.toLowerCase() != 'none' && content.toLowerCase() != 'cancel') {
									let ID = content.slice(2, -1)
									config.channels.normal.control[i] = ID
									raidingEmbed.spliceFields(counter + 1, 1, { name: `**Raid ${control[counter]} :**`, value: `<#${config.channels.normal.control[i]}>`, inline: true })
									await raidingMessage.edit(raidingEmbed)
								} else if (content.toLowerCase() == 'none') {
									config.channels.normal.control[i] = ""
								} else if (content.toLowerCase() == 'cancel') {
									await raidingMessage.delete()
									return canceledC = true
								}
							})
							.catch(async c => {
								console.log(c)
								await raidingMessage.delete()
								let errorEmbed = new Discord.MessageEmbed()
								var owner = await client.users.fetch(config.dev)
								errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
								await owner.send(errorEmbed)
							})
						counter += 1
					}
				}
				//End control channels

				//Begin raiding channels
				counter = 0
				for (var i in config.channels.normal.raiding) {
					if (canceledC != true) {
						raidingEmbed.setDescription(`Please mention your \`Raiding ${channelNumber[counter]}\` channel.\nRemember, mentioning channels uses a \`#\` instead of a \`@\`.\nFor voice channels, you will have to manually insert the channel ID into the following template: \`<#ID>\`\nIf you would like to keep the current channel, respond with \`keep\`.\nIf you do not have this channel, respond with \`none\`.\nYou have 2 minutes per channel to respond.`)
						await raidingMessage.edit(raidingEmbed)
						var filter = response => {
							return response.author.id == message.author.id && response.channel.id == message.channel.id;
						}
						await raidingMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
							.then(async m => {
								await m.first().delete()
								content = m.map(m => m.content)[0]
								if (content.toLowerCase() != 'keep' && content.toLowerCase() != 'none' && content.toLowerCase() != 'cancel') {
									let ID = content.slice(2, -1)
									config.channels.normal.raiding[i] = ID
									raidingEmbed.spliceFields(counter + 5, 1, { name: `**Raiding ${channelNumber[counter]} :**`, value: `<#${config.channels.normal.raiding[i]}>`, inline: true })
									await raidingMessage.edit(raidingEmbed)
								} else if (content.toLowerCase() == 'none') {
									config.channels.normal.raiding[i] = ""
								} else if (content.toLowerCase() == 'cancel') {
									await raidingMessage.delete()
									return canceledC = true
								}
							})
							.catch(async c => {
								console.log(c)
								await raidingMessage.delete()
								let errorEmbed = new Discord.MessageEmbed()
								var owner = await client.users.fetch(config.dev)
								errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
								await owner.send(errorEmbed)
							})
						counter += 1
					}
				}
				//End raiding channels

				//Begin confirmation
				if (canceledC != true) {
					raidingEmbed.setDescription(`Please confirm the following channels.\n(Reply with \`yes\`/\`no\`)`)
					await raidingMessage.edit(raidingEmbed)
					var confirmFilter = f => {
						return filter && f.content.charAt(0).toLowerCase() == 'y' || f.content.charAt(0).toLowerCase() == 'n';
					}
					await message.channel.awaitMessages(confirmFilter, { max: 1, time: 30000, errors: ['time'] })
						.then(async m => {
							await m.first().delete()
							m = m.map(c => c.content)[0]
							if (m.charAt(0).toLowerCase() == 'y') {
								raidingEmbed.setTitle("Raiding Channels Setup Successful")
								raidingEmbed.setDescription(`The raiding channels setup has completed.\nYour raiding channels are now the following:`)
								await raidingMessage.edit(raidingEmbed)
								fs.writeFileSync('config.json', JSON.stringify(config));
								flag.change = true
							} else {
								raidingEmbed.setTitle("Raiding Channels Setup Cancelled");
								raidingEmbed.setColor("#ff1212")
								raidingEmbed.setDescription(`The raiding channels setup has been cancelled.`)
								raidingEmbed.spliceFields(0, 18)
								await raidingMessage.edit(raidingEmbed)
							}
						})
						.catch(async c => {
							console.log(c)
							await raidingMessage.delete()
							raidingEmbed.setTitle("Raiding Channels Setup Ended")
							raidingEmbed.setColor("#ff1212")
							raidingEmbed.setDescription("The raiding channels setup has ended automatically.");
							raidingEmbed.spliceFields(0, 18)
							await raidingMessage.edit(raidingEmbed)
							var owner = await client.users.fetch(config.dev)
							await owner.send(`\`\`\`${c}\`\`\``)
						})
				}
				//End confirmation
			}

			//Event Channels
			if (channelsFlag['e']) {
				var eventEmbed = new Discord.MessageEmbed()
					.setColor("#41f230")
					.setThumbnail('https://cdn2.iconfinder.com/data/icons/web-technology-solid/100/solid_settings_gear_edit_configuration_config-512.png')
					.setTitle("Event Channels Setup")
					.addField("**Veteran Control Channels:**", `These channels control veteran runs`)
					//1-4
					.addField("**Event Bot:**", `Command channel for event AFKs`, true)
					.addField("**Event Status:**", `For posting event AFKs`, true)
					.addField("**Event Lounge:**", "This is the channel for AFK event people", true)
					.addField("**Event Raiding Channels:**", "These are the voice channels for event runs")
				//Begin Editing the event embed
				var counter = 0
				var control = ["Bot", "Status", "Lounge"]
				for (var i in config.channels.event.control) {
					let channelId = config.channels.event.control[i]
					if (channelId.length > 0) {
						eventEmbed.spliceFields(counter + 1, 1, { name: `**Event ${control[counter]}:**`, value: `<#${channelId}>`, inline: true })
					}
					counter += 1
				}
				counter = 0
				var channelNumber = Object.keys(config.channels.event.raiding)
				for (var i in config.channels.event.raiding) {
					let channelId = config.channels.event.raiding[i]
					if (channelId.length > 0) {
						eventEmbed.spliceFields(counter + 5, 1, { name: `**Event Raiding ${channelNumber[counter]}:**`, value: `<#${channelId}>`, inline: true })
					} else {
						eventEmbed.spliceFields(counter + 5, 1, { name: `**Event Raiding ${channelNumber[counter]}:**`, value: `None`, inline: true })
					}
					counter += 1
				}
				//End Editing the event embed
				var eventMessage = await message.channel.send(eventEmbed)

				//Begin setup
				//Begin control channels
				counter = 0
				for (var i in config.channels.event.control) {
					if (canceledC != true) {
						eventEmbed.setDescription(`Please mention your \`Event ${control[counter]}\` channel.\nRemember, mentioning channels uses a \`#\` instead of a \`@\`.\nFor voice channels, you will have to manually insert the channel ID into the following template: \`<#ID>\`\nIf you would like to keep the current channel, respond with \`keep\`.\nIf you do not have this channel, respond with \`none\`.\nYou have 2 minutes per channel to respond.`)
						await eventMessage.edit(eventEmbed)
						var filter = response => {
							return response.author.id == message.author.id && response.channel.id == message.channel.id;
						}
						await eventMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
							.then(async m => {
								await m.first().delete()
								content = m.map(m => m.content)[0]
								if (content.toLowerCase() != 'keep' && content.toLowerCase() != 'none' && content.toLowerCase() != 'cancel') {
									let ID = content.slice(2, -1)
									config.channels.event.control[i] = ID
									eventEmbed.spliceFields(counter + 1, 1, { name: `**Event ${control[counter]} :**`, value: `<#${config.channels.event.control[i]}>`, inline: true })
									await eventMessage.edit(eventEmbed)
								} else if (content.toLowerCase() == 'none') {
									config.channels.event.control[i] = ""
								} else if (content.toLowerCase() == 'cancel') {
									await eventMessage.delete()
									return canceledC = true
								}
							})
							.catch(async c => {
								console.log(c)
								await eventMessage.delete()
								let errorEmbed = new Discord.MessageEmbed()
								var owner = await client.users.fetch(config.dev)
								errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
								await owner.send(errorEmbed)
							})
						counter += 1
					}
				}
				//End control channels

				//Begin raiding channels
				counter = 0
				for (var i in config.channels.event.raiding) {
					if (canceledC != true) {
						eventEmbed.setDescription(`Please mention your \`Event Raiding ${channelNumber[counter]}\` channel.\nRemember, mentioning channels uses a \`#\` instead of a \`@\`.\nFor voice channels, you will have to manually insert the channel ID into the following template: \`<#ID>\`\nIf you would like to keep the current channel, respond with \`keep\`.\nIf you do not have this channel, respond with \`none\`.\nYou have 2 minutes per channel to respond.`)
						await eventMessage.edit(eventEmbed)
						var filter = response => {
							return response.author.id == message.author.id && response.channel.id == message.channel.id;
						}
						await eventMessage.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
							.then(async m => {
								await m.first().delete()
								content = m.map(m => m.content)[0]
								if (content.toLowerCase() != 'keep' && content.toLowerCase() != 'none' && content.toLowerCase() != 'cancel') {
									let ID = content.slice(2, -1)
									config.channels.event.raiding[i] = ID
									eventEmbed.spliceFields(counter + 5, 1, { name: `**Event Raiding ${channelNumber[counter]} :**`, value: `<#${config.channels.event.raiding[i]}>`, inline: true })
									await eventMessage.edit(eventEmbed)
								} else if (content.toLowerCase() == 'none') {
									config.channels.event.raiding[i] = ""
								} else if (content.toLowerCase() == 'cancel') {
									await eventMessage.delete()
									return canceledC = true
								}
							})
							.catch(async c => {
								console.log(c)
								await eventMessage.delete()
								let errorEmbed = new Discord.MessageEmbed()
								var owner = await client.users.fetch(config.dev)
								errorEmbed.setDescription(`Error Processing: \`setup\`\nError Message:\`\`\`${c.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
								await owner.send(errorEmbed)
							})
						counter += 1
					}
				}
				//End raiding channels

				//Begin confirmation
				if (canceledC != true) {
					eventEmbed.setDescription(`Please confirm the following channels.\n(Reply with \`yes\`/\`no\`)`)
					await eventMessage.edit(eventEmbed)
					var confirmFilter = f => {
						return filter && f.content.charAt(0).toLowerCase() == 'y' || f.content.charAt(0).toLowerCase() == 'n';
					}
					await message.channel.awaitMessages(confirmFilter, { max: 1, time: 30000, errors: ['time'] })
						.then(async m => {
							await m.first().delete()
							m = m.map(c => c.content)[0]
							if (m.charAt(0).toLowerCase() == 'y') {
								eventEmbed.setTitle("Event Channels Setup Successful")
								eventEmbed.setDescription(`The event channels setup has completed.\nYour event raiding channels are now the following:`)
								await eventMessage.edit(eventEmbed)
								fs.writeFileSync('config.json', JSON.stringify(config));
								flag.change = true
							} else {
								eventEmbed.setTitle("Event Channels Setup Cancelled");
								eventEmbed.setColor("#ff1212")
								eventEmbed.setDescription(`The event channels setup has been cancelled.`)
								eventEmbed.spliceFields(0, 18)
								await eventMessage.edit(eventEmbed)
							}
						})
						.catch(async c => {
							console.log(c)
							eventEmbed.setTitle("Event Channels Setup Ended")
							eventEmbed.setColor("#ff1212")
							eventEmbed.setDescription("The event channels setup has ended automatically.");
							eventEmbed.spliceFields(0, 18)
							await eventMessage.edit(eventEmbed)
							var owner = await client.users.fetch(config.dev)
							await owner.send(`\`\`\`${c}\`\`\``)
						})
				}
				//End confirmation
			}

		}
		if (canceledC == true) {
			questionEmbed.setTitle("Channels Setup Cancelled");
			questionEmbed.setColor("#ff1212")
			questionEmbed.setDescription(`The channels setup has been cancelled.`)
			await questionMessage.edit(questionEmbed)
		}
	}
	if (flag.change == true) {
		let commandFile = require(`./restart.js`);
		await commandFile.run(client, message, args, Discord);
	}
}