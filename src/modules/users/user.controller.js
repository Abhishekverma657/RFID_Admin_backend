const service = require("./user.service");

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      throw new Error("All fields required");

    await service.changePassword(
      req.user.id,
      oldPassword,
      newPassword
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
};
