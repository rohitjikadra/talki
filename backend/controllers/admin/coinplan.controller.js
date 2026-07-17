const CoinPlan = require("../../models/coinplan.model");

//import model
const History = require("../../models/history.model");

//mongoose
const mongoose = require("mongoose");

//create a new coin plan
exports.addCoinPlan = async (req, res) => {
  try {
    const { coins, price, productId } = req.body;

    if (!coins || !price || !productId) {
      return res.status(200).json({ status: false, message: "coins, price, and productId are required." });
    }

    const newPlan = await CoinPlan.create({ coins, price, productId });
    return res.status(200).json({ status: true, message: "Coin plan created successfully.", data: newPlan });
  } catch (error) {
    console.error("Error in addCoinPlan:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//update an existing coin plan
exports.editCoinPlan = async (req, res) => {
  try {
    const { coinPlanId, coins, price, productId } = req.body;

    if (!coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId is required." });
    }

    const updated = await CoinPlan.findByIdAndUpdate(coinPlanId, { coins, price, productId }, { new: true, lean: true });

    if (!updated) {
      return res.status(200).json({ status: false, message: "Coin plan not found." });
    }

    return res.status(200).json({ status: true, message: "Coin plan updated successfully.", data: updated });
  } catch (error) {
    console.error("Error in editCoinPlan:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//toggle coin plan status (isActive or isPopular)
exports.toggleCoinPlanField = async (req, res) => {
  try {
    const { coinPlanId, field } = req.query;

    if (!coinPlanId || !["isActive", "isPopular"].includes(field)) {
      return res.status(200).json({ status: false, message: "Valid coinPlanId and field (isActive or isPopular) required." });
    }

    const plan = await CoinPlan.findById(coinPlanId);
    if (!plan) {
      return res.status(200).json({ status: false, message: "Coin plan not found." });
    }

    plan[field] = !plan[field];
    await plan.save();

    return res.status(200).json({ status: true, message: `Coin plan ${field} toggled.`, data: plan });
  } catch (error) {
    console.error("Error in toggleCoinPlanField:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//retrieve all coin plans
exports.listCoinPlans = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await CoinPlan.aggregate([
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $sort: { coins: 1, price: 1 } }, { $skip: (start - 1) * limit }, { $limit: limit }],
        },
      },
    ]);

    const total = result?.[0]?.metadata?.[0]?.total || 0;
    const plans = result?.[0]?.data || [];

    return res.status(200).json({ status: true, message: "Coin plans retrieved successfully.", total, data: plans });
  } catch (error) {
    console.error("Error in listCoinPlans:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//delete a coin plan
exports.deleteCoinPlan = async (req, res) => {
  try {
    const { coinPlanId } = req.query;
    if (!coinPlanId) {
      return res.status(200).json({ status: false, message: "coinPlanId is required." });
    }

    const plan = await CoinPlan.findByIdAndDelete(coinPlanId);
    if (!plan) {
      console.error("Coin plan not found.");
      return res.status(200).json({ status: false, message: "Coin plan not found." });
    }

    return res.status(200).json({ status: true, message: "Coin plan deleted successfully." });
  } catch (error) {
    console.error("Error in deleteCoinPlan:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get coinplan histories of users (admin earning)
exports.getCoinPurchaseHistory = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { startDate = "All", endDate = "All", userId, search, paymentGateway } = req.query;

    const dateFilter = {};
    if (startDate && endDate && startDate !== "All" && endDate !== "All") {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const matchQuery = {
      ...dateFilter,
      type: 2,
      price: { $exists: true, $ne: 0 },
    };

    if (paymentGateway && paymentGateway !== "All") {
      matchQuery.paymentGateway = paymentGateway;
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      matchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    const searchMatch = search
      ? {
          $or: [
            { "userDetails.nickName": { $regex: search, $options: "i" } },
            { "userDetails.fullName": { $regex: search, $options: "i" } },
            { "userDetails.uniqueId": { $regex: search, $options: "i" } },
            { "userDetails.email": { $regex: search, $options: "i" } },
            { paymentGateway: { $regex: search, $options: "i" } },
          ],
        }
      : null;

    const result = await History.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                nickName: 1,
                fullName: 1,
                uniqueId: 1,
                profilePic: 1,
                email: 1,
              },
            },
          ],
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      ...(searchMatch ? [{ $match: searchMatch }] : []),
      {
        $facet: {
          adminEarnings: [
            {
              $group: {
                _id: null,
                total: { $sum: "$price" },
              },
            },
          ],
          totalCount: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: (start - 1) * limit },
            { $limit: limit },
            {
              $project: {
                userId: 1,
                nickName: "$userDetails.nickName",
                fullName: "$userDetails.fullName",
                uniqueId: "$userDetails.uniqueId",
                profilePic: "$userDetails.profilePic",
                price: 1,
                userCoin: 1,
                paymentGateway: 1,
                date: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Coin purchase history retrieved successfully.",
      adminEarnings: result[0]?.adminEarnings[0]?.total || 0,
      total: result[0]?.totalCount[0]?.total || 0,
      data: result[0]?.data || [],
    });
  } catch (err) {
    console.error("getCoinPurchaseHistory error:", err);
    return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
  }
};
