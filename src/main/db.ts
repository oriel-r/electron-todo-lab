import { app } from 'electron';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { Todo } from '../shared/types';

interface TodoRow {
  id: number;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
}

let dbInstance: Database.Database | null = null;
let currentDbPath = '';

function mapRowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getDb(): Database.Database {
  if (!dbInstance) {
    throw new Error('La base de datos no fue inicializada. Llama a initDatabase() primero.');
  }
  return dbInstance;
}

/**
 * Inicializa SQLite en la carpeta userData del sistema operativo.
 * Nunca guardar datos de usuario dentro de la carpeta de instalación de la app,
 * porque en Windows/macOS suele ser de solo lectura y se borra al actualizar.
 */
export function initDatabase(): string {
  if (dbInstance) return currentDbPath;

  const userDataDir = app.getPath('userData');
  fs.mkdirSync(userDataDir, { recursive: true });

  currentDbPath = path.join(userDataDir, 'todos.sqlite');
  dbInstance = new Database(currentDbPath);

  // WAL mejora concurrencia y seguridad frente a cierres inesperados
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return currentDbPath;
}

export function getDatabasePath(): string {
  return currentDbPath;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function listTodos(): Todo[] {
  const rows = getDb()
    .prepare<[], TodoRow>(
      'SELECT id, title, completed, created_at, updated_at FROM todos ORDER BY completed ASC, id DESC',
    )
    .all();

  return rows.map(mapRowToTodo);
}

export function createTodo(rawTitle: string): Todo {
  const title = rawTitle.trim();
  if (!title) {
    throw new Error('El título de la tarea no puede estar vacío.');
  }
  if (title.length > 200) {
    throw new Error('El título no puede superar los 200 caracteres.');
  }

  const info = getDb()
    .prepare<[string]>(
      "INSERT INTO todos (title, completed, created_at, updated_at) VALUES (?, 0, datetime('now'), datetime('now'))",
    )
    .run(title);

  const created = getDb()
    .prepare<[number | bigint], TodoRow>(
      'SELECT id, title, completed, created_at, updated_at FROM todos WHERE id = ?',
    )
    .get(info.lastInsertRowid);

  if (!created) {
    throw new Error('No se pudo leer la tarea recién creada.');
  }

  return mapRowToTodo(created);
}

export function toggleTodo(id: number): Todo {
  const db = getDb();
  const result = db
    .prepare<[number]>(
      "UPDATE todos SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?",
    )
    .run(id);

  if (result.changes === 0) {
    throw new Error(`No existe ninguna tarea con id=${id}.`);
  }

  const updated = db
    .prepare<[number], TodoRow>(
      'SELECT id, title, completed, created_at, updated_at FROM todos WHERE id = ?',
    )
    .get(id);

  if (!updated) {
    throw new Error(`No se pudo leer la tarea actualizada id=${id}.`);
  }

  return mapRowToTodo(updated);
}

export function updateTodoTitle(id: number, rawTitle: string): Todo {
  const title = rawTitle.trim();
  if (!title) {
    throw new Error('El título de la tarea no puede estar vacío.');
  }
  if (title.length > 200) {
    throw new Error('El título no puede superar los 200 caracteres.');
  }

  const db = getDb();
  const result = db
    .prepare<[string, number]>(
      "UPDATE todos SET title = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .run(title, id);

  if (result.changes === 0) {
    throw new Error(`No existe ninguna tarea con id=${id}.`);
  }

  const updated = db
    .prepare<[number], TodoRow>(
      'SELECT id, title, completed, created_at, updated_at FROM todos WHERE id = ?',
    )
    .get(id);

  if (!updated) {
    throw new Error(`No se pudo leer la tarea actualizada id=${id}.`);
  }

  return mapRowToTodo(updated);
}

export function deleteTodo(id: number): void {
  const result = getDb().prepare<[number]>('DELETE FROM todos WHERE id = ?').run(id);
  if (result.changes === 0) {
    throw new Error(`No existe ninguna tarea con id=${id}.`);
  }
}

export function clearCompleted(): number {
  const result = getDb().prepare('DELETE FROM todos WHERE completed = 1').run();
  return result.changes;
}
