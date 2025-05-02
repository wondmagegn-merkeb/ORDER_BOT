const { Food, FoodCategory} = require('../../models/index');

// Display the menu (external image URLs only, using Telegram HTML formatting)
async function getMenu(ctx) {
    ctx.session.waitingForPhone2 = false;
  ctx.session.waitingForFullName = false;
    try {
        const foods = await Food.findAll({
            where: { isAvailable: true },
            include: {
                model: FoodCategory,
                attributes: ['categoryName'],
            }
        });

        if (foods.length === 0) {
            return ctx.reply('🚫 <b>No food items available right now.</b>', { parse_mode: 'HTML' });
        }

        for (const food of foods) {
            const category = food.FoodCategory.categoryName;

            const foodDetails = `
🍽 <b>${food.name}</b>
📂 <i>Category:</i> ${category}
💰 <i>Price:</i> ${food.price} birr
📝 <i>Description:</i> ${food.description || 'No description'}
${food.isAvailable ? '✅ <i>Available</i>' : '❌ <i>Not available</i>'}
`.trim();

const keyboard = food.isAvailable
  ? {
      inline_keyboard: [
        [{ text: '🛒 Order Now', callback_data: `order_now_${food.foodId}` }]
      ]
    }
  : undefined;

if (food.imageUrl && food.imageUrl.startsWith('http')) {
  await ctx.replyWithPhoto(food.imageUrl, {
    caption: foodDetails,
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
} else {
  await ctx.reply(foodDetails, {
    parse_mode: 'HTML',
    reply_markup: keyboard
  });
}

        }
    } catch (error) {
        console.error('❌ Error displaying menu:', error);
        await ctx.reply('<b>🚨 Error loading the menu. Please try again later.</b>', { parse_mode: 'HTML' });
    }
}
async function getMenuByCategory(ctx,categoryId) {
    try {
        const foods = await Food.findAll({
            where: { isAvailable: true, categoryId},
            include: {
                model: FoodCategory,
                attributes: ['categoryName'],
            }
        });

        if (foods.length === 0) {
            return ctx.reply('🚫 <b>No food items available right now.</b>', { parse_mode: 'HTML' });
        }

        for (const food of foods) {
            const category = food.FoodCategory.categoryName;

            const foodDetails = `
🍽 <b>${food.name}</b>
📂 <i>Category:</i> ${category}
💰 <i>Price:</i> ${food.price} birr
📝 <i>Description:</i> ${food.description || 'No description'}
✅ <i>Available</i>
            `.trim();

            const keyboard = {
                inline_keyboard: [
                    [{ text: '🛒 Order Now', callback_data: `order_now_${food.foodId}` }]
                ]
            };

            if (food.imageUrl && food.imageUrl.startsWith('http')) {
                await ctx.replyWithPhoto(food.imageUrl, {
                    caption: foodDetails,
                    parse_mode: 'HTML',
                    reply_markup: keyboard
                });
            } else {
                await ctx.reply(foodDetails, {
                    parse_mode: 'HTML',
                    reply_markup: keyboard
                });
            }
        }
    } catch (error) {
        console.error('❌ Error displaying menu by catagory:', error);
        await ctx.reply('<b>🚨 Error loading the menu by catagory. Please try again later.</b>', { parse_mode: 'HTML' });
    }
}

module.exports = { getMenu, getMenuByCategory};
