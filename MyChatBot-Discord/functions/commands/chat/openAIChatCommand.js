const { SlashCommandBuilder } = require('@discordjs/builders');
const { OpenAI } = require('openai');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Initialize the GPT-3 client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize in-memory conversation history storage
const conversationHistories = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat-gpt')
        .setDescription('Chat with the bot')
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Chat Content')
                .setRequired(true)),
    async execute(interaction) {
        const chatContent = interaction.options.getString('content');
        const channelId = interaction.channel.id;

        if (!conversationHistories[channelId]) {
            conversationHistories[channelId] = [
                {
                    role: 'system',
                    content: 'You are a helpful assistant.'
                }
            ];
        }

        // Append the new user interaction to the history
        conversationHistories[channelId].push({
            role: 'user',
            content: chatContent
        });

        // Probably don't need this, as we're using deferReply
        // await interaction.channel.sendTyping();
        // const sendTypingInterval = setInterval(() => {
        //     interaction.channel.sendTyping();
        // }, 5000);

        // Acknowledge the interaction immediately
        await interaction.deferReply();

        // Generate a response using ChatGPT
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversationHistories[channelId],
        }).catch((error) => {
            console.error('Chat Error:\n', error);
            clearInterval(sendTypingInterval);
        });

        // We don't need this, as we're using deferReply
        // clearInterval(sendTypingInterval);

        if (!response || !response.choices || response.choices.length === 0) {
            return interaction.reply('Sorry, I could not generate a response.');
        }

        // Append the bot's response to the history
        conversationHistories[channelId].push({
            role: 'assistant',
            content: response.choices[0].message.content
        });

        // Split the response into chunks and send each as a separate message if needed
        const responseContent = response.choices[0].message.content;
        const fullResponse = `**Chat Content:**\n${chatContent}\n\n**Response:**\n${responseContent}`;
        const chunkSize = 2000; // Discord's max message length
        let isFirstChunk = true;

        // Split the full response into chunks and send each as a separate message if needed
        for (let i = 0; i < fullResponse.length; i += chunkSize) {
            const chunk = fullResponse.substring(i, Math.min(fullResponse.length, i + chunkSize));
            if (isFirstChunk) {
                // Edit the original deferred reply for the first chunk
                await interaction.editReply(chunk);
                isFirstChunk = false;
            } else {
                // For subsequent chunks, use followUp
                await interaction.followUp(chunk);
            }
        }
    },
};
