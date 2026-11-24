import { ipcRenderer, contextBridge, IpcRendererEvent } from "electron"
import { ElectronAPI, IPC_CHANNELS, MainLogEvent, Todo } from "./shared/types"

const api: Partial<ElectronAPI> = {
  getAppInfo: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_INFO),
  createTodo: (title: string) => ipcRenderer.invoke(IPC_CHANNELS.TODOS_CREATE, title),
  deleteTodo: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.TODOS_DELETE, id),
  updateTodoTitle: (id: number, title: string) => ipcRenderer.invoke(IPC_CHANNELS.TODOS_UPDATE_TITLE, id, title),
  toggleTodo: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.TODOS_TOGGLE, id),
  listTodos: () => ipcRenderer.invoke(IPC_CHANNELS.TODOS_LIST),
  revealDbInFolder: () => ipcRenderer.invoke(IPC_CHANNELS.APP_REVEAL_DB),
  clearCompleted: () => ipcRenderer.invoke(IPC_CHANNELS.TODOS_CLEAR_COMPLETED),
  onMainEvent: (callback: (event: MainLogEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: MainLogEvent) => {
      callback(data)
    }

    ipcRenderer.on(IPC_CHANNELS.EVENT_MAIN_LOG, listener)

    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_MAIN_LOG, listener)
    }
  },
  onTodosChanged: (callback: (todo: Todo[]) => void) => {
    const listener = (_event: IpcRendererEvent, data: Todo[]) => {
      callback(data)
    }

    ipcRenderer.on(IPC_CHANNELS.EVENT_TODOS_CHANGED, listener)

    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_TODOS_CHANGED, listener)
    }
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)
