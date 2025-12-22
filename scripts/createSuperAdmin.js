require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/users/user.model");

async function create() {
  await mongoose.connect(process.env.MONGO_URI);

  const password = await bcrypt.hash("admin123", 10);

  await User.create({
    name: "Super Admin",
    email: "super@admin.com",
    password,
    role: "SUPER_ADMIN",
    instituteId: null,
    isActive: true,
  });

  console.log("Super Admin created");
  process.exit();
}

create();
