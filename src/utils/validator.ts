import { WebFrameMain } from "electron"
import { URL } from "node:url"

export const validator = (sendeFrame: WebFrameMain | null) => {
  if(!sendeFrame || sendeFrame.detached) return false
  
  if(!MAIN_WINDOW_VITE_DEV_SERVER_URL) {  
    return sendeFrame.url.startsWith('file://')     
  }

  if(sendeFrame.origin !== new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).origin) return false
  return true
}
