const { query } = require('../config/db');

function toISO(v) {
  if (v === null || v === undefined) return v;
  if (v instanceof Date) return v.toISOString();
  return v;
}

function mapDividend(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    portfolioItemId: row.portfolio_item_id,
    portfolio_item_id: row.portfolio_item_id,
    amountPerShare: row.amount_per_share === null || row.amount_per_share === undefined ? 0 : Number(row.amount_per_share),
    amount_per_share: row.amount_per_share === null || row.amount_per_share === undefined ? 0 : Number(row.amount_per_share),
    totalAmount: row.total_amount === null || row.total_amount === undefined ? 0 : Number(row.total_amount),
    total_amount: row.total_amount === null || row.total_amount === undefined ? 0 : Number(row.total_amount),
    payableDate: toISO(row.payable_date),
    payable_date: toISO(row.payable_date),
    createdAt: toISO(row.created_at),
    created_at: toISO(row.created_at),
  };
}

async function create(data) {
  data = data || {};
  const portfolioItemId = data.portfolioItemId !== undefined ? data.portfolioItemId : data.portfolio_item_id;
  const res = await query(
    'INSERT INTO dividends (portfolio_item_id, amount_per_share, total_amount, payable_date) VALUES ($1,$2,$3,$4) RETURNING *',
    [portfolioItemId, data.amountPerShare !== undefined ? data.amountPerShare : data.amount_per_share,
     data.totalAmount !== undefined ? data.totalAmount : data.total_amount, data.payableDate || data.payable_date || null]
  );
  return mapDividend(res.rows[0]);
}

module.exports = { create };
