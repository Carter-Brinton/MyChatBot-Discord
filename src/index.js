const fs = require('node:fs'); // Import fs module for file system operations
const path = require('node:path'); // Import path module for handling file paths
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const keepAlive = require('./server.js')
const {Client, Collection, GatewayIntentBits} = require('discord.js'); // Import discord.js properties

const client = new Client({intents: [GatewayIntentBits.Guilds]});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Function to recursively read command files from all directories and subdirectories
const readCommands = (dir) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // If the path is a directory, recursively read it
            readCommands(filePath);
        } else if (file.endsWith('.js')) {
            // If the file is a JavaScript file, load the command
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`Command loaded: ${command.data.name}`);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
}

// Start the recursive command loading
readCommands(commandsPath);


// Loaded events required for starting and listening to commands
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(process.env.TOKEN); //signs the bot in with token
keepAlive();
