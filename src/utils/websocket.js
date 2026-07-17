const { WebSocketServer } = require("ws");
let wss = null;


/**
 * Initializes the WebSocket server and attaches it to the existing HTTP server.
 * @param {object} server - The HTTP server instance (created by http.createServer)
 */


const initWebSocket = (server) => {

    // Attach WebSocket server directly to our HTTP server
    wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {

        console.log("🟢 Client connected to WebSocket");


        // When the client sends a message to the server
        ws.on("message", (message) => {
            console.log(`📩 Received message from client: ${message}`);
        });


        // When the client disconnects
        ws.on("close", () => {
            console.log("🔴 Client disconnected from WebSocket");
        });


        // When a connection error occurs
        ws.on("error", (error) => {
            console.error(`⚠️ WebSocket connection error: ${error.message}`);
        });
    });

    return wss;
};



/**
 * Sends a message/payload to all currently active connected WebSocket clients.
 * @param {object} data - The data payload to send
 */

const broadcast = (data) => {
    if (!wss) {
        console.warn("⚠️ WebSocket server is not initialized yet!");
        return;
    }

    const payload = JSON.stringify(data);

    // Loop through all connected clients and send the message if they are open
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    })
}

module.exports = {
    initWebSocket,
    broadcast
}