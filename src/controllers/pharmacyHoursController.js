const { validationResult } = require('express-validator');
const { PharmacyHours } = require('../models');

function isWithinLunch(nowTime, lunchStart, lunchEnd) {
  if (!lunchStart || !lunchEnd) return false;
  return nowTime >= lunchStart && nowTime <= lunchEnd;
}

module.exports = {
  get: async (req, res) => {
    const rows = await PharmacyHours.findAll({ order: [['day_of_week', 'ASC']] });
    res.json(rows);
  },

  set: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const items = Array.isArray(req.body) ? req.body : [];

    for (const item of items) {
      const [row] = await PharmacyHours.findOrCreate({
        where: { day_of_week: item.day_of_week },
        defaults: item,
      });

      await row.update(item);
    }

    const rows = await PharmacyHours.findAll({ order: [['day_of_week', 'ASC']] });
    res.json(rows);
  },

  status: async (req, res) => {
    const now = new Date();
    const dow = now.getDay();

    const row = await PharmacyHours.findOne({ where: { day_of_week: dow } });
    if (!row || !row.is_open) return res.json({ open: false });

    const hhmmss = now.toTimeString().slice(0, 8);

    const open =
      row.opening_time &&
      row.closing_time &&
      hhmmss >= row.opening_time &&
      hhmmss <= row.closing_time &&
      !isWithinLunch(hhmmss, row.lunch_start, row.lunch_end);

    res.json({ open });
  },

  nextOpening: async (req, res) => {
    const rows = await PharmacyHours.findAll({ order: [['day_of_week', 'ASC']] });
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dow = d.getDay();
      const row = rows.find((r) => r.day_of_week === dow);
      if (!row || !row.is_open || !row.opening_time) continue;

      if (i === 0) {
        const hhmmss = now.toTimeString().slice(0, 8);
        if (hhmmss <= row.opening_time) {
          return res.json({ day_of_week: dow, opening_time: row.opening_time });
        }
      } else {
        return res.json({ day_of_week: dow, opening_time: row.opening_time });
      }
    }

    res.json({ day_of_week: null, opening_time: null });
  },
};
