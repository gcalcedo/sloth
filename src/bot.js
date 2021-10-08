import Discord from 'discord.js'
const intents = new Discord.Intents(32767)

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { token } = require('../config.json')

import { CommandPipe } from './commandHandling/commandPipe.js'
import { SlothStation } from './zenRadio/slothStation.js'

export const client = new Discord.Client({ intents })
client.zenStation = new SlothStation(client)
client.login(token)

const commandPipe = new CommandPipe(client)
client.on('messageCreate', commandPipe.flush)
