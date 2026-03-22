import "./instrument.js";
import 'dotenv/config';
import app from "./src/app.js";
import connectMongo from "./src/config/mongo.js";

import http from 'http';
import initializeSocket from "./src/socket/index.js";

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and then start server
connectMongo().then(() => {
  const server = http.createServer(app);
  
  // Initialize Socket.io
  initializeSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
});
