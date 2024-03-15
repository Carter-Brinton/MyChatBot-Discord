const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch'); // Ensure you have 'node-fetch' installed
require('dotenv').config();

const ChatQuestionMatcher = require('../../utils/chatQuestionMatcher');
const predefinedChatObjects = require('../../models/predefinedChatObjects');

const matcher = new ChatQuestionMatcher(predefinedChatObjects);

// Initialize in-memory conversation history storage
const conversationHistories = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Chat with the bot')
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Chat Content')
                .setRequired(true)),
    async execute(interaction) {
        const chatContent = interaction.options.getString('content');
        const channelId = interaction.channel.id;

        // Use the matcher to find a response
        const matchedResponse = matcher.findBestMatch(chatContent);
        if (matchedResponse) {
            // Found a matched response, send it back
            const responseContent = `**Chat Content:**\n${chatContent}\n\n**Response:**\n${matchedResponse}`;
            sendReplyInChunks(interaction, responseContent);
            return;
        }

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

        await interaction.deferReply(); // Acknowledge the interaction immediately

        // Search Wikipedia for the query
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(chatContent)}&format=json`;

        try {
            const response = await fetch(searchUrl);
            const data = await response.json();
            const pageId = data.query.search[0].pageid;

            // Fetch the page content using pageId
            const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageId}&format=json`;
            const pageResponse = await fetch(pageUrl);
            const pageData = await pageResponse.json();
            const extract = pageData.query.pages[pageId].extract;

            // Extract relevant sentences
            const relevantExtract = extractRelevantSentences(extract, chatContent);

            // Format and send the reply with chunking
            const responseContent = `**Chat Content:**\n${chatContent}\n\n**Response:**\n${relevantExtract}`;
            sendReplyInChunks(interaction, responseContent);
        } catch (error) {
            console.error('Error fetching data from Wikipedia:', error);
            await interaction.editReply('Sorry, I could not retrieve information from Wikipedia.');
        }
    },
};

function extractRelevantSentences(extract, query) {
    const sentences = extract.split('. ');
    const queryKeywords = query.split(' ');
    const relevantSentences = sentences.filter(sentence =>
        queryKeywords.some(keyword => sentence.toLowerCase().includes(keyword.toLowerCase()))
    );
    return relevantSentences.join('. ').substring(0, 1000); // Limit to first 1000 characters for brevity
}

async function sendReplyInChunks(interaction, content) {
    const chunkSize = 2000; // Discord's max message length
    let isFirstChunk = true;
    for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.substring(i, Math.min(content.length, i + chunkSize));
        if (isFirstChunk) {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply(chunk); // Send initial reply if not deferred or replied.
            } else {
                await interaction.editReply(chunk);
            }
            isFirstChunk = false;
        } else {
            await interaction.followUp(chunk);
        }
    }
}

