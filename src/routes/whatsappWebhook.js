const express = require("express");
const Router = express.Router();
const whatsAppService = require("../services/whatsappService");
const { createCard, getCardDetailsAndComments } = require("../services/trelloService");
const { sendAcknowledgment, sendEligibilityResponse } = require("../utils/aknowledgement");
const validateWhatsAppMessage = require("../middlewares/validateWhatsappMessage");
// const { fetchWhatsAppMedia } = require("../services/mediaService");
const { languageCommands } = require("../utils/constants");
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN

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

    const templateName = languageCommands[messageText];
    if (templateName) {
        await whatsAppService.sendTemplate(from, templateName);
    }
}
function getSchemeTitleById(schemeId) {
    const schemes = [
      { id: "ayushman", title: "Health – Ayushman Card" },
      { id: "awas", title: "PM Awas Yojana" },
      { id: "ujjwala", title: "Free LPG – Ujjwala" }
    ];
  
    const scheme = schemes.find(item => item.id === schemeId);
    return scheme ? scheme.title : null;
  }
  async function downloadMediaFromResponse(mediaResponse) {
    try {
        const mediaUrl = mediaResponse.data.url;
        const mimeType = mediaResponse.data.mime_type;
        const fileId = mediaResponse.data.id;
        
        let extension = '';
        if (mimeType) {
            extension = mimeType.split('/')[1];
        }
        
        const filename = `whatsapp_media_${fileId}.${extension || 'bin'}`;
        const absolutePath = path.resolve(filename);
  
        const response = await axios({
            method: 'get',
            url: mediaUrl,
            responseType: 'stream',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
            }
        });
        
        const writer = fs.createWriteStream(absolutePath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve({
                    filename: absolutePath,
                });
            });
            writer.on('error', (err) => {
                fs.unlink(absolutePath, () => reject(err));
            });
        });
    } catch (error) { 
        console.error('Error downloading media:', error);
        throw error;
    }
}
 async  function fetchWhatsAppMedia(mediaId) {
      const WHATSAPP_API_TOKEN = process.env.WHATSAPP_TOKEN;
      
      try {
          const mediaInfoResponse = await axios({
              method: 'GET',
              url: `https://graph.facebook.com/v22.0/${mediaId}`,
              headers: {
                  'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                  'Content-Type': 'application/json'
              }
          });
          const {filename} = await downloadMediaFromResponse(mediaInfoResponse);
          return filename
      } catch (error) { 
          console.error("Error fetching WhatsApp media:", error.message);
          throw error;
      }
  }
async function handleInfrastructureIssue(issue_category, issueSubcategory,from,nfmData) {
    console.log("Handling infrastructure issue...");
    if (issue_category === "Grievances") {
        const templateMappings = {
            'road_damage': 'upload_photo',
            'water_issue':'starter_water',
            'electricity_issue': 'electricity_issue',
            'repair_status': 'upload_photo' 
        };
        const templateName = templateMappings[issueSubcategory] || 'default_confirmation_en';
        if(templateName === "starter_water")
        {
            await whatsAppService.WaterTemplate(from, templateName);
        }
       else if(templateName === "upload_photo")
        {
                  await whatsAppService.RoadTemplate(from, templateName);
        }
        else if(templateName === "electricity_issue")
        {
                  await whatsAppService.ElectricityTemplate(from, templateName);
        }
    }
    else if (issue_category === "revenue_services") {
        const templateMappings = {
            'land_record': 'land_records_en',
        };
        const templateName = templateMappings[issueSubcategory] || 'default_confirmation_en';
        await whatsAppService.RoadTemplate(from, templateName);
    }
    else if(issue_category === "track_grievances")
    {
      if(issueSubcategory === "status")
      {

      await getCardDetailsAndComments(nfmData.complaint_id,from);
      }
      else 
      {
            // feedback
      }
    }
    else if(issue_category === "beneficiary_schemes")
    {
        const scheme = getSchemeTitleById(nfmData.issue_subcategory)
        sendEligibilityResponse(from,scheme,true);
    }
}

async function handleRoadForm(nfmData, from) {
        try {
            const formattedDesc = `From : ${from || 'N/A'}\n\n` +
                                  `Street Address: ${nfmData.street_address || 'N/A'}\n\n` +
                                  `Landmark: ${nfmData.landmark || 'N/A'}\n\n` +
                                  `City: ${nfmData.city || 'N/A'}\n\n` +
                                  `Zipcode: ${nfmData.zipcode || 'N/A'}\n\n` +
                                  `Additional Information: ${nfmData.additional_info || 'N/A'}`;
            
            const dummyId = 'Report ID-' + Math.floor(Math.random() * 1000);
            const cardName = `${dummyId} Road Damage Complaint`;
                if (nfmData.issue_photos && nfmData.issue_photos.length > 0) {
                    const photo = nfmData.issue_photos[0];
                    try {
                    const filename =  await fetchWhatsAppMedia(photo.id);
                    const cardData = {
                        name: cardName,
                        desc: formattedDesc,
                        category: 'road_damage',
                        imagePath:filename
                    };
                    const res = await createCard(cardData);
                    const {id} = res
                    console.log("res",id);
                    await sendAcknowledgment(from, 'road damage',id);
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

async function handleWaterForm(nfmData, from) {
    try {
        const formattedDesc = `From : ${from || 'N/A'}\n\n` +
                              `Street Address: ${nfmData.street_address || 'N/A'}\n\n` +
                              `Landmark: ${nfmData.landmark || 'N/A'}\n\n` +
                              `City: ${nfmData.city || 'N/A'}\n\n` +
                              `Zipcode: ${nfmData.zipcode || 'N/A'}\n\n` +
                              `Additional Information: ${nfmData.additional_info || 'N/A'}`;
        
        const dummyId = 'Report ID-' + Math.floor(Math.random() * 1000);
        const cardName = `${dummyId} Water Supply Complaint`;

                try {
                const cardData = {
                    name: cardName,
                    desc: formattedDesc,
                    category: 'water_supply',
                };
                const res = await createCard(cardData);
                console.log("res",res);
                const {id} = res
                console.log("res",id)
                await sendAcknowledgment(from, 'water supply',id);
                } catch (error) {
                    console.error("Error processing :", error.message);
                }
    } catch (error) {
        console.error("Error in handleWaterForm:", error.message);
        throw error;
    }
return null;
}

async function handlePowerForm(nfmData, from) {
    try {
        const formattedDesc = `From : ${from || 'N/A'}\n\n` +
                              `Street Address: ${nfmData.street_address || 'N/A'}\n\n` +
                              `Landmark: ${nfmData.landmark || 'N/A'}\n\n` +
                              `City: ${nfmData.city || 'N/A'}\n\n` +
                              `Zipcode: ${nfmData.zipcode || 'N/A'}\n\n` +
                              `Additional Information: ${nfmData.additional_info || 'N/A'}`;
        
        const dummyId = 'Report ID-' + Math.floor(Math.random() * 1000);
        const cardName = `${dummyId} Electricity Supply Complaint`;
            if (nfmData.issue_photos && nfmData.issue_photos.length > 0) {
                const photo = nfmData.issue_photos[0];
                try {
                const filename =  await fetchWhatsAppMedia(photo.id);
                const cardData = {
                    name: cardName,
                    desc: formattedDesc,
                    category: 'electricity_issue',
                    imagePath:filename
                };
                const res = await createCard(cardData);
                const {id} = res
                console.log("res",id);
                await sendAcknowledgment(from, 'Electricity Fault',id);
                } catch (error) {
                    console.error("Error processing image:", error.message);
                }
            }
            else {
                const cardData = {
                    name: cardName,
                    desc: formattedDesc,
                    category: 'electricity_issue',
                };
                const res = await createCard(cardData);
                const {id} = res
                console.log("res",id);
                await sendAcknowledgment(from, 'Electricity',id);
            }
    } catch (error) {
        console.error("Error in handlePowerForm:", error.message);
        throw error;
    }
return null;
}

async function handleBenifitForm(nfmData, from) {
    try {
        const formattedDesc = `From : ${from || 'N/A'}\n\n` +
                              `Street Address: ${nfmData.street_address || 'N/A'}\n\n` +
                              `Landmark: ${nfmData.landmark || 'N/A'}\n\n` +
                              `City: ${nfmData.city || 'N/A'}\n\n` +
                              `Zipcode: ${nfmData.zipcode || 'N/A'}\n\n` +
                              `Additional Information: ${nfmData.additional_info || 'N/A'}`;
        
        const dummyId = 'Report ID-' + Math.floor(Math.random() * 1000);
        const cardName = `${dummyId} Electricity Supply Complaint`;
            if (nfmData.issue_photos && nfmData.issue_photos.length > 0) {
                const photo = nfmData.issue_photos[0];
                try {
                const filename =  await fetchWhatsAppMedia(photo.id);
                const cardData = {
                    name: cardName,
                    desc: formattedDesc,
                    category: 'electricity_issue',
                    imagePath:filename
                };
                const res = await createCard(cardData);
                const {id} = res
                console.log("res",id);
                await sendAcknowledgment(from, 'Electricity Fault',id);
                } catch (error) {
                    console.error("Error processing image:", error.message);
                }
            }
            else {
                const cardData = {
                    name: cardName,
                    desc: formattedDesc,
                    category: 'electricity_issue',
                };
                const res = await createCard(cardData);
                const {id} = res
                console.log("res",id);
                await sendAcknowledgment(from, 'Electricity',id);
            }
    } catch (error) {
        console.error("Error in handlePowerForm:", error.message);
        throw error;
    }
return null;
}

async function handleNfmReply(from, nfmReply) {
    try {
        const nfmData = JSON.parse(nfmReply.response_json);
        const issueSubcategory = nfmData.issue_subcategory;
        console.log("NFM reply data:", nfmData);
        if (nfmData.form_id === "road") {
        await handleRoadForm(nfmData, from);
        }
        if(nfmData.form_id === "utility_complaint")
        {
        await handleWaterForm(nfmData, from);
        }
        if(nfmData.form_id === "power_complaint")
        {
        await handlePowerForm(nfmData,from);
        }
        if(nfmData.form_id === "beneficiary_schemes")
        {
            await handleBenifitForm(nfmData,from);
        }
        await handleInfrastructureIssue(nfmData?.issue_category, issueSubcategory, from,nfmData);
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