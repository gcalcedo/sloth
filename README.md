# Sloth

<p align="center">
  <img src="https://cdn.discordapp.com/attachments/477545483330650126/885300068847063040/2248.jpg" width=300/>
</p>

## 📖 - Description

Sloth is an easy-to-use discord music bot. It provides a visual interface for controlling a music player without the need of text commands.

## ⚙ - Installation

**Sloth** is not hosted anywhere oficially. However, you can run and use your own instance. For that you need to meet this requirements:

-   **Node v16.6.0 or higher**. You can get it [here](https://nodejs.org/en/).
-   Your own **discord token**. You can obtain it by registering your discord application [here](https://discord.com/developers/applications).

After meeting this requirements, follow this steps:

1. **Clone** this repository.
2. **Paste** your discord token in the **`config.json`** file.
3. **Run `npm install`** to install all necessary dependencies.
4. **Run `node .`** to start the bot.

Finally, Add a **bot** to your discord application and build an OAuth2 link with the **bot scope** and the following **permissions**.
This can be done also through the [Discord Developer Portal](https://discord.com/developers/applications).

<p align="center">
  <img src="https://cdn.discordapp.com/attachments/477545483330650126/896092491508502558/unknown.png" width=1000/>
</p>

From now on, you can use this link to invite **Sloth** to your discord server.

## 🎵 - Usage

To play a song, connect to a voice channel and type a command following this template:

-   `$p NAME_OF_SONG`

Then, the bot will respond with an embeded message that will serve as the UI. The UI displays:

-   The full playlist and the current track.
-   The avatar image of the user that requested the current track.
-   The number of tracks ahead and behind of the current track.
-   The thumbnail and the timeline of the current track.

<p align="center">
  <img src="https://cdn.discordapp.com/attachments/477545483330650126/896094658000728114/unknown.png" width=400/>
</p>

It also provides a button bar to control the audio player:

-   ⏮️: Previous track.
-   ⏯️: Pause / Unpause the player.
-   ⏭️: Next track.
-   🔀: Shuffle the playlist.
-   📜: Toggle On/Off the playlist view of the UI.
-   📥: Print the current playlist as an independent message.
-   ❌: Stop the player and clear the playlist.

If more messages are sent to the same channel in which the UI is displayed, you can type `$refresh` to bring the UI back to the bottom of the channel as a new message.

## Credits

Thanks to [Catalystuff](https://www.freepik.es/catalyststuff) for the beautiful Sloth illustration ♥.
