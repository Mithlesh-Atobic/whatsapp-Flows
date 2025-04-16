const express = require("express");
const Router = express.Router();
const whatsAppService = require("../services/whatsappService");
const {createCard} = require("../services/trelloService");
const {sendIssueAcknowledgment, sendAcknowledgment} = require("../utils/aknowledgement");
// Constants
const VERIFY_TOKEN = "secret_token";
// Verify Webhook (GET)
Router.get('/webhook', (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
});


async function handleTextMessage(from, messageText) {
    const languageCommands = {
        "hi": "issue_reporting_en",
        "en": "issue_reporting_en",
        "hin": "issue_reporting_hin"
    };
    
    const templateName = languageCommands[messageText];
    if (templateName) {
        await whatsAppService.sendTemplate(from, templateName);
    }
}

async function handleInfrastructureIssue(issue_category, issueSubcategory, nfmData, from) {
  if (issue_category === "infrastructure") {
      const templateMappings = {
          'pothole': 'upload_photo',
          'road_damage': 'upload_photo',
          'new_road_request': 'upload_photo',
          'repair_status': 'upload_photo' 
      };
      
      const templateName = templateMappings[issueSubcategory] || 'default_confirmation_en';
      const response = await whatsAppService.RoadTemplate(from, templateName);
      console.log("Road template sent:", response);
    }
     
}

async function handleNfmReply(from, nfmReply) {
    try {
        const nfmData = JSON.parse(nfmReply.response_json);
        const issueSubcategory = nfmData.issue_subcategory;
        if (nfmData.form_id === "road") {
          const formattedDesc = `Street Address: ${nfmData.street_address || 'N/A'}\n\n` +
                                `Landmark: ${nfmData.landmark || 'N/A'}\n\n` +
                                `City: ${nfmData.city || 'N/A'}\n\n` +
                                `Zipcode: ${nfmData.zipcode || 'N/A'}\n\n` +
                                `Additional Information: ${nfmData.additional_info || 'N/A'}`;
          

          const dummyId = 'Report ID-' + Math.floor(Math.random() * 1000);
          const cardName = `${dummyId} Pothole Complaint`;
          
          await createCard({
              name: cardName,
              desc: formattedDesc,
              category: 'infrastructure'
          }).then((card) => {

              sendAcknowledgment(from);
          }).catch(error => {
              console.error("Error creating Trello card:", error);
          });
      }
        
        await handleInfrastructureIssue(nfmData?.issue_category, issueSubcategory, nfmData, from);
    } catch (error) {
        await whatsAppService.sendTemplate(from, 'default_confirmation_en');
    }
}

// Handle webhook events (POST)
Router.post('/webhook', async (req, res) => {
    const body = req.body;


    try {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const msgType = message.type;
        
        console.log(`New message from ${from}:`, message);
        let contextId = null;
        if (message.context && message.context.id) {
            contextId = message.context.id;
        }
        
        if (msgType === "text") {
            await handleTextMessage(from, message.text.body.toLowerCase());
        } 
        else if (msgType === "interactive") {
            if (message.interactive?.type === "nfm_reply") {
                await handleNfmReply(from, message.interactive.nfm_reply, contextId);
            }
        } 
        res.sendStatus(200);
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.sendStatus(200); 
    }
});

module.exports = Router;