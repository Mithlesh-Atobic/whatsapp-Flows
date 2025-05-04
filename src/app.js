require("dotenv").config();
const express = require("express");
const cors = require("cors");
const whatsappWebhook = require("./routes/whatsappWebhook");
const message = require("./routes/message");
const trelloWebhook = require("./routes/trelloWebhook")

const app = express();
app.use(cors());
app.use(express.json());

app.use("/whatsapp/", whatsappWebhook);
app.use("/", message);
app.use("/",trelloWebhook);
app.use("/", (req, res) => {
  res.status(200).send("Working");
})

app.listen(3000, () => {
    console.log("Server running");
  }); 


  