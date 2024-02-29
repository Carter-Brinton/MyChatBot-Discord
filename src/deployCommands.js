const fs = require('node:fs'); // Import fs module for file system operations
const path = require('node:path'); // Import path module for handling file paths
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const {REST} = require('@discordjs/rest'); // Import REST class from discord.js/rest
const {Routes} = require('discord-api-types/v9'); // Import Routes object from discord-api-types/v9

const commands = [];
const commandsPath = path.join(__dirname, 'commands'); // Path to the 'commands' directory

// Function to recursively read command files from all directories and subdirectories
const readCommands = (dir) => {
    const files = fs.readdirSync(dir); // Read the contents of the directory synchronously

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // If the path is a directory, recursively read it
            readCommands(filePath);
        } else if (file.endsWith('.js')) {
            // If it's a JavaScript file, require it and add its data to the commands array
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
};

// Call the function to read commands from the commands directory
readCommands(commandsPath); // Start recursively reading commands from the 'commands' directory

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN); // Create a new REST instance with token

(async () => { // Asynchronous function for command deployment
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`); // Log the start of command refresh
        await rest.put( // Send a PUT request to update the application commands
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), // Specify the route for guild commands
            { body: commands }, // Provide the commands to be deployed in the request body
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
