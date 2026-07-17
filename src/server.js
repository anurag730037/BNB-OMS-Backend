require("dotenv").config();

const http = require("http");

const { initWebSocket } = require("./utils/websocket");

const app = require("./app");
const connectDB = require("./config/db");



const PORT = process.env.PORT || 5000;

connectDB();

// 3. Create a raw HTTP server wrapping our Express application
const server = http.createServer(app);

// 4. Initialize our WebSocket Server and attach it to the HTTP server
initWebSocket(server);


// 5. Start listening to the raw server (instead of app.listen)
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})