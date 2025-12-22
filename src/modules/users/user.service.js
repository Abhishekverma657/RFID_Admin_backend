const bcrypt = require("bcryptjs");
const User = require("../../users/user.model");

exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Old password incorrect");

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;

  await user.save();
  return true;
};
