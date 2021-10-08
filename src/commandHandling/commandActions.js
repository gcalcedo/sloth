import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { prefix } = require('../../config.json')

import { executeCommand } from './commandCenter.js'

export const parse = (msg) => {
    let slicedMsg = msg.content.replace(/ +/g, ' ').split(' ')
    let prefix = slicedMsg[0].charAt(0)
    let type = slicedMsg[0].substring(1)
    let [, ...args] = slicedMsg

    const commandContract = {
        prefix: prefix,
        type: type,
        args: args,
        rawMsg: msg,
        author: msg.member,
        channel: msg.channel,
        guild: msg.guild,
    }

    return commandContract
}

export const validate = (command) => {
    if (command.prefix !== prefix) {
        return false
    }

    return true
}

export const execute = (command, client) => {
    executeCommand(command, client)
}
