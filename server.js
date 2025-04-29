const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === "/") {
    // Serve the client.html file
    fs.readFile("./client.html", (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end("Error loading client.html");
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// Handle WebSocket connections
wss.on("connection", (ws) => {
  // Add client to the set
  clients.add(ws);

  console.log("Client connected");

  // Send welcome message to the new client
  ws.send(
    JSON.stringify({
      type: "system",
      message: "Welcome to the chat!",
    })
  );

  // Broadcast to all clients that someone joined
  broadcastMessage({
    type: "system",
    message: "A new user has joined the chat",
  });

  // Handle messages from clients
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // Broadcast the message to all clients
      broadcastMessage({
        type: "chat",
        username: data.username,
        message: data.message,
      });
    } catch (e) {
      console.error("Invalid message format:", e);
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");

    // Broadcast to all clients that someone left
    broadcastMessage({
      type: "system",
      message: "A user has left the chat",
    });
  });
});

// Function to broadcast messages to all clients
function broadcastMessage(message) {
  const messageString = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
