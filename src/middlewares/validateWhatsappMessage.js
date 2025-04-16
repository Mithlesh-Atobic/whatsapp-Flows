function validateWhatsAppMessage(req, res, next) {
    if(!req.body) {
        return res.sendStatus(200);
    }
    const body = req.body;

    const isValid =
        body.object === "whatsapp_business_account" &&
        body.entry &&
        Array.isArray(body.entry) &&
        body.entry[0]?.changes &&
        Array.isArray(body.entry[0].changes) &&
        body.entry[0].changes[0]?.value &&
        body.entry[0].changes[0].value.messages;

    if (!isValid) {
        return res.sendStatus(200); 
    }
    
    next();
}

module.exports = validateWhatsAppMessage;
