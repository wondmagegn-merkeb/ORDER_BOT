const { sendMessageToUser }= require('../../bots/userBot');

async function notifyUserController() {
    const telegramId = 7816314576;
    const message = '📢 This is a message from the bot controller!';

    if (!telegramId) {
        return ctx.reply('❌ Could not determine your Telegram ID.');
    }

    try {
        await sendMessageToUser(telegramId, message);
        
    } catch (err) {
        console.error('Failed to notify user:', err);
        
    }
}

module.exports = { notifyUserController };
