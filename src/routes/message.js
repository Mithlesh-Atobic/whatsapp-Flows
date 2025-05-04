const express = require("express");
const Router = express.Router();
const whatsAppService = require("../services/whatsappService");

Router.post("/issue-reporting", async (req, res) => {
    const { to, templateName } = req.body;
    
    try {
        const response = await whatsAppService.sendTemplate(to, templateName);
        
        res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.response?.data || error.message
        });
    }
});

Router.post('/send-location-request', async (req, res) => {
    try {
        const { phoneNumber, messageText } = req.body;
        
        if (!phoneNumber || !messageText) {
            return res.status(400).json({ error: 'Phone number and message text are required' });
        }
        
        const response = await whatsAppService.sendLocationRequest(phoneNumber, messageText);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send location request' });
    }
});

module.exports = Router;