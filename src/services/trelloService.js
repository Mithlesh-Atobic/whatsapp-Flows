const axios = require("axios");

// Configuration object
const config = {
  key: process.env.TRELLO_KEY,
  token: process.env.TRELLO_TOKEN ,
  baseUrl: "https://api.trello.com/1",
  boardId: "67fde2d4b58ea6fe5796fe37",
  listIds: {
    "infrastructure": "67fde927d181e7e0d2a831e8",
    "green_energy": "67fde9518e7cef5c8f2455b9",
    "education": "67fde964ed057e757b05aa32"
  },
  subcategories: {
    "pothole": "pothole complaint",
    "road_damage": "Road Damage Complaint",
    "new_road_request": "New Road Request",
    "repair_status" : "Repair Status",
  }
};

const apiClient = axios.create({
  baseURL: config.baseUrl
});

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
    return response.data;
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
    throw error;
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
  logIssue
};