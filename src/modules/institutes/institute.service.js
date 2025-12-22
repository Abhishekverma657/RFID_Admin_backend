const bcrypt = require("bcryptjs");
const Institute = require("./institute.model");
const User = require("../../users/user.model");
const Student = require("../students/student.model");
const Teacher = require("../teachers/teacher.model");
const Attendance = require("../attendance/attendance.model");
const { sendAdminCredentials } = require("../../config/mailer");

exports.createInstitute = async (data) => {
  // 1. check duplicate institute
  const exists = await Institute.findOne({ code: data.code });
  if (exists) throw new Error("Institute already exists");

  // 2. create institute (temporary)
  const institute = await Institute.create({
    name: data.name,
    code: data.code,
    address: data.address,
  });

  // 3. create institute admin user
  const rawPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const adminUser = await User.create({
    name: data.adminName,
    email: data.adminEmail,
    password: hashedPassword,
    role: "ADMIN",
    instituteId: institute._id,
    
  });

  // 4. link admin to institute
  institute.adminUserId = adminUser._id;
  await institute.save();
   await sendAdminCredentials(data.adminEmail, rawPassword);

  return {
    institute,
    adminCredentials: {
      email: data.adminEmail,
      password: rawPassword, // show once
    },
  };
};

// get all institutes by super admin
exports.getInstitutesWithCounts = async () => {
  const institutes = await Institute.find().lean();

  // For each institute, get student and teacher counts
  const results = await Promise.all(
    institutes.map(async (inst) => {
      const studentCount = await Student.countDocuments({ instituteId: inst._id });
      const teacherCount = await Teacher.countDocuments({ instituteId: inst._id });
      return {
        ...inst,
        studentCount,
        teacherCount,
      };
    })
  );

  return results;
};

exports.getInstituteDetails = async (instituteId) => {
  const institute = await Institute.findById(instituteId).lean();
  if (!institute) throw new Error("Institute not found");

  const adminUser = await User.findById(institute.adminUserId).lean();

  // Do NOT return password in production! This is for demo/testing only.
  return {
    ...institute,
    admin: adminUser
      ? {
          name: adminUser.name,
          email: adminUser.email,
          // password: adminUser.password, // Never return hashed password!
          role: adminUser.role,
        }
      : null,
  };
};

exports.getInstituteStats = async (instituteId) => {
  const today = new Date().toISOString().split("T")[0];
  const [students, teacherCount, presentToday, institute, adminUser] = await Promise.all([
    Student.find({ instituteId }),
    Teacher.countDocuments({ instituteId }),
    Attendance.countDocuments({ instituteId, date: today, status: "PRESENT" }), // <-- Only PRESENT
    Institute.findById(instituteId).lean(),
    (async () => {
      const inst = await Institute.findById(instituteId).lean();
      return inst && inst.adminUserId ? User.findById(inst.adminUserId).lean() : null;
    })(),
  ]);

  const studentCount = students.length;

  return {
    institute: institute ? {
      name: institute.name,
      code: institute.code,
      address: institute.address,
    } : null,
    studentCount,
    teacherCount,
    presentToday,
    admin: adminUser
      ? {
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        }
      : null,
  };
};


