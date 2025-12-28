const express = require('express');
const Discord = require('discord.js');
require('dotenv').config();

const app = express();
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent
  ]
});

let messages = [];

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Discord события
client.on('ready', () => {
  console.log(`✅ Бот ${client.user.tag} запущен!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const targetChannelId = process.env.DISCORD_CHANNEL_ID;
  if (message.channel.id !== targetChannelId) return;
  
  console.log(`📨 ${message.author.username}: ${message.content}`);
  
  messages.push({
    id: message.id,
    username: message.author.username,
    content: message.content,
    timestamp: message.createdAt.toISOString()
  });
  
  // Ограничиваем историю
  if (messages.length > 100) messages.shift();
});

// API роуты
app.get('/api/messages', (req, res) => {
  res.json({
    success: true,
    count: messages.length,
    messages: messages
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    discord: client.isReady() ? 'connected' : 'disconnected',
    messages: messages.length,
    uptime: process.uptime()
  });
});

// HTML интерфейс для тестирования
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Discord-Roblox Bridge</title>
      <style>
        body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
        .message { border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; }
        .discord { background: #5865F2; color: white; }
        .roblox { background: #E60012; color: white; }
      </style>
    </head>
    <body>
      <h1>🌉 Discord-Roblox Bridge</h1>
      <div id="messages"></div>
      <script>
        async function loadMessages() {
          const res = await fetch('/api/messages');
          const data = await res.json();
          
          const container = document.getElementById('messages');
          container.innerHTML = '';
          
          data.messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'message discord';
            div.innerHTML = \`<strong>\${msg.username}</strong>: \${msg.content}\`;
            container.appendChild(div);
          });
        }
        
        loadMessages();
        setInterval(loadMessages, 3000);
      </script>
    </body>
    </html>
  `);
});

// Запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('🤖 Discord бот подключен'))
    .catch(console.error);
});
