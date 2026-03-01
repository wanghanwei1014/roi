import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'roi_analysis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDatabase(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roi_data (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        date            DATE NOT NULL,
        day_of_week     VARCHAR(10),
        app             VARCHAR(20) NOT NULL,
        bid_type        VARCHAR(10) NOT NULL DEFAULT 'CPI',
        country         VARCHAR(20) NOT NULL,
        installs        INT NOT NULL DEFAULT 0,
        roi_day0        DECIMAL(10,2) DEFAULT 0,
        roi_day1        DECIMAL(10,2) DEFAULT 0,
        roi_day3        DECIMAL(10,2) DEFAULT 0,
        roi_day7        DECIMAL(10,2) DEFAULT 0,
        roi_day14       DECIMAL(10,2) DEFAULT 0,
        roi_day30       DECIMAL(10,2) DEFAULT 0,
        roi_day60       DECIMAL(10,2) DEFAULT 0,
        roi_day90       DECIMAL(10,2) DEFAULT 0,
        insufficient_day0   TINYINT(1) DEFAULT 0,
        insufficient_day1   TINYINT(1) DEFAULT 0,
        insufficient_day3   TINYINT(1) DEFAULT 0,
        insufficient_day7   TINYINT(1) DEFAULT 0,
        insufficient_day14  TINYINT(1) DEFAULT 0,
        insufficient_day30  TINYINT(1) DEFAULT 0,
        insufficient_day60  TINYINT(1) DEFAULT 0,
        insufficient_day90  TINYINT(1) DEFAULT 0,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_app (app),
        INDEX idx_country (country),
        INDEX idx_date (date),
        INDEX idx_app_country_date (app, country, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Database table initialized successfully');
  } finally {
    conn.release();
  }
}

export default pool;
