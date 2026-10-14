const Notification = require("../models/Notification");
const User = require("../models/User");

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: "Marked as read", notification });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark as read", error: error.message });
  }
};

// @desc    Mark all notifications as read for current user
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark all as read", error: error.message });
  }
};

// Internal Helper: Send notification to all users having specified roles (e.g. Admin, Managers)
exports.createNotificationForRoles = async ({ roles = ["admin", "manager_operations"], title, message, type = "general", link = null, metadata = {} }) => {
  try {
    const users = await User.find({ role: { $in: roles }, status: { $ne: "inactive" } }).select("_id");
    if (!users || users.length === 0) return [];

    const docs = users.map((u) => ({
      recipient: u._id,
      title,
      message,
      type,
      link,
      metadata,
    }));

    return await Notification.insertMany(docs);
  } catch (err) {
    console.error("createNotificationForRoles error:", err.message);
    return [];
  }
};

// Internal Helper: Send notification to a specific user
exports.createUserNotification = async ({ recipient, title, message, type = "general", link = null, metadata = {} }) => {
  try {
    if (!recipient) return null;
    return await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
      metadata,
    });
  } catch (err) {
    console.error("createUserNotification error:", err.message);
    return null;
  }
};
