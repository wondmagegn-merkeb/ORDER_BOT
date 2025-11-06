const { Food, FoodCategory } = require("../../models/index");
const path = require("path");
const fs = require("fs");

// Display the menu (supports both local and external image URLs)
async function getMenu(ctx) {
  ctx.session.waitingForPhone2 = false;
  ctx.session.waitingForFullName = false;
  try {
    const foods = await Food.findAll({
      include: {
        model: FoodCategory,
        attributes: ["categoryName"],
      },
    });

    if (foods.length === 0) {
      return ctx.reply("🚫 <b>No food items available right now.</b>", {
        parse_mode: "HTML",
      });
    }

    for (const food of foods) {
      const category = food.FoodCategory.categoryName;

      const foodDetails = `
🍽 <b>${food.name}</b>
📂 <i>Category:</i> ${category}
💰 <i>Price:</i> ${food.price} birr
📝 <i>Description:</i> ${food.description || "No description"}
${food.isAvailable ? "✅ <i>Available</i>" : "❌ <i>Not available</i>"}
`.trim();

      const keyboard = food.isAvailable
        ? {
            inline_keyboard: [
              [
                {
                  text: "🛒 Add to Cart",
                  callback_data: `add_cart_${food.foodId}`,
                },
              ],
            ],
          }
        : undefined;

      if (food.imageUrl) {
        // Remove leading slash from imageUrl if present
        const imageUrlPath = food.imageUrl.startsWith("/")
          ? food.imageUrl.substring(1)
          : food.imageUrl;
        const imagePath = path.resolve(__dirname, "../../public", imageUrlPath);
        const imageExists = fs.existsSync(imagePath);
        if (imageExists) {
          try {
            await ctx.replyWithPhoto(
              { source: fs.createReadStream(imagePath) },
              {
                caption: foodDetails,
                parse_mode: "HTML",
                reply_markup: keyboard,
              }
            );
          } catch (photoError) {
            // If photo fails, send text message instead
            console.warn(
              `⚠️ Failed to send photo for ${food.name}:`,
              photoError.message
            );
            await ctx.reply(foodDetails, {
              parse_mode: "HTML",
              reply_markup: keyboard,
            });
          }
        } else {
          await ctx.reply(foodDetails, {
            parse_mode: "HTML",
            reply_markup: keyboard,
          });
        }
      } else {
        await ctx.reply(foodDetails, {
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
      }
    }
  } catch (error) {
    console.error("❌ Error displaying menu:", error);
    await ctx.reply(
      "<b>🚨 Error loading the menu. Please try again later.</b>",
      { parse_mode: "HTML" }
    );
  }
}
async function getMenuByCategory(ctx, categoryId) {
  try {
    const foods = await Food.findAll({
      where: {
        categoryId: categoryId,
      },
      include: {
        model: FoodCategory,
        attributes: ["categoryName"],
      },
    });

    if (foods.length === 0) {
      return ctx.reply("🚫 <b>No food items available right now.</b>", {
        parse_mode: "HTML",
      });
    }

    for (const food of foods) {
      const category = food.FoodCategory.categoryName;

      const foodDetails = `
🍽 <b>${food.name}</b>
📂 <i>Category:</i> ${category}
💰 <i>Price:</i> ${food.price} birr
📝 <i>Description:</i> ${food.description || "No description"}
${food.isAvailable ? "✅ <i>Available</i>" : "❌ <i>Not available</i>"}
`.trim();

      const keyboard = food.isAvailable
        ? {
            inline_keyboard: [
              [
                {
                  text: "🛒 Add to Cart",
                  callback_data: `add_cart_${food.foodId}`,
                },
              ],
            ],
          }
        : undefined;

      if (food.imageUrl) {
        // Remove leading slash from imageUrl if present
        const imageUrlPath = food.imageUrl.startsWith("/")
          ? food.imageUrl.substring(1)
          : food.imageUrl;
        const imagePath = path.resolve(__dirname, "../../public", imageUrlPath);
        const imageExists = fs.existsSync(imagePath);
        if (imageExists) {
          try {
            await ctx.replyWithPhoto(
              { source: fs.createReadStream(imagePath) },
              {
                caption: foodDetails,
                parse_mode: "HTML",
                reply_markup: keyboard,
              }
            );
          } catch (photoError) {
            // If photo fails, send text message instead
            console.warn(
              `⚠️ Failed to send photo for ${food.name}:`,
              photoError.message
            );
            await ctx.reply(foodDetails, {
              parse_mode: "HTML",
              reply_markup: keyboard,
            });
          }
        } else {
          await ctx.reply(foodDetails, {
            parse_mode: "HTML",
            reply_markup: keyboard,
          });
        }
      } else {
        await ctx.reply(foodDetails, {
          parse_mode: "HTML",
          reply_markup: keyboard,
        });
      }
    }
  } catch (error) {
    console.error("❌ Error displaying menu by catagory:", error);
    await ctx.reply(
      "<b>🚨 Error loading the menu by catagory. Please try again later.</b>",
      { parse_mode: "HTML" }
    );
  }
}

module.exports = { getMenu, getMenuByCategory };
