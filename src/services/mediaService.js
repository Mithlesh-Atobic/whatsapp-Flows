import axios from 'axios';
import fs from 'fs';
import path from 'path';
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

export async function fetchWhatsAppMedia(mediaId) {
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