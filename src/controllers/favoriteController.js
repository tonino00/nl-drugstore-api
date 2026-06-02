const { Favorite, Medicine } = require('../models');

module.exports = {
  add: async (req, res) => {
    const medicine = await Medicine.findByPk(req.params.medicineId);
    if (!medicine || !medicine.active) return res.status(404).json({ error: 'Medicamento não encontrado' });

    const [fav] = await Favorite.findOrCreate({
      where: { user_id: req.user.id, medicine_id: medicine.id },
      defaults: { notify_on_restock: true },
    });

    res.status(201).json(fav);
  },

  remove: async (req, res) => {
    const deleted = await Favorite.destroy({ where: { user_id: req.user.id, medicine_id: req.params.medicineId } });
    if (!deleted) return res.status(404).json({ error: 'Favorito não encontrado' });
    res.json({ ok: true });
  },

  list: async (req, res) => {
    const rows = await Favorite.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Medicine }],
      order: [['created_at', 'DESC']],
    });

    res.json(rows);
  },

  enableNotify: async (req, res) => {
    const fav = await Favorite.findOne({ where: { user_id: req.user.id, medicine_id: req.params.medicineId } });
    if (!fav) return res.status(404).json({ error: 'Favorito não encontrado' });

    await fav.update({ notify_on_restock: true });
    res.json(fav);
  },
};
