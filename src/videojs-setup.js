/**
 * Video.js setup. Sets global.videojs so the UMD build of videojs-markers can attach.
 * Import this file first, then import the markers plugin (e.g. in the page that uses the player).
 */
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import 'videojs-markers/dist/videojs.markers.css'

if (typeof window !== 'undefined') {
  window.videojs = videojs
}

export default videojs
