export type TodoFilter = 'all' | 'active' | 'completed';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppInfo {
  appVersion: string;
  platform: NodeJS.Platform;
  arch: string;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
  dbPath: string;
  isPackaged: boolean;
}

export interface MainLogEvent {
  id: string;
  channel: string;
  summary: string;
  timestamp: string;
}

/**
 * Canalización centralizada de nombres IPC.
 * Mantenerlos en shared evita typos entre Main, Preload y Renderer.
 */
export const IPC_CHANNELS = {
  TODOS_LIST: 'todos:list',
  TODOS_CREATE: 'todos:create',
  TODOS_TOGGLE: 'todos:toggle',
  TODOS_UPDATE_TITLE: 'todos:update-title',
  TODOS_DELETE: 'todos:delete',
  TODOS_CLEAR_COMPLETED: 'todos:clear-completed',
  APP_GET_INFO: 'app:get-info',
  APP_REVEAL_DB: 'app:reveal-db',
  // Eventos push (Main -> Renderer)
  EVENT_TODOS_CHANGED: 'events:todos-changed',
  EVENT_MAIN_LOG: 'events:main-log',
} as const;

export interface ElectronAPI {
  listTodos: () => Promise<Todo[]>;
  createTodo: (title: string) => Promise<Todo>;
  toggleTodo: (id: number) => Promise<Todo>;
  updateTodoTitle: (id: number, title: string) => Promise<Todo>;
  deleteTodo: (id: number) => Promise<void>;
  clearCompleted: () => Promise<number>;
  getAppInfo: () => Promise<AppInfo>;
  revealDbInFolder: () => Promise<void>;
  onTodosChanged: (callback: (todos: Todo[]) => void) => () => void;
  onMainEvent: (callback: (event: MainLogEvent) => void) => () => void;
}
