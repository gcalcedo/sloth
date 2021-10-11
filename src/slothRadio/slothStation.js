import { SlothRadio } from './slothRadio.js'

export class SlothStation {
    client
    channels

    constructor(client) {
        this.client = client
        this.channels = new Map()

        client.on('messageReactionAdd', async (reaction, user) => {
            if (user.bot) return
            let zenRadio = this.retrieve(reaction.message.guildId)

            switch (reaction._emoji.name) {
                case '⏮️':
                    await zenRadio.previousTrack()
                    break
                case '⏯️':
                    await zenRadio.togglePause()
                    break
                case '⏭️':
                    await zenRadio.nextTrack()
                    break
                case '🔀':
                    await zenRadio.shuffle()
                    break
                case '📜':
                    await zenRadio.togglePlaylist()
                    break
                case '📥':
                    await zenRadio.pack()
                    break
                case '❌':
                    await zenRadio.clear()
                    break
            }

            await zenRadio.update()

            const userReactions = reaction.message.reactions.cache.filter(
                (reaction) => reaction.users.cache.has(user.id)
            )

            for (const reaction of userReactions.values()) {
                await reaction.users.remove(user.id)
            }
        })
    }

    retrieve = (guildID, channel) => {
        if (!this.exists(guildID)) {
            this.channels.set(guildID, new SlothRadio(this.client, channel))
        }

        return this.channels.get(guildID)
    }

    exists = (guildID) => {
        return this.channels.has(guildID)
    }
}
