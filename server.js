const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');

const PORT = Number(process.env.YJS_WS_PORT || process.env.PORT || 1234);
const HOST = process.env.YJS_WS_HOST || '0.0.0.0';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

const docs = new Map();

class WSSharedDoc extends Y.Doc {
  constructor(name) {
    super();
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);

    this.on('update', (update, origin) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      const message = encoding.toUint8Array(encoder);

      this.conns.forEach((_, conn) => {
        if (conn !== origin && conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });
    });

    this.awareness.on('update', ({ added, updated, removed }, origin) => {
      const changedClients = added.concat(updated, removed);

      if (origin && this.conns.has(origin)) {
        const controlledIds = this.conns.get(origin);
        added.concat(updated).forEach((clientId) => controlledIds.add(clientId));
        removed.forEach((clientId) => controlledIds.delete(clientId));
      }

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients));
      const message = encoding.toUint8Array(encoder);

      this.conns.forEach((_, conn) => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });
    });
  }
}

const getDoc = (roomName) => {
  const existing = docs.get(roomName);
  if (existing) {
    return existing;
  }

  const doc = new WSSharedDoc(roomName);
  docs.set(roomName, doc);
  return doc;
};

const closeConnection = (doc, conn) => {
  const controlledIds = doc.conns.get(conn) || new Set();
  doc.conns.delete(conn);

  awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);

  if (doc.conns.size === 0) {
    docs.delete(doc.name);
  }
};

const setupWSConnection = (conn, req) => {
  const roomName = decodeURIComponent((req.url || '/').slice(1).split('?')[0] || 'default-room');
  const doc = getDoc(roomName);

  doc.conns.set(conn, new Set());

  conn.binaryType = 'arraybuffer';

  const syncStep1 = encoding.createEncoder();
  encoding.writeVarUint(syncStep1, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncStep1, doc);
  conn.send(encoding.toUint8Array(syncStep1));

  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
    );
    conn.send(encoding.toUint8Array(awarenessEncoder));
  }

  conn.on('message', (data) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const messageType = decoding.readVarUint(decoder);

    if (messageType === MESSAGE_SYNC) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);

      syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

      const syncReply = encoding.toUint8Array(encoder);
      if (syncReply.length > 1 && conn.readyState === WebSocket.OPEN) {
        conn.send(syncReply);
      }
      return;
    }

    if (messageType === MESSAGE_AWARENESS) {
      const update = decoding.readVarUint8Array(decoder);
      awarenessProtocol.applyAwarenessUpdate(doc.awareness, update, conn);
    }
  });

  conn.on('close', () => {
    closeConnection(doc, conn);
  });

  conn.on('error', () => {
    closeConnection(doc, conn);
    conn.close();
  });
};

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs websocket server is running.\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req);
});

server.listen(PORT, HOST, () => {
  console.log(`Yjs websocket server running at ws://${HOST}:${PORT}`);
});
