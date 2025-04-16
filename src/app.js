require("dotenv").config();
const express = require("express");
const webhook = require("./routes/webhook");
const message = require("./routes/message");

const cors = require("cors");
const { watchForCompletedCards } = require("./services/trelloService");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", webhook);
app.use("/", message);

const axios = require('axios');
require('dotenv').config(); // if using .env for TRELLO_KEY and TRELLO_TOKEN

app.post('/trello-webhook', async (req, res) => {
  // console.log('Webhook received:', JSON.stringify(req.body, null, 2));

  // Respond quickly to Trello
  res.status(200).send('OK');

  const action = req.body.action;

  // Check if it's an updateCard action and card info is present
  if (action?.type === 'updateCard' && action.data?.card?.id) {
    const cardId = action.data.card.id;

    // Optional: Check for list movement
    if (action.data.listBefore && action.data.listAfter) {
      console.log(`Card moved from "${action.data.listBefore.name}" to "${action.data.listAfter.name}"`);
    }

    try {
      // Fetch full card details including description
      const response = await axios.get(`https://api.trello.com/1/cards/${cardId}`, {
        params: {
          key: process.env.TRELLO_KEY,
          token: process.env.TRELLO_TOKEN,
        },
      });

      const card = response.data;

      console.log(`Card Name: ${card.name}`);
      console.log(`Card Description: ${card.desc}`);
      console.log(`Card URL: ${card.shortUrl}`);

      // Do something with the description here (e.g., trigger WhatsApp message)

    } catch (error) {
      console.error('Failed to fetch card details:', error.message);
    }
  }
});


app.get('/trello-webhook', (req, res) => {
  res.status(200).send('Webhook setup check');
});




app.listen(3000, () => {
    console.log("Server running");
  }); 


  