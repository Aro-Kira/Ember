class EventBus {
  constructor() {
    this.clients = new Map();
  }

  addClient(userId, res) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);
  }

  removeClient(userId, res) {
    const set = this.clients.get(userId);
    if (set) {
      set.delete(res);
      if (set.size === 0) this.clients.delete(userId);
    }
  }

  broadcast(eventType, data) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [, clients] of this.clients) {
      for (const res of clients) {
        res.write(message);
      }
    }
  }
}

export const eventBus = new EventBus();
export default eventBus;
