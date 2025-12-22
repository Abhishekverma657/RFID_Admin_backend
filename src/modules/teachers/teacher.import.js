// const xlsx = require("xlsx");
// const Teacher = require("./teacher.model");

// exports.importTeachers = async (filePath, instituteId) => {
//   const wb = xlsx.readFile(filePath);
//   const sheet = wb.Sheets[wb.SheetNames[0]];
//   const rows = xlsx.utils.sheet_to_json(sheet);

//   let inserted = 0;
//   let updated = 0;

//   for (const row of rows) {
//     if (!row.EmployeeId || !row.Name) continue;

//     const subjects = row.Subjects
//       ? row.Subjects.split(",").map(s => s.trim())
//       : [];

//     const result = await Teacher.findOneAndUpdate(
//       {
//         instituteId,
//         employeeId: String(row.EmployeeId),
//       },
//       {
//         instituteId,
//         employeeId: String(row.EmployeeId),
//         name: row.Name,
//         email: row.Email,
//         phone: row.Phone,
//         subjects,
//       },
//       { upsert: true, new: true }
//     );

//     result.createdAt ? inserted++ : updated++;
//   }

//   return { inserted, updated };
// };

const Teacher = require("./teacher.model");

exports.importTeachersFromJson = async (teachers, instituteId) => {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of teachers) {
    const employeeId = String(row.EmployeeId || "").trim();
    const name = String(row.Name || "").trim();
    const email = String(row.Email || "").trim();
    const phone = String(row.Phone || "").trim();
    const subjects = Array.isArray(row.Subjects)
      ? row.Subjects.map(s => String(s).trim())
      : (typeof row.Subjects === "string" && row.Subjects)
        ? row.Subjects.split(",").map(s => s.trim())
        : [];

    // Basic required check
    if (!employeeId || !name) {
      skipped++;
      continue;
    }

    // 1️⃣ find existing teacher
    const existing = await Teacher.findOne({
      instituteId,
      employeeId,
    });

    const data = {
      instituteId,
      employeeId,
      name,
      email,
      phone,
      subjects,
    };

    if (!existing) {
      await Teacher.create(data);
      inserted++;
      continue;
    }

    // 2️⃣ compare only editable fields
    let isDifferent = false;
    const fieldsToCompare = [
      "name",
      "email",
      "phone",
      "subjects",
    ];

    for (const field of fieldsToCompare) {
      const oldVal = Array.isArray(existing[field])
        ? JSON.stringify(existing[field])
        : String(existing[field] ?? "");
      const newVal = Array.isArray(data[field])
        ? JSON.stringify(data[field])
        : String(data[field] ?? "");
      if (oldVal !== newVal) {
        isDifferent = true;
        break;
      }
    }

    if (isDifferent) {
      await Teacher.updateOne({ _id: existing._id }, data);
      updated++;
    } else {
      skipped++;
    }
  }

  return { inserted, updated, skipped };
};