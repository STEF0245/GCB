const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const client = new Client({ intents: 3276799 });

let globalChatChannelId;
let blacklist = [];

const config = require('./config.json');

client.on('messageCreate', (message) => {
    if (message.content.startsWith('!setglobalchat')) {
        if (message.member.permissions.has('ADMINISTRATOR')) {
            const args = message.content.split(' ');
            const channel = message.mentions.channels.first();

            if (channel) {
                globalChatChannelId = channel.id;

                // Update the global chat channel ID for the server
                config.globalChatChannels[message.guild.id] = globalChatChannelId;
                fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

                message.channel.send(`Global chat channel set to ${channel}`);
            } else {
                message.channel.send('Please mention a valid channel.');
            }
        } else {
            message.channel.send('You need to have the administrator permission to use this command.');
        }
    }

    if (message.content.startsWith('!blacklist')) {
        if (message.member.id === '786883042353479732') {
            let userId;
            const args = message.content.split(' ');

            if (message.mentions.users.size > 0) {
                userId = message.mentions.users.first().id;
            } else {
                userId = args[1];
            }

            if (userId) {
                if (!blacklist.includes(userId)) {
                    blacklist.push(userId);

                    // Update the blacklist in the config file
                    config.blacklist.push(userId);
                    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

                    message.channel.send(`<@${userId}> has been added to the blacklist.`);
                } else {
                    message.channel.send(`<@${userId}> is already in the blacklist.`);
                }
            } else {
                message.channel.send('Please mention a valid user or provide a valid user ID.');
            }
        } else {
            message.channel.send('You need to have the administrator permission to use this command.');
        }
    }

    if (message.content.startsWith('!whitelist')) {
        if (message.member.id === '786883042353479732') {
            let userId;
            const args = message.content.split(' ');

            if (message.mentions.users.size > 0) {
                userId = message.mentions.users.first().id;
            } else {
                userId = args[1];
            }

            if (userId) {
                const index = config.blacklist.indexOf(userId);
                if (index !== -1) {
                    config.blacklist.splice(index, 1);
                    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
                    message.channel.send(`<@${userId}> has been removed from the blacklist.`);
                } else {
                    message.channel.send('User is not in the blacklist.');
                }
            } else {
                message.channel.send('Please mention a valid user or provide a valid user ID.');
            }
        } else {
            message.channel.send('You need to have the administrator permission to use this command.');
        }
    }
});

client.on('messageCreate', (message) => {
    globalChatChannelId = config.globalChatChannels[message.guild.id];

    if (message.channel.id === globalChatChannelId && !message.author.bot && !blacklist.includes(message.author.id) && !message.content.startsWith("!whitelist") && !message.content.startsWith("!blacklist") && !message.content.startsWith("!setglobalchat")) {

        const replyMessageId = message.reference?.messageId;

        // Create an embed to send to other servers
        const embed = new EmbedBuilder()
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL({ dynamic: true, format: 'png' }),
                url: `https://discord.com/users/${message.author.id}`,
            })
            .setDescription(message.content || 'No content provided')
            .setColor('#4287f5')
            .setTimestamp()
            .setFooter({ text: `User ID: ${message.author.id}` });

        if (replyMessageId) {
            const repliedMessage = message.channel.messages.cache.get(replyMessageId);
            if (repliedMessage) {
                const repliedEmbed = repliedMessage.embeds[0];
                if (repliedEmbed) {

                    embed.addFields({
                        name: '\n\n*Replying to:*',
                        value: `*${repliedEmbed.author?.name || ''}: ${repliedEmbed.description || ''}*`
                    });
                }
            }
        }


        const invite = new ButtonBuilder()
            .setLabel('Invite me')
            .setStyle(ButtonStyle.Link)
            .setURL(
                'https://discord.com/api/oauth2/authorize?client_id=1100155800393093242&permissions=1099511627775&scope=bot%20applications.commands'
            );

        const server = new ButtonBuilder()
            .setLabel('Sent from: ' + message.guild.name)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
            .setCustomId('server');

        const actionRow = new ActionRowBuilder().addComponents(invite, server);

        // Send the embed with buttons to all other servers' global chat channels
        client.guilds.cache.forEach((guild) => {
            const serverId = guild.id;
            const channel = guild.channels.cache.get(config.globalChatChannels[serverId]);
            if (channel && channel.isTextBased() && channel.id !== globalChatChannelId) {
                channel.send({ embeds: [embed], components: [actionRow] });
            }
        });
    }
});

client.on('error', console.error);

client.login(process.env.TOKEN);