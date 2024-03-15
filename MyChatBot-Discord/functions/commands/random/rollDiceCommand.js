const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll-dice')
        .setDescription('Rolls a specified number of dice with a specified number of sides.')
        .addIntegerOption(option =>
            option.setName('number_of_dice')
                .setDescription('Number of dice to roll')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('number_of_sides')
                .setDescription('Number of sides on each die')
                .setRequired(true)),
    async execute(interaction) {
        const numberOfDice = interaction.options.getInteger('number_of_dice');
        const numberOfSides = interaction.options.getInteger('number_of_sides');

        let result = [];
        for (let i = 0; i < numberOfDice; i++) {
            result.push(Math.floor(Math.random() * numberOfSides) + 1);
        }

        await interaction.reply(`You rolled ${numberOfDice} dice with ${numberOfSides} sides: ${result.join(', ')}`);
    },
};
