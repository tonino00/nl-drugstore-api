const { Op } = require('sequelize');
const { Notification } = require('../models');
const sseService = require('./sseService');

class NotificationService {
  constructor() {
    this.pollingTimer = null;
  }

  async createNotification(userId, title, body, type, data = null, eventName = 'notification') {
    const notification = await Notification.create({
      user_id: userId,
      title,
      body,
      type,
      data,
      read: false,
      sent_at: null,
    });

    const sent = sseService.sendNotification(userId, notification.toJSON(), eventName);
    if (sent) {
      await notification.update({ sent_at: new Date() });
    }

    return notification;
  }

  async sendPendingNotifications(userId) {
    const pending = await Notification.findAll({
      where: { user_id: userId, sent_at: null },
      order: [['created_at', 'ASC']],
      limit: 100,
    });

    for (const n of pending) {
      const sent = sseService.sendNotification(userId, n.toJSON(), n.type === 'favorite_restock' ? 'favorite_restock' : 'notification');
      if (sent) {
        await n.update({ sent_at: new Date() });
      }
    }
  }

  async checkPendingNotifications() {
    const pending = await Notification.findAll({
      where: { sent_at: null },
      order: [['created_at', 'ASC']],
      limit: 200,
    });

    for (const n of pending) {
      const event = n.type === 'favorite_restock' ? 'favorite_restock' : n.type === 'sla_warning' ? 'sla_warning' : 'notification';
      const sent = sseService.sendNotification(n.user_id, n.toJSON(), event);
      if (sent) {
        await n.update({ sent_at: new Date() });
      }
    }
  }

  startPolling() {
    const interval = Number(process.env.SSE_POLLING_INTERVAL || 5000);
    if (this.pollingTimer) return;

    this.pollingTimer = setInterval(() => {
      this.checkPendingNotifications().catch(() => null);
    }, interval);
  }

  async markAsRead(notificationId, userId) {
    const n = await Notification.findOne({ where: { id: notificationId, user_id: userId } });
    if (!n) return null;

    await n.update({ read: true });
    return n;
  }

  async markAllAsRead(userId) {
    await Notification.update({ read: true }, { where: { user_id: userId, read: false } });
  }

  async getUserNotifications(userId, page = 1, limit = 20) {
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Math.max(1, Number(limit)));
    const offset = (p - 1) * l;

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: l,
      offset,
    });

    return { count, page: p, limit: l, rows };
  }

  async getUnreadCount(userId) {
    return Notification.count({ where: { user_id: userId, read: false } });
  }

  async deleteNotification(notificationId, userId) {
    return Notification.destroy({ where: { id: notificationId, user_id: userId } });
  }

  async deleteOldNotifications(days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    await Notification.destroy({ where: { created_at: { [Op.lt]: cutoff } } });
  }
}

module.exports = new NotificationService();
