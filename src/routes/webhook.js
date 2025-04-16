const express = require("express");
const Router = express.Router();
const whatsAppService = require("../services/whatsappService");
const { createCard } = require("../services/trelloService");
const { sendIssueAcknowledgment, sendAcknowledgment } = require("../utils/aknowledgement");
const validateWhatsAppMessage = require("../middlewares/validateWhatsappMessage");
const { fetchWhatsAppMedia } = require("../services/mediaService");

const VERIFY_TOKEN = "secret_token";

Router.get('/webhook', (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
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

async function handleInfrastructureIssue(issue_category, issueSubcategory,from) {
    if (issue_category === "infrastructure") {
        const templateMappings = {
            'pothole': 'upload_photo',
            'road_damage': 'upload_photo',
            'new_road_request': 'upload_photo',
            'repair_status': 'upload_photo' 
        };
        const templateName = templateMappings[issueSubcategory] || 'default_confirmation_en';
        await whatsAppService.RoadTemplate(from, templateName);
    }
}

async function handleRoadForm(nfmData, from) {
        try {
            const formattedDesc = `Street Address: ${nfmData.street_address || 'N/A'}\n\n` +
                                  `Landmark: ${nfmData.landmark || 'N/A'}\n\n` +
                                  `City: ${nfmData.city || 'N/A'}\n\n` +
                                  `Zipcode: ${nfmData.zipcode || 'N/A'}\n\n` +
                                  `Additional Information: ${from || 'N/A'}`;
            
            const dummyId = 'Report ID-' + Math.floor(Math.random() * 1000);
            const cardName = `${dummyId} Pothole Complaint`;
            if (nfmData.issue_photos && nfmData.issue_photos.length > 0) {
                const photo = nfmData.issue_photos[0];
                try {
                const filename =  await fetchWhatsAppMedia(photo.id);
                const cardData = {
                    name: cardName,
                    desc: formattedDesc,
                    category: 'infrastructure',
                    imagePath:filename
                };
                const card = await createCard(cardData);
                await sendAcknowledgment(from);
                return card;
                } catch (error) {
                    console.error("Error processing image:", error.message);
                }
            }
        } catch (error) {
            console.error("Error in handleRoadForm:", error.message);
            throw error;
        }
    return null;
}

async function handleNfmReply(from, nfmReply) {
    try {
        const nfmData = JSON.parse(nfmReply.response_json);
        const issueSubcategory = nfmData.issue_subcategory;
        if (nfmData.form_id === "road") {
        await handleRoadForm(nfmData, from);
        }
        await handleInfrastructureIssue(nfmData?.issue_category, issueSubcategory, from);
    } catch (error) {
        console.error("Error handling NFM reply:", error.message);
        await whatsAppService.sendTemplate(from, 'default_confirmation_en');
    }
}

Router.post('/webhook', validateWhatsAppMessage, async (req, res) => {
    try {
        const body = req.body;
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const msgType = message.type;
        
        if (msgType === "text") {
            await handleTextMessage(from, message.text.body.toLowerCase());
        } 
        else if (msgType === "interactive" && message.interactive?.type === "nfm_reply") {
            await handleNfmReply(from, message.interactive.nfm_reply);
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error("Error processing webhook:", error);
        res.sendStatus(200);
    }
});

module.exports = Router;