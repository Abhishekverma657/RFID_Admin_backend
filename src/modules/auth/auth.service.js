const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../users/user.model");
const { JWT_SECRET, JWT_EXPIRE } = require("../../config/jwt");

exports.login = async (email, password, requiredRole = null) => {
  const user = await User.findOne({ email, isActive: true });
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  if (requiredRole && user.role !== requiredRole) {
    throw new Error("Invalid credentials");
  }





  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      instituteId: user.instituteId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );

  return { token, user };
};

exports.createSuperAdmin = async (name, email, password) => {
  // Check if user already exists
  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "SUPER_ADMIN",
    instituteId: null,
    isActive: true,
  });

  return user;
};

exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Invalid old password");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
};
