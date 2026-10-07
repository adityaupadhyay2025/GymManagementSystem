const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { db, initDatabase, seedDatabase } = require('./db.js');
const QUERIES = require('./queries.js');

// Initialize database schema and initial data
initDatabase();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Table Primary Key mappings
const PK_MAP = {
  'Equipment': 'Equipment_ID',
  'Member': 'Member_ID',
  'Trainer': 'Trainer_ID',
  'Maintenance': 'Maintenance_ID',
  'Equipment_Usage': 'Usage_ID',
  'Payment': 'Payment_ID'
};

const TABLE_NAMES = Object.keys(PK_MAP);

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

// Serve static frontend files
function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

// Create the HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- REST API ROUTES ---
  try {
    // 1. Dashboard summary stats
    if (pathname === '/api/stats' && method === 'GET') {
      const totalMembers = db.prepare('SELECT COUNT(*) as count FROM Member').get().count;
      const totalEquipment = db.prepare('SELECT COUNT(*) as count FROM Equipment').get().count;
      const equipmentUnderMaintenance = db.prepare("SELECT COUNT(*) as count FROM Equipment WHERE Status = 'Maintenance'").get().count;
      const totalTrainers = db.prepare('SELECT COUNT(*) as count FROM Trainer').get().count;
      const totalRevenueRow = db.prepare("SELECT COALESCE(SUM(Amount), 0) as total FROM Payment WHERE Payment_Status = 'Paid'").get();
      const pendingDuesRow = db.prepare("SELECT COUNT(*) as count FROM Payment WHERE Payment_Status = 'Pending'").get();
      const recentWorkoutsCount = db.prepare('SELECT COUNT(*) as count FROM Equipment_Usage').get().count;

      return sendJson(res, 200, {
        totalMembers,
        totalEquipment,
        equipmentUnderMaintenance,
        totalTrainers,
        totalRevenue: totalRevenueRow.total,
        pendingDuesCount: pendingDuesRow.count,
        recentWorkoutsCount
      });
    }

    // 2. Schema metadata for forms & dropdowns
    if (pathname === '/api/schema' && method === 'GET') {
      const schema = {};
      for (const table of TABLE_NAMES) {
        const columns = db.prepare(`PRAGMA table_info(${table})`).all();
        const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all();
        schema[table] = {
          pk: PK_MAP[table],
          columns: columns.map(c => ({
            name: c.name,
            type: c.type,
            notnull: c.notnull === 1,
            pk: c.pk === 1
          })),
          foreignKeys: fks.map(f => ({
            column: f.from,
            foreignTable: f.table,
            foreignColumn: f.to
          }))
        };
      }
      return sendJson(res, 200, schema);
    }

    // 3. Dropdown lookup options for Foreign Keys
    if (pathname === '/api/lookup-options' && method === 'GET') {
      const members = db.prepare('SELECT Member_ID, Member_Name FROM Member ORDER BY Member_Name').all();
      const equipment = db.prepare('SELECT Equipment_ID, Equipment_Name, Status FROM Equipment ORDER BY Equipment_Name').all();
      const trainers = db.prepare('SELECT Trainer_ID, Trainer_Name, Specialization FROM Trainer ORDER BY Trainer_Name').all();
      return sendJson(res, 200, { members, equipment, trainers });
    }

    // 4. Queries listing
    if (pathname === '/api/queries' && method === 'GET') {
      return sendJson(res, 200, QUERIES);
    }

    // 5. Run Query (Preset or custom SQL)
    if (pathname === '/api/queries/run' && method === 'POST') {
      const body = await parseBody(req);
      let sqlToExecute = '';
      let queryMeta = null;

      if (body.queryId) {
        queryMeta = QUERIES.find(q => q.id === Number(body.queryId));
        if (!queryMeta) {
          return sendJson(res, 404, { error: 'Query not found' });
        }
        sqlToExecute = queryMeta.sql;
      } else if (body.sql) {
        sqlToExecute = body.sql.trim();
      } else {
        return sendJson(res, 400, { error: 'Provide queryId or sql string' });
      }

      const stmt = db.prepare(sqlToExecute);
      const rows = stmt.all();
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      return sendJson(res, 200, {
        success: true,
        queryMeta,
        sql: sqlToExecute,
        columns,
        rows,
        rowCount: rows.length
      });
    }

    // 6. Reset database to initial DA1 sample data
    if (pathname === '/api/reset' && method === 'POST') {
      seedDatabase();
      return sendJson(res, 200, { success: true, message: 'Database reset to original DA1 records.' });
    }

    // 7. Generic Table CRUD:
    // Match /api/tables/:tableName or /api/tables/:tableName/:id
    const tableRouteRegex = /^\/api\/tables\/([A-Za-z_]+)(?:\/([A-Za-z0-9_-]+))?$/;
    const match = pathname.match(tableRouteRegex);
    if (match) {
      const tableName = match[1];
      const recordId = match[2];

      if (!TABLE_NAMES.includes(tableName)) {
        return sendJson(res, 404, { error: `Table '${tableName}' not recognized.` });
      }

      const pkCol = PK_MAP[tableName];

      // READ ALL / SEARCH
      if (method === 'GET' && !recordId) {
        const search = parsedUrl.searchParams.get('q');
        let rows = [];
        if (search) {
          // Dynamic text search across columns
          const cols = db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
          const whereClause = cols.map(c => `CAST(${c} AS TEXT) LIKE ?`).join(' OR ');
          const params = cols.map(() => `%${search}%`);
          rows = db.prepare(`SELECT * FROM ${tableName} WHERE ${whereClause} ORDER BY ${pkCol} ASC`).all(...params);
        } else {
          rows = db.prepare(`SELECT * FROM ${tableName} ORDER BY ${pkCol} ASC`).all();
        }
        return sendJson(res, 200, rows);
      }

      // READ SINGLE
      if (method === 'GET' && recordId) {
        const row = db.prepare(`SELECT * FROM ${tableName} WHERE ${pkCol} = ?`).get(recordId);
        if (!row) {
          return sendJson(res, 404, { error: `Record with ${pkCol}=${recordId} not found.` });
        }
        return sendJson(res, 200, row);
      }

      // CREATE (INSERT)
      if (method === 'POST') {
        const body = await parseBody(req);
        const keys = Object.keys(body).filter(k => k !== 'rowid');
        if (keys.length === 0) {
          return sendJson(res, 400, { error: 'Request body cannot be empty.' });
        }

        const placeholders = keys.map(() => '?').join(', ');
        const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
        const values = keys.map(k => body[k]);

        try {
          db.prepare(sql).run(...values);
          return sendJson(res, 201, { success: true, message: `Record inserted into ${tableName}.`, data: body });
        } catch (dbErr) {
          return sendJson(res, 400, { error: dbErr.message });
        }
      }

      // UPDATE
      if (method === 'PUT' && recordId) {
        const body = await parseBody(req);
        const keys = Object.keys(body).filter(k => k !== pkCol && k !== 'rowid');
        if (keys.length === 0) {
          return sendJson(res, 400, { error: 'No fields provided to update.' });
        }

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${pkCol} = ?`;
        const values = [...keys.map(k => body[k]), recordId];

        try {
          const result = db.prepare(sql).run(...values);
          return sendJson(res, 200, { success: true, message: `Record updated in ${tableName}.`, affected: result.changes });
        } catch (dbErr) {
          return sendJson(res, 400, { error: dbErr.message });
        }
      }

      // DELETE
      if (method === 'DELETE' && recordId) {
        try {
          const sql = `DELETE FROM ${tableName} WHERE ${pkCol} = ?`;
          const result = db.prepare(sql).run(recordId);
          if (result.changes === 0) {
            return sendJson(res, 404, { error: `Record ${recordId} not found.` });
          }
          return sendJson(res, 200, { success: true, message: `Record deleted from ${tableName}.` });
        } catch (dbErr) {
          return sendJson(res, 400, { error: dbErr.message });
        }
      }
    }

    // Default 404 for unknown /api routes
    if (pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'API endpoint not found.' });
    }

  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, { error: err.message });
  }

  // Serve static files for frontend
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏋️ GYM MANAGEMENT SYSTEM (DA2) SERVER IS LIVE`);
  console.log(`🚀 Access application at: http://localhost:${PORT}`);
  console.log(`📊 Built-in SQLite database connected & initialized`);
  console.log(`====================================================`);
});
