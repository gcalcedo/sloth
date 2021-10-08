import { parse, validate, execute } from './commandActions.js'

export class CommandPipe {
    client

    constructor(client) {
        this.client = client
    }

    flush = async (msg) => {
        let command = parse(msg)

        if (!validate(command)) return

        execute(command, this.client)
    }
}
