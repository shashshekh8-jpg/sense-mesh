// [cite: 193]
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Points to the Render Backend
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Dashboard = ({ userProfile }) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.emit('join_mesh', userProfile);

        newSocket.on('network_update', (users) => {
            setOnlineUsers(users);
        });

        newSocket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
            handleIncomingMessage(msg);
        });

        newSocket.on('global_alert', (alert) => {
            triggerHazardResponse(alert);
        });

        return () => newSocket.close();
    }, [userProfile]);

    const handleIncomingMessage = (msg) => {
        // BLIND USER LOGIC [cite: 200]
        if (userProfile.disability === 'blind') {
            const utterance = new SpeechSynthesisUtterance(msg.content);
            window.speechSynthesis.speak(utterance);
        }
        // DEAF USER LOGIC [cite: 201]
        if (userProfile.disability === 'deaf') {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Haptics
        }
    };

    const triggerHazardResponse = (alert) => {
        // [cite: 202]
        document.body.style.backgroundColor = 'red';
        if (userProfile.disability === 'blind') {
            const u = new SpeechSynthesisUtterance(`DANGER! ${alert.type} detected!`);
            window.speechSynthesis.speak(u);
        }
        setTimeout(() => { document.body.style.backgroundColor = ''; }, 5000);
    };

    const sendMessage = () => {
        if (!socket) return;
        // Broadcast to first available user for demo
        const target = onlineUsers.find(u => u[0] !== socket.id);
        if (target) {
            socket.emit('send_message', {
                targetSocketId: target[0],
                content: inputText,
                type: 'text'
            });
            setMessages(prev => [...prev, { content: inputText, senderId: socket.id, type: 'text' }]);
            setInputText("");
        }
    };

    return (
        <main className="h-screen flex flex-col bg-slate-900 text-white">
            <header className="p-4 bg-slate-800 shadow-lg flex justify-between">
                <h1 className="text-xl font-bold text-blue-400">SenseMesh</h1>
                <div className="badge bg-blue-600 px-2 rounded">
                    {userProfile.disability.toUpperCase()} MODE
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                    <div key={idx} className={`p-3 rounded-xl max-w-xs ${
                        m.senderId === socket?.id ? 'ml-auto bg-blue-600' : 'bg-slate-700'
                    }`}>
                        <p className={`text-sm ${userProfile.disability === 'deaf' ? 'font-black text-lg text-yellow-300' : ''}`}>
                            {m.content}
                        </p>
                        {m.meta?.original_audio && <span className="text-xs text-gray-300 italic">Translated Audio</span>}
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-800 flex gap-2">
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 p-4 rounded bg-slate-900 border border-slate-700"
                    placeholder="Type message..."
                />
                <button onClick={sendMessage} className="bg-green-600 px-8 py-2 rounded font-bold">SEND</button>
            </div>
        </main>
    );
};

export default Dashboard;
