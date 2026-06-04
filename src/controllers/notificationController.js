const { validationResult } = require('express-validator');

const sseService = require('../services/sseService');
const notificationService = require('../services/notificationService');
const { Notification } = require('../models');

function sseHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

module.exports = {
  stream: async (req, res) => {
    const userId = req.user.id;

    sseHeaders(res);
    res.flushHeaders?.();

    sseService.addConnection(userId, res);

    const heartbeatInterval = Number(process.env.SSE_HEARTBEAT_INTERVAL || 30000);
    const keepAliveInterval = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(keepAliveInterval);
        return;
      }
      res.write(': keep-alive\n\n');
    }, heartbeatInterval);

    await notificationService.sendPendingNotifications(userId);

    req.on('close', () => {
      clearInterval(keepAliveInterval);
      sseService.removeConnection(userId, res);
    });
  },

  list: async (req, res) => {
    const { page, limit } = req.query;
    const result = await notificationService.getUserNotifications(req.user.id, page, limit);
    res.json(result);
  },

  unreadCount: async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  },

  markRead: async (req, res) => {
    const n = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!n) return res.status(404).json({ error: 'Notificação não encontrada' });
    return res.json(n);
  },

  markAllRead: async (req, res) => {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ ok: true });
  },

  remove: async (req, res) => {
    const deleted = await notificationService.deleteNotification(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Notificação não encontrada' });
    return res.json({ ok: true });
  },

  test: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userId, title, body, type, data, event } = req.body;
    const created = await notificationService.createNotification(userId, title, body, type, data, event || 'notification');
    const reloaded = await Notification.findByPk(created.id);
    res.json(reloaded);
  },
};
