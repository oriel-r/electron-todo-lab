import { app, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { IPC_CHANNELS } from "../shared/types"
import todoService from "./todos.service";
import { validator } from "../utils/validator";
import { MainLogEvent, } from "../shared/types";

export const registerIpcInvokes = () => {

  secureHandler(IPC_CHANNELS.TODOS_CREATE, todoService.create)
  secureHandler(IPC_CHANNELS.APP_GET_INFO, todoService.getAppInfo);
  secureHandler(IPC_CHANNELS.APP_REVEAL_DB, todoService.revealDB)
  secureHandler(IPC_CHANNELS.TODOS_LIST, todoService.getTodoList);
  secureHandler(IPC_CHANNELS.TODOS_DELETE, todoService.delete)
  secureHandler(IPC_CHANNELS.TODOS_UPDATE_TITLE, todoService.updateTodo);
  secureHandler(IPC_CHANNELS.TODOS_TOGGLE, todoService.toggle);
  secureHandler(IPC_CHANNELS.TODOS_CLEAR_COMPLETED, todoService.clear)
}

function secureHandler(channel: string, func: Function) {
  ipcMain.handle(channel, (e, ...args: unknown[]) => {
    if (!validator(e.senderFrame)) throw new Error('bad sender')
    const sender = e.sender

    const data: MainLogEvent = {
      id: crypto.randomUUID(),
      channel: channel,
      summary: `Execute ${channel} with args ${JSON.stringify(args)}`,
      timestamp: new Date().toISOString(),
    }

    const result = func(...args)

    sender.send(IPC_CHANNELS.EVENT_MAIN_LOG, data)

    return result
  })
}