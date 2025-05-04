const axios = require("axios");
const fs = require('fs');
const FormData = require('form-data');
const { sendIssueResolvedAcknowledgment, sendIssueCompletionNotice, sendInProgressNotice, sendInvalidComplaintNotice } = require("../utils/aknowledgement");

const config = {
  key: process.env.TRELLO_KEY,
  token: process.env.TRELLO_TOKEN ,
  baseUrl: "https://api.trello.com/1",
  boardId: "681499b5b95209fa57e3c224",
  listIds: {
    "road_damage": "681499b5b95209fa57e3c220",
    "water_supply": "681499b5b95209fa57e3c221",
    "education": "67fde964ed057e757b05aa32",
    "electricity_issue": "681499b5b95209fa57e3c222",
  },
  subcategories: {
    "road_damage": "Road Damage Complaint",
    "new_road_request": "New Road Request",
    "repair_status" : "Repair Status",
  }
};

const apiClient = axios.create({
  baseURL: config.baseUrl
});

async function attachImageToCard(cardId, imagePath) {
  try {
    const form = new FormData();
    form.append('key', config.key);
    form.append('token', config.token);
    form.append('file', fs.createReadStream(imagePath));

    const response = await apiClient.post(`/cards/${cardId}/attachments`, form, {
      headers: form.getHeaders(),
    });

    return response.data;
  } catch (error) {
    console.error("Error attaching image to card:", error.response?.data || error.message);
    throw error;
  }
}

async function createCard(cardData) {
  try {
    const idList = cardData.idList || 
                   (cardData.category ? config.listIds[cardData.category] : config.listIds.education);
    
    if (!idList) {
      throw new Error("No valid list ID provided or found for category");
    }
    
    const payload = {
      key: config.key,
      token: config.token,
      idList,
      name: config.subcategories[cardData.name] || cardData.name,
      desc: cardData.desc
    };
    if (cardData.due) payload.due = cardData.due;
    if (cardData.labels) payload.idLabels = cardData.labels.join(',');
    
    const response = await apiClient.post('/cards', payload);
    const card = response.data;

    if (cardData.imagePath) {
      await attachImageToCard(card.id, cardData.imagePath);
    }

    return card;
  } catch (error) {
    console.error("Error creating Trello card:", error.response?.data || error.message);
    throw error;
  }
}

async function getLists(boardId = config.boardId) {
  try {
    const response = await apiClient.get(`/boards/${boardId}/lists`, {
      params: {
        token: config.token,
        key: config.key
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Trello lists:", error.response?.data || error.message);
    throw error;
  }
}
async function getCardComments(cardId) {
  try {
    const response = await apiClient.get(`/cards/${cardId}/actions`, {
      params: {
        filter: 'commentCard',
        key: config.key,
        token: config.token
      }
    });

    const comments = response.data.map(action => action.data.text);

    return comments;
  } catch (error) {
    console.error("Error fetching Trello card comments:", error.response?.data || error.message);
  }
}
async function getCardDetailsAndComments(cardId,from) {
  try {
    const response = await apiClient.get(`/cards/${cardId}`, {
      params: {
        key: config.key,
        token: config.token
      }
    });

    const card = response.data;

    if (!card.dueComplete) {
      console.log(`Card "${card.name}" is not complete. Fetching comments...`);
      const comments = await getCardComments(cardId);
      console.log("Comments:", comments);  
      sendInProgressNotice(from,"road damage")
      return comments;
    
    } else {
      console.log(`Card "${card.name}" is completed.`);
      sendIssueCompletionNotice(from,"road damage")
      return "Card completed";

    }

  } catch (error) {
    sendInvalidComplaintNotice(from,"road damage")
    console.error("Error fetching Trello card details:", error.response?.data || error.message); // called when invalid id 
  }
}
async function addComment(cardId, text) {
  try {
    const payload = {
      key: config.key,
      token: config.token,
      text
    };
    
    const response = await apiClient.post(`/cards/${cardId}/actions/comments`, payload);
    return response.data;
  } catch (error) {
    console.error("Error adding comment to Trello card:", error.response?.data || error.message);
  }
}
async function addAttachment(cardId, url, name) {
  try {
    const payload = {
      key: config.key,
      token: config.token,
      url
    };
    
    if (name) payload.name = name;
    
    const response = await apiClient.post(`/cards/${cardId}/attachments`, payload);
    return response.data;
  } catch (error) {
    console.error("Error adding attachment to Trello card:", error.response?.data || error.message);
    throw error;
  }
} 
async function logIssue(issue) {
  try {
    let description = issue.description;
    
    // Add metadata to description if provided
    if (issue.metadata && Object.keys(issue.metadata).length > 0) {
      description += "\n\n**Additional Information:**\n";
      
      Object.entries(issue.metadata).forEach(([key, value]) => {
        description += `- **${key}**: ${value}\n`;
      });
    }
   
    return await createCard({
      name: issue.title,
      desc: description,
      category: issue.category
    });
  } catch (error) {
    console.error("Error logging issue to Trello:", error);
    throw error;
  }
}

module.exports = {
  createCard,
  getLists,
  addComment,
  addAttachment,
  logIssue,
  getCardDetailsAndComments
};
