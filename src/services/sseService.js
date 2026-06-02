class SseService {
  constructor() {
    this.connections = new Map();
  }

  addConnection(userId, res) {
    const key = String(userId);
    if (!this.connections.has(key)) {
      this.connections.set(key, new Set());
    }

    this.connections.get(key).add(res);
  }

  removeConnection(userId, res) {
    const key = String(userId);
    const set = this.connections.get(key);
    if (!set) return;

    if (res) set.delete(res);
    if (!res || set.size === 0) this.connections.delete(key);
  }

  sendEvent(res, event, data) {
    if (res.writableEnded) return false;

    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  }

  sendNotification(userId, notification, event = 'notification') {
    const key = String(userId);
    const set = this.connections.get(key);
    if (!set || set.size === 0) return false;

    let anySent = false;
    for (const res of set) {
      const sent = this.sendEvent(res, event, notification);
      anySent = anySent || sent;
    }

    return anySent;
  }

  broadcastToAdmins(notification) {
    for (const [, set] of this.connections.entries()) {
      for (const res of set) {
        this.sendEvent(res, 'notification', notification);
      }
    }
  }

  broadcastToAll(notification) {
    for (const [, set] of this.connections.entries()) {
      for (const res of set) {
        this.sendEvent(res, 'notification', notification);
      }
    }
  }
}

module.exports = new SseService();
