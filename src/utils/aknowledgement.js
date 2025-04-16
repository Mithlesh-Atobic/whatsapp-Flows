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

// Generate a complaint ID
function generateComplaintId() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const sequenceNum = String(Math.floor(Math.random() * 999) + 1).padStart(5, '0');
  
  return `UT-RD-${year}${month}${day}-${sequenceNum}`;
}
async function sendAcknowledgment(phoneNumber, issueType = 'road damage') {
  try {
    const complaintId = generateComplaintId();
    
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        body: `📩 Report Acknowledged – Thank You!\n\nYour submission regarding ${issueType} has been successfully received by the [Department of Public Works, Government of Uttarakhand].\n\n📝 Complaint ID: #${complaintId}\n(Kindly reference this ID for any future communication.)\n\nWe appreciate your effort in helping us improve road safety and infrastructure across Uttarakhand. Together, we build a better Devbhoomi. 🙏\n\n— Government of Uttarakhand 🏔️`
      }
    };
    
    const response = await axios.post(
      config.graphApiUrl,
      payload,
      { headers: config.getHeaders() }
    );
    
    console.log(`Acknowledgment sent to ${phoneNumber} with ID: ${complaintId}`);
    return {
      success: true,
      complaintId,
      messageId: response.data.messages?.[0]?.id,
      response: response.data
    };
  } catch (error) {
    console.error("Error sending acknowledgment:", error.response?.data || error.message);
    throw error;
  }
}

async function sendIssueAcknowledgment(phoneNumber, options = {}) {

  const {
    issueType = 'road damage',
    department = 'Department of Public Works',
    complaintId = generateComplaintId()
  } = options;
  
  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        body: `📩 Report Acknowledged – Thank You!\n\nYour submission regarding ${issueType} has been successfully received by the [${department}, Government of Uttarakhand].\n\n📝 Complaint ID: #${complaintId}\n(Kindly reference this ID for any future communication.)\n\nWe appreciate your effort in helping us improve road safety and infrastructure across Uttarakhand. Together, we build a better Devbhoomi. 🙏\n\n— Government of Uttarakhand 🏔️`
      }
    };
    
    const response = await axios.post(
      config.graphApiUrl,
      payload,
      { headers: config.getHeaders() }
    );
    
    return {
      success: true,
      complaintId,
      messageId: response.data.messages?.[0]?.id,
      response: response.data
    };
  } catch (error) {
    console.error("Error sending acknowledgment:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  sendAcknowledgment,
  sendIssueAcknowledgment,
  generateComplaintId
};