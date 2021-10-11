export const executeCommand = async (command, client) => {
    let zenRadio = client.zenStation.retrieve(command.guild.id, command.channel)

    switch (command.type.toLowerCase()) {
        case 'refresh':
            command.rawMsg.delete()
            await zenRadio.refresh(command.channel)
            break
        case 'play':
        case 'p':
            command.rawMsg.delete()
            await zenRadio.addTrack(command.author, command.args)
            break
        default:
            command.channel.send(
                `${command.author}, that command was not found :sob:`
            )
            break
    }
}
