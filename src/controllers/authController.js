const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const { User, PasswordReset } = require('../models');
const generateToken = require('../utils/generateToken');
const emailService = require('../services/emailService');

module.exports = {
  register: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, email, senha, telefone } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email já cadastrado' });

    const hashed = await bcrypt.hash(senha, 10);
    const user = await User.create({ nome, email, senha: hashed, telefone, role: 'user' });

    const token = generateToken({ id: user.id, role: user.role });
    res.status(201).json({ token });
  },

  login: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, senha } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !user.active) return res.status(401).json({ error: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    await user.update({ last_login: new Date() });

    const token = generateToken({ id: user.id, role: user.role });

    const isProd = process.env.NODE_ENV === 'production';

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,       // true em produção (HTTPS)
      sameSite: isProd ? 'none' : 'lax', // 'none' para cross-origin em produção
      path: '/',            // ← ESSENCIAL: para todas as rotas
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Response sem token (frontend não deve ter acesso)
    res.json({ user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
  },

  logout: async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
    res.json({ ok: true });
  },

  me: async (req, res) => {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['senha'] } });
    res.json(user);
  },

  updateProfile: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, telefone, avatar_url, notification_enabled } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    await user.update({
      nome: nome ?? user.nome,
      telefone: telefone ?? user.telefone,
      avatar_url: avatar_url ?? user.avatar_url,
      notification_enabled: typeof notification_enabled === 'boolean' ? notification_enabled : user.notification_enabled,
    });

    const sanitized = await User.findByPk(req.user.id, { attributes: { exclude: ['senha'] } });
    res.json(sanitized);
  },

  changePassword: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    const ok = await bcrypt.compare(currentPassword, user.senha);
    if (!ok) return res.status(400).json({ error: 'Senha atual incorreta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ senha: hashed });

    res.json({ ok: true });
  },

  forgotPassword: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordReset.create({ user_id: user.id, token, expires_at: expiresAt });

    await emailService.sendPasswordReset(email, token);

    res.json({ ok: true });
  },

  verifyResetToken: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token } = req.body;
    const pr = await PasswordReset.findOne({ where: { token } });

    if (!pr) return res.status(404).json({ valid: false });
    if (pr.used_at) return res.status(400).json({ valid: false });
    if (new Date(pr.expires_at).getTime() < Date.now()) return res.status(400).json({ valid: false });

    return res.json({ valid: true });
  },

  resetPassword: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, newPassword } = req.body;
    const pr = await PasswordReset.findOne({ where: { token } });

    if (!pr) return res.status(404).json({ error: 'Token inválido' });
    if (pr.used_at) return res.status(400).json({ error: 'Token já usado' });
    if (new Date(pr.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'Token expirado' });

    const user = await User.findByPk(pr.user_id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ senha: hashed });
    await pr.update({ used_at: new Date() });

    res.json({ ok: true });
  },
};
