import * as SQLite from 'expo-sqlite';

let db;

export const initDB = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('ocorrencias.db');
  }

  // Criar tabela de ocorrências
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ocorrencias (
      id TEXT PRIMARY KEY,
      description TEXT,
      photoUri TEXT,
      lat REAL,
      lon REAL,
      categoryId TEXT,
      createdAt TEXT,
      syncStatus TEXT
    );
  `);
};

// ===== Ocorrências =====
export const insertOcorrenciaLocal = async (ocorrencia) => {
  const { id, description, photoUri, lat, lon, categoryId, createdAt } = ocorrencia;
  await db.runAsync(
    `INSERT OR IGNORE INTO ocorrencias (id, description, photoUri, lat, lon, categoryId, createdAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, description, photoUri, lat, lon, categoryId, createdAt, 'PENDING']
  );
};

export const getPendingOcorrencias = async () => {
  return await db.getAllAsync(`SELECT * FROM ocorrencias WHERE syncStatus = 'PENDING'`);
};

export const markAsSynced = async (id) => {
  await db.runAsync(`UPDATE ocorrencias SET syncStatus = 'SYNCED' WHERE id = ?`, [id]);
};

export const removeOcorrenciaLocal = async (id) => {
  await db.runAsync(`DELETE FROM ocorrencias WHERE id = ?`, [id]);
};
