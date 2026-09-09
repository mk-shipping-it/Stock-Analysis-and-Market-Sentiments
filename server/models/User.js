const { query } = require('../config/db');

const toISO = (v) => (v instanceof Date ? v.toISOString() : v);

function mapUser(row) {
  if (!row) return null;
  const u = {
    id: row.id, _id: row.id, email: row.email, username: row.username, name: row.name,
    passwordHash: row.password_hash, googleId: row.google_id, role: row.role || 'user',
    walletBalance: Number(row.wallet_balance) || 0, createdAt: toISO(row.created_at),
    lastLoginAt: toISO(row.last_login_at), isActive: row.is_active !== false,
  };
  u.save = async () => {
    await query(
      `UPDATE users SET email=$1, username=$2, name=$3, password_hash=$4, google_id=$5,
       role=$6, wallet_balance=$7, updated_at=now(), last_login_at=$8, is_active=$9 WHERE id=$10`,
      [u.email, u.username, u.name, u.passwordHash, u.googleId, u.role, u.walletBalance, u.lastLoginAt, u.isActive, u.id]
    );
    return u;
  };
  u.toJSON = () => { const { passwordHash, save, toJSON, ...rest } = u; return rest; };
  return u;
}

async function findById(id) {
  return id ? mapUser((await query('SELECT * FROM users WHERE id = $1', [id])).rows[0]) : null;
}

const COL_MAP = { googleId: 'google_id', passwordHash: 'password_hash', walletBalance: 'wallet_balance', lastLoginAt: 'last_login_at', isActive: 'is_active', _id: 'id' };

async function findOne(filter = {}) {
  const keys = Object.keys(filter);
  if (!keys.length) return mapUser((await query('SELECT * FROM users LIMIT 1')).rows[0]);
  const clauses = keys.map((k, i) => {
    const col = COL_MAP[k] || k;
    return col === 'email' ? `LOWER(${col}) = LOWER($${i + 1})` : `${col} = $${i + 1}`;
  });
  const res = await query(`SELECT * FROM users WHERE ${clauses.join(' AND ')} LIMIT 1`, Object.values(filter));
  return mapUser(res.rows[0]);
}

async function create(data = {}) {
  const res = await query(
    `INSERT INTO users (email, username, name, password_hash, google_id, role, wallet_balance, last_login_at, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.email ? String(data.email).toLowerCase() : null, data.username || null,
      data.name || null, data.passwordHash || null, data.googleId || null,
      data.role || 'user', data.walletBalance ?? 0, data.lastLoginAt || null, data.isActive !== false,
    ]
  );
  return mapUser(res.rows[0]);
}

async function countDocuments() {
  return (await query('SELECT COUNT(*)::int AS count FROM users')).rows[0].count;
}

module.exports = { findById, findOne, create, countDocuments };
