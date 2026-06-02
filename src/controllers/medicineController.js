const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

const { Medicine, StockMovement, Favorite } = require('../models');
const notificationService = require('../services/notificationService');

module.exports = {
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const medicine = await Medicine.create(req.body);

    res.status(201).json(medicine);
  },

  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine || !medicine.active) return res.status(404).json({ error: 'Medicamento não encontrado' });

    await medicine.update(req.body);
    res.json(medicine);
  },

  movements: async (req, res) => {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const medicine = await Medicine.findByPk(id);
    if (!medicine) return res.status(404).json({ error: 'Medicamento não encontrado' });

    const { rows, count } = await StockMovement.findAndCountAll({
      where: { medicine_id: id },
      include: [{ model: require('../models').User, attributes: ['id', 'nome', 'email'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      movements: rows,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  },

  softDelete: async (req, res) => {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) return res.status(404).json({ error: 'Medicamento não encontrado' });

    await medicine.update({ active: false });
    res.json({ ok: true });
  },

  updateStock: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { delta, motivo, observacao } = req.body;

    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine || !medicine.active) return res.status(404).json({ error: 'Medicamento não encontrado' });

    const before = medicine.quantidade;
    const after = Math.max(0, before + Number(delta));

    await medicine.update({ quantidade: after });

    await StockMovement.create({
      medicine_id: medicine.id,
      tipo: Number(delta) >= 0 ? 'entrada' : 'saida',
      quantidade: Math.abs(Number(delta)),
      motivo,
      observacao,
      usuario_id: req.user.id,
    });

    if (before === 0 && after > 0) {
      const favorites = await Favorite.findAll({ where: { medicine_id: medicine.id, notify_on_restock: true } });
      for (const f of favorites) {
        await notificationService.createNotification(
          f.user_id,
          'Medicamento disponível',
          `${medicine.nome} voltou ao estoque (${after} unidades)`,
          'favorite_restock',
          { medicine_id: medicine.id, medicine_name: medicine.nome, available_quantity: after },
          'favorite_restock'
        );
      }
    }

    if (after < medicine.quantidade_minima) {
      await notificationService.createNotification(
        req.user.id,
        'Estoque abaixo do mínimo',
        `${medicine.nome} está com ${after} unidades (mínimo ${medicine.quantidade_minima})`,
        'sla_warning',
        { medicine_id: medicine.id, current: after, minimum: medicine.quantidade_minima },
        'sla_warning'
      );
    }

    res.json(medicine);
  },

  listPublic: async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));

    const { count, rows } = await Medicine.findAndCountAll({
      where: { active: true },
      order: [['nome', 'ASC']],
      limit: l,
      offset: (p - 1) * l,
    });

    res.json({ count, page: p, limit: l, rows });
  },

  search: async (req, res) => {
    const { q, categoria } = req.query;

    const where = { active: true };
    if (categoria) where.categoria = categoria;
    if (q) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${q}%` } },
        { principio_ativo: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const rows = await Medicine.findAll({ where, order: [['nome', 'ASC']], limit: 100 });
    res.json(rows);
  },

  categories: async (req, res) => {
    const rows = await Medicine.findAll({
      where: { active: true, categoria: { [Op.not]: null } },
      attributes: ['categoria'],
      group: ['categoria'],
      order: [['categoria', 'ASC']],
    });
    res.json(rows.map((r) => r.categoria).filter(Boolean));
  },

  detail: async (req, res) => {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine || !medicine.active) return res.status(404).json({ error: 'Medicamento não encontrado' });
    res.json(medicine);
  },

  expiring: async (req, res) => {
    const days = Number(req.query.days || 7);
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const rows = await Medicine.findAll({
      where: {
        active: true,
        validade: { [Op.lte]: cutoff },
      },
      order: [['validade', 'ASC']],
      limit: 200,
    });

    res.json(rows);
  },

  lowStock: async (req, res) => {
    const rows = await Medicine.findAll({
      where: {
        active: true,
        quantidade: { [Op.lt]: { [Op.col]: 'quantidade_minima' } },
      },
      order: [['quantidade', 'ASC']],
      limit: 200,
    });

    res.json(rows);
  },
};
