import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { ytPrefix } = require('../../config.json')
const YouTube = require('youtube-sr').default

export const buildYoutubeResource = async (args) => {
    args = args.join(' ')

    let searchResult

    try {
        if (args.startsWith(ytPrefix)) {
            searchResult = await YouTube.getVideo(args)
        } else {
            searchResult = await YouTube.searchOne(args)
        }
    } catch (e) {
        return undefined
    }

    return searchResult
}

export const formatSecToMinutes = (secs) => {
    let minutes = Math.floor(secs / 60)
    let seconds = Math.floor(secs - 60 * minutes)

    return minutes + ':' + `${seconds < 10 ? '0' : ''}` + seconds
}
