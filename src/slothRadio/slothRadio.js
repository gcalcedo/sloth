import Discord from 'discord.js'
import { createAudioPlayer, createAudioResource } from '@discordjs/voice'
import { AudioPlayerStatus, VoiceConnectionStatus } from '@discordjs/voice'
import { joinVoiceChannel, entersState } from '@discordjs/voice'

import youtubedls from 'youtube-dl-exec'
import { buildYoutubeResource, formatSecToMinutes } from '../resources/utils.js'
import fetch from 'node-fetch'

import { getAverageColor } from 'fast-average-color-node'

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { ytPrefix } = require('../../config.json')

export class SlothRadio {
    client
    connection
    channel
    player
    playlist
    current
    currentPercentage
    display
    isPlaylistActive
    playlistCompleted

    constructor(client, channel) {
        this.client = client
        this.channel = channel
        this.player = createAudioPlayer()
        this.playlist = []
        this.current = -1
        this.currentPercentage = 0
        this.isPlaylistActive = false
        this.playlistCompleted = false
        this.updateTick

        this.player.on(AudioPlayerStatus.Idle, async () => {
            await this.nextTrack()
            this.update()
        })
    }

    refresh = async () => {
        if (this.display !== undefined) {
            clearInterval(this.updateTick)
            await this.display.delete()
        }

        this.display = await this.channel.send({
            embeds: [await this.buildDisplay()],
        })

        this.updateTick = setInterval(() => {
            this.update()
        }, 2500)

        try {
            await this.display.react('⏮️')
            await this.display.react('⏯️')
            await this.display.react('⏭️')
            await this.display.react('🔀')
            await this.display.react('📜')
            await this.display.react('📥')
            await this.display.react('❌')
        } catch (e) {}
    }

    update = async () => {
        if (this.display !== undefined && this.updateTick !== undefined) {
            try {
                await this.display.edit({ embeds: [await this.buildDisplay()] })
            } catch (e) {}
        }
    }

    buildDisplay = async () => {
        let display = new Discord.MessageEmbed()
            .setAuthor('🍂 - Sloth Radio - 🍂', this.client.user.avatarURL())
            .setThumbnail(this.client.user.avatarURL())
            .setColor('#DC9AFE')

        if (this.playlist.length > 0) {
            if (this.isPlaylistActive) {
                display.addField(
                    '📜 - Playlist:',
                    this.buildPlaylistView(true, 1024)
                )
            }

            display
                .addField(
                    'Tracks behind',
                    `\`\`\`${Math.max(0, this.current)}\`\`\``,
                    true
                )
                .addField(
                    'Tracks ahead',
                    `\`\`\`${Math.max(
                        0,
                        this.playlist.length - this.current - 1
                    )}\`\`\``,
                    true
                )

            let currentTrack = this.playlist[this.current]
            if (currentTrack !== undefined) {
                display
                    .addField(
                        `${
                            this.player.state.status == AudioPlayerStatus.Paused
                                ? '⏸️ - Paused:'
                                : '📀 - Playing:'
                        }`,
                        `[**${currentTrack.title}**](${currentTrack.url})`
                    )
                    .setThumbnail(currentTrack.author.user.avatarURL())
                let imgURL = `https://img.youtube.com/vi/${currentTrack.id}/maxresdefault.jpg`
                let thumbnail = await fetch(imgURL)

                if (thumbnail.status == 404) {
                    imgURL = `https://img.youtube.com/vi/${currentTrack.id}/0.jpg`
                }

                display.setImage(imgURL)

                let color = await getAverageColor(imgURL)
                display.setColor(color.hex)

                this.currentPercentage =
                    ((this.playlist[this.current].playbackDuration / 1000) *
                        100) /
                    this.playlist[this.current].duration

                display.setFooter(
                    this.buildDurationView(),
                    'https://cdn-icons-png.flaticon.com/512/1479/1479651.png'
                )
            } else {
                display.addField(
                    '🏁 - Finished:',
                    '**Reached end of playlist**'
                )
            }
        } else {
            display.setDescription('**Playlist is empty**')
        }

        return display
    }

    connect = async (author) => {
        const voiceChannel = author.voice.channel
        if (!voiceChannel) {
            this.channel.send(
                `Stop trolling ${author}, enter a voice channel to use the radio :rage:`
            )
            return undefined
        }

        const permissions = voiceChannel.permissionsFor(this.client.user)
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            this.channel.send(
                'I need the permissions to join and speak in your voice channel!'
            )
            return undefined
        }

        const conn = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        })

        await entersState(conn, VoiceConnectionStatus.Ready, 30_000)

        if (!this.player.playable.includes(conn)) {
            conn.subscribe(this.player)
        }
    }

    addTrack = async (author, args, feedback = true) => {
        await this.connect(author)

        let addTrack = await this.buildTrack(author, args)

        if (addTrack === undefined) {
            if (feedback) {
                let errorFeedback = await this.channel.send({
                    embeds: [
                        new Discord.MessageEmbed()
                            .setAuthor(
                                this.client.user.username,
                                this.client.user.avatarURL()
                            )
                            .setDescription(
                                '❌ - Error while loading track. Try a different source.'
                            ),
                    ],
                })

                setTimeout(() => errorFeedback.delete(), 3000)
            }
            return
        }

        this.playlist.push(addTrack)

        if (feedback) {
            let addFeedback = await this.channel.send({
                embeds: [
                    new Discord.MessageEmbed()
                        .setAuthor(
                            author.user.username + ' added:',
                            author.user.avatarURL()
                        )
                        .setDescription(
                            `✅ - [**${addTrack.title}**](${addTrack.url})`
                        ),
                ],
            })

            setTimeout(() => addFeedback.delete(), 3000)
        }

        if (this.player.state.status === AudioPlayerStatus.Idle) {
            await this.nextTrack()
        }

        if (this.display === undefined) {
            await this.refresh()
        } else {
            await this.update()
        }
    }

    buildTrack = async (author, args) => {
        let ytResource = await buildYoutubeResource(args)

        if (ytResource === undefined) return undefined

        const audioResource = createAudioResource(
            youtubedls.raw(
                ytResource.url,
                {
                    o: '-',
                    q: '',
                    f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                    r: '1M',
                },
                { stdio: [('ignore', 'pipe', 'ignore')] }
            ).stdout
        )

        audioResource.title = ytResource.title
        audioResource.url = ytPrefix + ytResource.id
        audioResource.id = ytResource.id
        audioResource.args = args
        audioResource.duration = ytResource.duration / 1000
        audioResource.author = author

        return audioResource
    }

    previousTrack = async () => {
        if (this.current > 0) {
            await this.restoreTrackAt(this.current)
            this.current--
            this.player.play(this.playlist.at(this.current))
            this.playlistCompleted = false
        }
    }

    togglePause = async () => {
        this.player.state.status === AudioPlayerStatus.Playing
            ? this.player.pause()
            : this.player.unpause()
    }

    nextTrack = async () => {
        if (this.current < this.playlist.length) {
            if (!this.playlistCompleted) {
                await this.restoreTrackAt(this.current)
                this.current++
            }

            if (this.current === this.playlist.length) {
                this.player.stop()
                this.playlistCompleted = true
            } else {
                this.player.play(this.playlist.at(this.current))
                this.playlistCompleted = false
            }
        }
    }

    shuffle = async () => {
        let tracksAhead = this.playlist.slice(
            this.current + 1,
            this.playlist.length
        )

        let currentIdx = tracksAhead.length,
            randomIdx

        while (currentIdx != 0) {
            randomIdx = Math.floor(Math.random() * currentIdx)
            currentIdx--
            ;[tracksAhead[currentIdx], tracksAhead[randomIdx]] = [
                tracksAhead[randomIdx],
                tracksAhead[currentIdx],
            ]
        }

        for (let i = 0; i < tracksAhead.length; i++) {
            this.playlist[this.current + i + 1] = tracksAhead[i]
        }
    }

    clear = async () => {
        this.playlist = []
        this.current = -1
        this.playlistCompleted = false
        this.player.stop()
    }

    togglePlaylist = async () => {
        this.isPlaylistActive = !this.isPlaylistActive
    }

    pack = async () => {
        this.channel.send({
            embeds: [
                new Discord.MessageEmbed()
                    .setTitle('📜 - Playlist')
                    .setDescription(this.buildPlaylistView(false, 4096))
                    .setColor('#DC9AFE'),
            ],
        })
    }

    buildPlaylistView = (tagCurrent = false, limit = 1024) => {
        let playlistView =
            this.player.state.status === AudioPlayerStatus.Playing
                ? tagCurrent
                    ? '➡ - '
                    : ''
                : ''
        let playlistLength = 0

        let gap = 0
        let idx = this.current
        let botF = true,
            topF = true

        while (playlistLength <= limit && (botF || topF)) {
            idx += gap

            if (idx < 0) {
                botF = false
            }
            if (idx >= this.playlist.length) {
                topF = false
            }

            if (idx >= 0 && idx < this.playlist.length) {
                let track =
                    '**' +
                    (idx + 1) +
                    '**. ' +
                    `[**${this.playlist.at(idx).title}**](${
                        this.playlist.at(idx).url
                    })\n`

                playlistLength += track.length

                if (playlistLength <= limit) {
                    if (gap >= 0) {
                        playlistView += track
                    } else {
                        playlistView = track + playlistView
                    }
                }
            }
            gap = gap > 0 ? (gap + 1) * -1 : (gap - 1) * -1
        }

        return playlistView
    }

    buildDurationView = () => {
        let durationView = ''
        let durationFill = Math.round(this.currentPercentage / 4)

        for (let i = 0; i < durationFill; i++) {
            durationView += '▰'
        }

        for (let i = 0; i < 25 - durationFill; i++) {
            durationView += '▱'
        }

        durationView +=
            ' - ' +
            formatSecToMinutes(
                this.playlist[this.current].playbackDuration / 1000
            ) +
            ' / ' +
            formatSecToMinutes(this.playlist[this.current].duration)

        return durationView
    }

    restoreTrackAt = async (position) => {
        if (position > -1 && position < this.playlist.length) {
            this.playlist[position] = await this.buildTrack(
                this.playlist.at(position).author,
                [this.playlist.at(position).args]
            )
        }
    }
}
