const express = require("express");
const Router = express.Router();
const axios = require('axios');
const { sendIssueResolvedAcknowledgment } = require("../utils/aknowledgement");
Router.post('/trello-webhook', async (req, res) => {
  res.status(200).send('OK');
  const action = req.body.action;
  console.log(action)
  if (action?.type === 'updateCard' && action.data?.card?.id) {
    const cardId = action.data.card.id;
    if (action.data.listBefore && action.data.listAfter) {
      console.log(`Card moved from "${action.data.listBefore.name}" to "${action.data.listAfter.name}"`);
    }

    try {
      const response = await axios.get(`https://api.trello.com/1/cards/${cardId}`, {
        params: {
          key: process.env.TRELLO_KEY,
          token: process.env.TRELLO_TOKEN,
        },
      });

      const card = response.data;
      const id = card.id;
      const cardDescription = card.desc;
      console.log(response.data)
      const match = cardDescription.match(/From\s*:\s*(\d+)/);
      const cardName = card.name;
      const issueMatch = cardName.match(/Report ID-\d+\s+(.+)/i);
        let message = "";
      if (issueMatch && issueMatch[1]) {
         message = `regarding ${issueMatch[1].trim()}`;
      } else {
        console.log("Could not extract issue name from:", cardName);
      }
      const fromNumber = match ? match[1] : null; 
      if (!fromNumber) {
        console.error('Failed to extract phone number from card description');
        return;
      } 
      sendIssueResolvedAcknowledgment(fromNumber,message,id)
    } catch (error) {
      console.error('Failed to fetch card details:', error.message);
    }
  }
});

Router.get('/trello-webhook', (req, res) => {
  res.status(200).send('Webhook setup check');
});
module.exports = Router;
