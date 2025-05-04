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

function generateComplaintId(phoneNumber) {
  return `UT-RD-${phoneNumber}`;
}

async function sendAcknowledgment(phoneNumber, issueType,complaintId) {
  try {   let string = "We appreciate your effort in helping us improve."
    if(issueType === 'road damage'){
     string = "We appreciate your effort in helping us improve road safety and infrastructure across Uttarakhand."
    }
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        body: `📩 Report Acknowledged – Thank You!\n\nYour submission regarding ${issueType} has been successfully received by the [Department of Public Works, Government of Uttarakhand].\n\n📝 Complaint ID: #${complaintId}\n(Kindly reference this ID for any future communication.)\n\n${string} Together, we build a better Devbhoomi. 🙏\n\n— Government of Uttarakhand 🏔️`
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

async function sendIssueResolvedAcknowledgment(phoneNumber, issueType,id) {
  try {
    const complaintId = generateComplaintId(phoneNumber);
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber, 
      type: "text",
      text: {
        body: `✅ Issue Resolved – Action Completed!\n\nWe are pleased to inform you that your reported issue ${issueType} has been successfully resolved by the Department of Public Works, Government of Uttarakhand.\n\n📝 Complaint ID: #${id}\n\nThank you for your valuable contribution to maintaining the infrastructure of Uttarakhand. Your vigilance helps us serve our citizens better. We welcome your feedback on the resolution process.\n\n— Government of Uttarakhand 🏔️`
      } 
    };
    
    const response = await axios.post(
      config.graphApiUrl,
      payload,
      { headers: config.getHeaders() }
    );
    
    console.log(`Resolution acknowledgment sent to ${phoneNumber} for complaint: ${complaintId}`);
    return {
      success: true,
      complaintId,
      messageId: response.data.messages?.[0]?.id,
      response: response.data
    };
  } catch (error) {
    console.error("Error sending resolution acknowledgment:", error.response?.data || error.message);
  }
}
async function sendIssueCompletionNotice(phoneNumber, issueType) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        body: `✅ Status Update – Issue Marked as Completed\n\nYour reported issue regarding ${issueType} has been marked as *completed* and is considered *resolved* by the Department of Public Works, Government of Uttarakhand.\n\nThank you for helping us maintain the public infrastructure. Your participation is greatly valued.\n\n— Government of Uttarakhand 🏔️`
      }
    };

    const response = await axios.post(
      config.graphApiUrl,
      payload,
      { headers: config.getHeaders() }
    );

    console.log(`Completion notice sent to ${phoneNumber} for issue: ${issueType}`);
    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
      response: response.data
    };
  } catch (error) {
    console.error("Error sending issue completion notice:", error.response?.data || error.message);
  }
}
async function sendInvalidComplaintNotice(phoneNumber) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        body: `⚠️ Invalid Complaint ID\n\nThe complaint ID you provided appears to be *invalid* or not found in our system. Please double-check the ID and try again.\n\nIf the issue persists, feel free to contact our support team or submit a new complaint.\n\n— Government of Uttarakhand 🏔️`
      }
    };

    const response = await axios.post(
      config.graphApiUrl,
      payload,
      { headers: config.getHeaders() }
    );

    console.log(`Invalid complaint notice sent to ${phoneNumber}`);
    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
      response: response.data
    };
  } catch (error) {
    console.error("Error sending invalid complaint notice:", error.response?.data || error.message);
  }
}
async function sendInProgressNotice(phoneNumber, issueType) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        body: `🕒 Update – Issue Under Progress\n\nYour reported issue regarding ${issueType} is currently *under progress*. Our teams are actively working on resolving it.\n\nWe appreciate your patience and assure you that it is being handled with priority.\n\n— Government of Uttarakhand 🏔️`
      }
    };

    const response = await axios.post(
      config.graphApiUrl,
      payload,
      { headers: config.getHeaders() }
    );

    console.log(`In-progress notice sent to ${phoneNumber} for issue: ${issueType}`);
    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
      response: response.data
    };
  } catch (error) {
    console.error("Error sending in-progress notice:", error.response?.data || error.message);
  }
}
async function sendEligibilityResponse(phoneNumber, schemeName, isEligible) {
  try {
    const eligibilityText = isEligible
      ? `✅ Good news! You are *eligible* for the "${schemeName}" scheme. 🎉\n\nOur team will reach out to you soon with the next steps.`
      : `⚠️ Unfortunately, you are *not eligible* for the "${schemeName}" scheme based on the current information provided.\n\nIf you believe this is incorrect, you may re-verify your details or contact support.`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        body: `📋 Eligibility Check – ${schemeName}\n\n${eligibilityText}\n\n— Government of Uttarakhand 🏔️`
      }
    };

    const response = await axios.post(
      config.graphApiUrl,
      payload,
      { headers: config.getHeaders() }
    );

    console.log(`Eligibility message sent to ${phoneNumber} for scheme: ${schemeName}`);
    return {
      success: true,
      messageId: response.data.messages?.[0]?.id,
      response: response.data
    };
  } catch (error) {
    console.error("Error sending eligibility message:", error.response?.data || error.message);
  }
}


module.exports = {
  sendAcknowledgment,
  sendIssueResolvedAcknowledgment,
  sendIssueCompletionNotice,
  sendInvalidComplaintNotice,
  sendInProgressNotice,
  sendEligibilityResponse
};