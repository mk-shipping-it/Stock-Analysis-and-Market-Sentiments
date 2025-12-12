const { query } = require('../config/db');

function toISO(v) {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString();
  return v;
}

function mapUser(row) {
  if (!row) return null;
  const user = {
    id: row.id,
    _id: row.id,
    email: row.email,
    username: row.username,
    name: row.name,
    passwordHash: row.password_hash,
    googleId: row.google_id,
    role: row.role,
    walletBalance: row.wallet_balance === null || row.wallet_balance === undefined ? 0 : Number(row.wallet_balance),
    createdAt: toISO(row.created_at),
    updatedAt: toISO(row.updated_at),
    lastLoginAt: toISO(row.last_login_at),
    isActive: row.is_active,
    created_at: toISO(row.created_at),
    updated_at: toISO(row.updated_at),
    async save() {
      const res = await query(
        `UPDATE users SET email=$1, username=$2, name=$3, password_hash=$4, google_id=$5,
         role=$6, wallet_balance=$7, updated_at=now(), last_login_at=$8, is_active=$9
         WHERE id=$10 RETURNING *`,
        [user.email, user.username, user.name, user.passwordHash, user.googleId,
         user.role || 'user', user.walletBalance || 0, user.lastLoginAt || null,
         user.isActive !== undefined ? user.isActive : true, user.id]
      );
      const fresh = mapUser(res.rows[0]);
      Object.keys(fresh).forEach((k) => { if (typeof fresh[k] !== 'function') user[k] = fresh[k]; });
      return user;
    },
    toJSON() {
      const { passwordHash, ...rest } = user;
      const out = { ...rest };
      delete out.save;
      delete out.toJSON;
      return out;
    },
  };
  return user;
}

async function findById(id) {
  if (id === null || id === undefined) return null;
  const res = await query('SELECT * FROM users WHERE id = $1', [id]);
  return mapUser(res.rows[0] || null);
}

const COLUMN_MAP = { googleId: 'google_id', passwordHash: 'password_hash', walletBalance: 'wallet_balance', lastLoginAt: 'last_login_at', isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at' };

async function findOne(filter) {
  filter = filter || {};
  const keys = Object.keys(filter);
  if (keys.length === 0) {
    const res = await query('SELECT * FROM users LIMIT 1');
    return mapUser(res.rows[0] || null);
  }
  const clauses = [];
  const params = [];
  keys.forEach((k) => {
    let col = COLUMN_MAP[k] || k;
    if (col === '_id') col = 'id';
    const val = filter[k];
    if (col === 'email' && typeof val === 'string') {
      params.push(val);
      clauses.push(`LOWER(${col}) = LOWER($${params.length})`);
    } else {
      params.push(val);
      clauses.push(`${col} = $${params.length}`);
    }
  });
  const res = await query(`SELECT * FROM users WHERE ${clauses.join(' AND ')} LIMIT 1`, params);
  return mapUser(res.rows[0] || null);
}

async function create(data) {
  data = data || {};
  const res = await query(
    `INSERT INTO users (email, username, name, password_hash, google_id, role, wallet_balance, last_login_at, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.email ? String(data.email).toLowerCase() : null,
      data.username || null,
      data.name || null,
      data.passwordHash || null,
      data.googleId || null,
      data.role || 'user',
      data.walletBalance !== undefined ? data.walletBalance : 0,
      data.lastLoginAt || null,
      data.isActive !== undefined ? data.isActive : true,
    ]
  );
  return mapUser(res.rows[0]);
}

async function countDocuments() {
  const res = await query('SELECT COUNT(*)::int AS count FROM users');
  return res.rows[0].count;
}

module.exports = { findById, findOne, create, countDocuments };
