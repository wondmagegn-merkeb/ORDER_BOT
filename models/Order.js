const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const OrderUpdateLog = require("./OrderUpdateLog");
const { InternalServerError } = require("../utils/customError"); // Custom error handler

const Order = sequelize.define(
  "Order",
  {
    orderId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      comment:
        "Array of food items. Format: [{foodId, foodName, price, quantity, specialOrder, itemTotal, imageUrl}]",
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    newTotalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
    feedback: {
      type: DataTypes.STRING,
      defaultValue: "noFeedBack",
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryUserId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Admin ID of the delivery person who delivered this order",
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    tableName: "orders",
  }
);

// Hook to log updates with custom error handling
Order.afterUpdate(async (updatedOrder) => {
  try {
    await OrderUpdateLog.create({
      orderId: updatedOrder.orderId,
      action: "UPDATE",
      performedBy: updatedOrder.updatedBy || "system",
      oldData: updatedOrder._previousDataValues,
      newData: updatedOrder.toJSON(),
    });
  } catch (error) {
    throw new InternalServerError("Failed to log order update", error);
  }
});

module.exports = Order;
