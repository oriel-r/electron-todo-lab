import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { AppInfo, ElectronAPI, MainLogEvent, Todo, TodoFilter } from '../shared/types';

function getApi(): Partial<ElectronAPI> | undefined {
  return window.electronAPI as Partial<ElectronAPI> | undefined;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [logs, setLogs] = useState<MainLogEvent[]>([]);

  useEffect(() => {
    let active = true;
    const api = getApi();

    if (!api) {
      setError('Preload pendiente: window.electronAPI todavía no está expuesto.');
      return;
    }

    async function bootstrap() {
      try {
        if (api?.listTodos) {
          const initialTodos = await api.listTodos();
          if (active) setTodos(initialTodos);
        }
        if (api?.getAppInfo) {
          const info = await api.getAppInfo();
          if (active) setAppInfo(info);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error cargando datos iniciales');
        }
      }
    }

    void bootstrap();

    const unsubTodos = api.onTodosChanged
      ? api.onTodosChanged((updatedTodos) => {
          setTodos(updatedTodos);
        })
      : undefined;

    const unsubLogs = api.onMainEvent
      ? api.onMainEvent((event) => {
          setLogs((prev) => [event, ...prev].slice(0, 30));
        })
      : undefined;

    return () => {
      active = false;
      unsubTodos?.();
      unsubLogs?.();
    };
  }, []);

  const filteredTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const activeCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const completedCount = todos.length - activeCount;

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const api = getApi();
    if (!api?.createTodo) {
      setError('Falta implementar createTodo en preload.ts y su handler en Main.');
      return;
    }
    try {
      const created = await api.createTodo(newTitle);
      setTodos((prev) => [created, ...prev]);
      setNewTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la tarea');
    }
  }

  async function handleToggle(id: number) {
    setError(null);
    const api = getApi();
    if (!api?.toggleTodo) {
      setError('Falta implementar toggleTodo en preload.ts y su handler en Main.');
      return;
    }
    try {
      const updated = await api.toggleTodo(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la tarea');
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    const api = getApi();
    if (!api?.deleteTodo) {
      setError('Falta implementar deleteTodo en preload.ts y su handler en Main.');
      return;
    }
    try {
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la tarea');
    }
  }

  async function handleSaveEdit(id: number) {
    setError(null);
    const api = getApi();
    if (!api?.updateTodoTitle) {
      setError('Falta implementar updateTodoTitle en preload.ts y su handler en Main.');
      return;
    }
    try {
      const updated = await api.updateTodoTitle(id, editingTitle);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo editar la tarea');
    }
  }

  async function handleClearCompleted() {
    setError(null);
    const api = getApi();
    if (!api?.clearCompleted) {
      setError('Falta implementar clearCompleted en preload.ts y su handler en Main.');
      return;
    }
    try {
      await api.clearCompleted();
      setTodos((prev) => prev.filter((t) => !t.completed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron limpiar las completadas');
    }
  }

  async function handleRevealDb() {
    setError(null);
    const api = getApi();
    if (!api?.revealDbInFolder) {
      setError('Falta implementar revealDbInFolder en preload.ts y su handler en Main.');
      return;
    }
    try {
      await api.revealDbInFolder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir la carpeta de la DB');
    }
  }

  return (
    <main className="layout">
      <section className="card">
        <header className="header">
          <h1>Electron Todo Lab</h1>
          <span className="badge">
            v{appInfo?.appVersion ?? '—'} · {appInfo ? (appInfo.isPackaged ? 'Prod' : 'Dev') : 'Sin IPC'}
          </span>
        </header>

        <form className="todo-form" onSubmit={handleCreate}>
          <input
            className="input"
            type="text"
            placeholder="Nueva tarea (se guarda en SQLite vía IPC)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </form>

        {error && <div className="error-banner">{error}</div>}

        <div className="toolbar">
          <div className="filters">
            {(['all', 'active', 'completed'] as TodoFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-btn ${filter === item ? 'active' : ''}`}
                onClick={() => setFilter(item)}
              >
                {item === 'all' && `Todas (${todos.length})`}
                {item === 'active' && `Pendientes (${activeCount})`}
                {item === 'completed' && `Completadas (${completedCount})`}
              </button>
            ))}
          </div>

          {completedCount > 0 && (
            <button type="button" className="btn btn-sm" onClick={handleClearCompleted}>
              Limpiar completadas
            </button>
          )}
        </div>

        {filteredTodos.length === 0 ? (
          <div className="empty">
            No hay tareas todavía. A medida que vayas conectando tus canales IPC, van a aparecer acá.
          </div>
        ) : (
          <ul className="todo-list">
            {filteredTodos.map((todo) => (
              <li key={todo.id} className="todo-item">
                <div className="todo-left">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => void handleToggle(todo.id)}
                  />
                  {editingId === todo.id ? (
                    <input
                      className="input"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleSaveEdit(todo.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`todo-title ${todo.completed ? 'completed' : ''}`}
                      onDoubleClick={() => {
                        setEditingId(todo.id);
                        setEditingTitle(todo.title);
                      }}
                      title="Doble click para editar"
                    >
                      {todo.title}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {editingId === todo.id ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => void handleSaveEdit(todo.id)}
                    >
                      Guardar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        setEditingId(todo.id);
                        setEditingTitle(todo.title);
                      }}
                    >
                      Editar
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => void handleDelete(todo.id)}
                  >
                    Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="card">
        <header className="header">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Inspector Backend & IPC</h2>
          <button type="button" className="btn btn-sm" onClick={() => void handleRevealDb()}>
            Abrir DB
          </button>
        </header>

        {appInfo ? (
          <div className="inspector-grid">
            <span className="inspector-key">OS / Arch</span>
            <span className="inspector-val">
              {appInfo.platform} ({appInfo.arch})
            </span>
            <span className="inspector-key">Electron</span>
            <span className="inspector-val">{appInfo.electronVersion}</span>
            <span className="inspector-key">Node / Chrome</span>
            <span className="inspector-val">
              {appInfo.nodeVersion} / {appInfo.chromeVersion}
            </span>
            <span className="inspector-key">SQLite path</span>
            <span className="inspector-val">{appInfo.dbPath}</span>
          </div>
        ) : (
          <p className="hint">
            Todavía no llega <code>app:get-info</code> desde el proceso Main.
          </p>
        )}

        <p className="hint">
          Log en vivo de eventos emitidos desde <code>Main Process</code> (cuando implementes el push):
        </p>

        <ul className="log-list">
          {logs.length === 0 ? (
            <li className="log-item" style={{ color: 'var(--muted)' }}>
              Esperando eventos IPC...
            </li>
          ) : (
            logs.map((log) => (
              <li key={log.id} className="log-item">
                <div className="log-meta">
                  <span>{log.channel}</span>
                  <span className="log-time">{log.timestamp}</span>
                </div>
                <div>{log.summary}</div>
              </li>
            ))
          )}
        </ul>
      </aside>
    </main>
  );
}
