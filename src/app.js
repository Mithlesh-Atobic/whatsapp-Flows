require("dotenv").config();
const express = require("express");
const webhook = require("./routes/webhook");
const message = require("./routes/message");
const validateWhatsAppMessage = require("./middlewares/validateWhatsappMessage");

const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/",(req, res) => {
  res.status(200).send("working")
})
app.use("/",validateWhatsAppMessage, webhook);
app.use("/", message);

app.listen(3000, () => {
    console.log("Server running");
  }); 