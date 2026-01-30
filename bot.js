const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// For Render: Use webhook method
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.RENDER_EXTERNAL_URL || 'https://your-bot.onrender.com';
const port = process.env.PORT || 3000;

const bot = new TelegramBot(token);
const app = express();

// Parse JSON for webhook
app.use(express.json());

// Set webhook on Render
if (process.env.RENDER) {
  bot.setWebHook(`${url}/bot${token}`);
}

// Define your keyboard buttons
const mainKeyboard = {
  reply_markup: {
    keyboard: [
      [{ text: '1️⃣ Deposit ETH' }],
      [{ text: '2️⃣ Trade ETH' }],
      [{ text: '3️⃣ Start/Stop Trading' }],
      [{ text: '4️⃣ Withdraw Profit' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMsg = `🚀 Welcome to Demo ETH Trading Bot!\n\n` +
    `Select an option below:`;
  
  bot.sendMessage(chatId, welcomeMsg, mainKeyboard);
});

// Button 1: Deposit
bot.onText(/1️⃣ Deposit ETH/, (msg) => {
  const chatId = msg.chat.id;
  const depositAddress = generateDepositAddress();
  const message = `📥 **Deposit ETH Here**\n\n` +
    `Send your ETH to this address:\n\`${depositAddress}\`\n\n` +
    `*Minimum: 0.1 ETH*\n` +
    `*Network: Ethereum Mainnet*`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Button 2: Trade
bot.onText(/2️⃣ Trade ETH/, (msg) => {
  const chatId = msg.chat.id;
  const actionTime = new Date().toLocaleTimeString();
  const message = `⚡ **Trade Alert!**\n\n` +
    `🕒 ${actionTime}\n` +
    `🚀 Hurry! I'm going into the ETH market NOW to make profit for you!\n\n` +
    `*Executing trade...*\n` +
    `*Market: ETH/USDT*\n` +
    `*Action: BUY*\n` +
    `*Position size: 5 ETH*`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  
  // Simulate trade completion after delay
  setTimeout(() => {
    const profit = (Math.random() * 2 + 0.5).toFixed(2);
    bot.sendMessage(chatId, `✅ Trade completed! Estimated profit: ${profit} ETH`);
  }, 3000);
});

// Button 3: Start/Stop Trading
let tradingActive = false;
bot.onText(/3️⃣ Start\/Stop Trading/, (msg) => {
  const chatId = msg.chat.id;
  tradingActive = !tradingActive;
  
  const status = tradingActive ? 'ACTIVE 🟢' : 'STOPPED 🔴';
  const message = tradingActive 
    ? `✅ **Trading Started**\n\nAuto-trading is now ACTIVE.\nI will execute trades based on market signals.`
    : `⛔ **Trading Stopped**\n\nAll trading activities have been paused.\nNo new positions will be opened.`;
  
  bot.sendMessage(chatId, message);
  
  // Send status update
  bot.sendMessage(chatId, `📊 Current Status: ${status}`);
});

// Button 4: Withdraw
bot.onText(/4️⃣ Withdraw Profit/, (msg) => {
  const chatId = msg.chat.id;
  
  // Inline keyboard for withdrawal confirmation
  const withdrawKeyboard = {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Enter ETH Address', callback_data: 'enter_address' }
      ]]
    }
  };
  
  const message = `💰 **Withdraw Profits**\n\n` +
    `Available balance: *10.25 ETH*\n` +
    `Profit from last trade: *1.75 ETH*\n\n` +
    `Click below to enter your withdrawal address:`;
  
  bot.sendMessage(chatId, message, { 
    parse_mode: 'Markdown',
    ...withdrawKeyboard
  });
});

// Handle withdrawal address input
bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  
  if (callbackQuery.data === 'enter_address') {
    bot.sendMessage(chatId, 
      `Please send your ETH address where you want to receive funds.\n\n` +
      `Format: \`0x742d35Cc6634C0532925a3b844Bc9e...\``, 
      { parse_mode: 'Markdown' }
    );
    
    // Listen for the next message containing address
    bot.once('message', (addressMsg) => {
      if (addressMsg.text && addressMsg.text.startsWith('0x')) {
        const ethAddress = addressMsg.text.substring(0, 42);
        const confirmMessage = `✅ **Withdrawal Processed!**\n\n` +
          `🎉 Congratulations! 10 ETH profit is coming your way!\n\n` +
          `📤 Sent to: \`${ethAddress}\`\n` +
          `⏱️ Estimated arrival: 5-10 minutes\n` +
          `📋 Transaction ID: \`0x${generateRandomHash()}\`\n\n` +
          `*Note: This is a DEMO. No actual ETH has been sent.*`;
        
        bot.sendMessage(chatId, confirmMessage, { parse_mode: 'Markdown' });
      }
    });
  }
});

// Helper function to generate fake deposit address
function generateDepositAddress() {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

// Helper function for fake transaction hash
function generateRandomHash() {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Webhook endpoint (for Render)
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check endpoint (keeps Render service awake)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', tradingActive, timestamp: new Date() });
});

// Start Express server
app.listen(port, () => {
  console.log(`Bot server running on port ${port}`);
  if (process.env.RENDER) {
    console.log(`Webhook set to: ${url}/bot${token}`);
  }
});
