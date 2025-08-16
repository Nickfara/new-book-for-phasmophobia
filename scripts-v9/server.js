// server.js
import express from "express";
import { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

const app = express();
app.use(express.json());

// ===== Хранилища =====
const rooms = {};   // room_id -> {state, clients[]}
const links = {};   // link_id -> {client}

// ===== HTTP API =====

// Создать комнату
app.post("/znlink/create-room/:znid", (req, res) => {
  const room_id = randomUUID();
  rooms[room_id] = { state: req.body ?? {}, clients: [] };
  res.json({ room_id });
});

// Создать линк (для десктопа)
app.post("/znlink/create-link/:znid", (req, res) => {
  const link_id = randomUUID();
  links[link_id] = { client: null };
  res.json({ link_id });
});

// ===== WebSocket =====
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws, request, params) => {
  const { type, id, znid } = params;

  if (type === "room") {
    if (!rooms[id]) rooms[id] = { state: {}, clients: [] };
    rooms[id].clients.push(ws);

    // Отправить текущее состояние новому клиенту
    ws.send(JSON.stringify(rooms[id].state));

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        // Обновляем state, рассылаем остальным
        rooms[id].state = { ...rooms[id].state, ...data };
        for (const client of rooms[id].clients) {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(data));
          }
        }
      } catch (e) {
        console.error("Bad message:", e);
      }
    });

    ws.on("close", () => {
      rooms[id].clients = rooms[id].clients.filter((c) => c !== ws);
    });
  }

  if (type === "link") {
    links[id].client = ws;
    ws.on("message", (msg) => {
      console.log("Message from link", msg.toString());
    });
  }
});

// ===== HTTP Upgrade -> WS =====
import http from "http";
const server = http.createServer(app);

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "https://localhost");
  const path = url.pathname.split("/").filter(Boolean);

  // пример: /phasmolink/link/:znid/:room_id
  if (path[0] === "phasmolink" && path[1] === "link") {
    if (path.length === 4) {
      const znid = path[2];
      const room_id = path[3];
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req, { type: "room", znid, id: room_id });
      });
    }
    if (path.length === 3) {
      const link_id = path[2];
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req, { type: "link", id: link_id });
      });
    }
  }
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
