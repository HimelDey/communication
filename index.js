import app from "./app.js";
import * as dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";

import chatRouter from "./src/routes/chat_route.js";
import websocket from "./helper/WebSockets.js";
dotenv.config();
const PORT = process.env.PORT || 12500;

const server = createServer(app);
server.listen(PORT, () => {
  console.log('listening on *:'+ PORT);
});

global.io = new Server(server, {
  cors: {
    origin: "*",
  },
});
global.io.on("connection", websocket.connection);

export default io;
