const axios = require("axios");

const config = {
  token: process.env.WHATSAPP_TOKEN,
  phoneNumberId: process.env.PHONE_NUMBER_ID,
  get graphApiUrl() {
    return `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
  },
  getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json"
    };
  }
};

const apiClient = axios.create();

async function sendTemplate(to, templateName, data = {}) {
  try {
    const languageCode = templateName.includes("_hin") ? "hi" : "en_US";
    
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: "https://nlcbharat.org/wp-content/uploads/2024/02/Uttarakhand.png"
                }
              }
            ]
          },
          {
            type: "button",
            sub_type: "flow",
            index: "0",
            parameters: [
              {
                type: "text",
                text: "your_flow_token"
              }
            ]
          }
        ]
      }
    };
    
    // Optional: Add dynamic components based on data
    if (data && Object.keys(data).length > 0) {
      // Add logic to customize template based on data
    }
    
    const response = await apiClient.post(
      config.graphApiUrl, 
      payload, 
      { headers: config.getHeaders() }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error sending template:", error.response?.data || error.message);
    throw error;
  }
}

async function RoadTemplate(to, templateName, data = {}) {
    try { 
      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en_US"},
          components: [
            {
              type: "button",
              sub_type: "flow",
              index: "0",
              parameters: [
                {
                  type: "text",
                  text: "your_flow_token"
                }
              ]
            }
          ]
        }
      };
      
      // Optional: Add dynamic components based on data
      if (data && Object.keys(data).length > 0) {
        // Add logic to customize template based on data
      }
      
      const response = await apiClient.post(
        config.graphApiUrl, 
        payload, 
        { headers: config.getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error sending template:", error.response?.data || error.message);
      throw error;
    }
  }

async function sendLocationRequest(phoneNumber, messageText) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      type: "interactive",
      to: phoneNumber,
      interactive: {
        type: "location_request_message",
        body: {
          text: messageText
        },
        action: {
          name: "send_location"
        }
      }
    };
    
    const response = await apiClient.post(
      config.graphApiUrl, 
      payload, 
      { headers: config.getHeaders() }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error sending location request:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  sendTemplate,
  sendLocationRequest,
  RoadTemplate
};