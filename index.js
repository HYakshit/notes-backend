import express from "express";
import cors from "cors";
import 'dotenv/config'
import products from "./products.js";
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello welcome to home page");
});



app.get("/menu", (req, res) => {
  res.json(products);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
