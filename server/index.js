// [cite: 98]
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({ origin: "*" })); // Allow all origins for Hackathon demo [cite: 103]
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;
const AI_URL = process.env.AI_SERVICE_URL; // Connects to Hugging Face

// In-Memory User Store (Replaces DB for speed in this context) [cite: 114]
const activeUsers = new Map();

// --- SENSEFUSE ENGINE LOGIC --- [cite: 31, 35]
async function senseFuseProcess(senderId, receiverId, content, contentType) {
    const receiver = activeUsers.get(receiverId);
    
    if (!receiver) return { content, type: contentType };
    
    const disability = receiver.disability;
    console.log(`Transcoding ${contentType} -> ${disability}`);

    // LOGIC BRANCH 1: DEAF RECEIVER [cite: 118]
    if (disability === 'deaf' && contentType === 'audio') {
         return {
             content: "Transcribed Audio: [Simulated AI Text]", // Connects to AI /transcribe
             type: 'text',
             meta: { original_audio: true }
         };
    }

    // LOGIC BRANCH 2: BLIND RECEIVER [cite: 123]
    if (disability === 'blind') {
        if (contentType === 'image') {
            try {
                // Call AI Engine
                const response = await axios.post(`${AI_URL}/describe`, { image_base64: content });
                return {
                    content: response.data.description,
                    type: 'audio_synthesis_request' // Client handles TTS
                };
            } catch (error) {
                console.error("AI Error", error);
                return { content: "Image received (AI unavailable)", type: 'text' };
            }
        }
        if (contentType === 'text') {
            return { content, type: 'text', meta: { auto_read: true } };
        }
    }

    return { content, type: contentType };
}

// --- SOCKET EVENT HANDLERS --- [cite: 140]
io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('join_mesh', (userData) => {
        // userData = { name: "Swayam", disability: "deaf" }
        activeUsers.set(socket.id, userData);
        io.emit('network_update', Array.from(activeUsers.entries()));
    });

    socket.on('send_message', async (payload) => {
        const { targetSocketId, content, type } = payload;
        
        // Process via SenseFuse
        const transformedPayload = await senseFuseProcess(socket.id, targetSocketId, content, type);

        io.to(targetSocketId).emit('receive_message', {
            senderId: socket.id,
            ...transformedPayload,
            timestamp: new Date().toISOString()
        });
    });

    // Environmental Awareness / Hazard Detection [cite: 145]
    socket.on('local_hazard_detected', (data) => {
        socket.broadcast.emit('global_alert', {
            origin: socket.id,
            type: data.type, 
            urgency: 'critical'
        });
    });

    socket.on('disconnect', () => {
        activeUsers.delete(socket.id);
        io.emit('network_update', Array.from(activeUsers.entries()));
    });
});

server.listen(PORT, () => {
    console.log(`SenseMesh Orchestrator running on port ${PORT}`);
});
