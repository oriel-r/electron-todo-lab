import { IpcMainEvent, IpcMainInvokeEvent, shell } from "electron"
import { validator } from "../utils/validator"
import { app } from "electron/main"
import { getDatabasePath, createTodo, listTodos, toggleTodo, deleteTodo, updateTodoTitle, clearCompleted } from "./db"
import type { Todo } from "../shared/types"
import os from "node:os"


const todoService = {
  getAppInfo() {
    return {
      dbPath: getDatabasePath(),
      arch: os.arch(),
      chromeVersion: process.versions.chrome,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      appVersion: app.getVersion(),
      platform: process.platform,
      isPackaged: app.isPackaged,
    }
  },
  create(title: string) {
    if (!title || typeof title !== 'string' || title.trim() === '') throw new Error("Title is required")

    const todo = createTodo(title)
    return todo
  },
  getTodoList() {
    return listTodos()
  },
  updateTodo(id: number, title: string) {
    return updateTodoTitle(id, title)
  },
  delete(id: number) {
    if (!id || typeof id !== 'number') throw new Error("Id is required")

    return deleteTodo(id)
  },
  revealDB() {
    const path = getDatabasePath()
    return shell.showItemInFolder(path)
  },
  toggle(id: number) {
    if (!id || typeof id !== 'number') throw new Error("Id is required")

    return toggleTodo(id)
  },
  clear() {
    return clearCompleted()
  }
}

export default todoService