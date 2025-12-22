// const xlsx = require("xlsx");
// const Student = require("./student.model");

// exports.importStudents = async (filePath, instituteId) => {
//   const workbook = xlsx.readFile(filePath);
//   const sheet = workbook.Sheets[workbook.SheetNames[0]];

//   const rows = xlsx.utils.sheet_to_json(sheet);

//   let inserted = 0;
//   let updated = 0;

//   for (const row of rows) {
//     if (!row.RollNo || !row.Name) continue;

//     const result = await Student.findOneAndUpdate(
//       {
//         instituteId,
//         rollNo: String(row.RollNo),
//       },
//       {
//         instituteId,
//         rollNo: String(row.RollNo),
//         name: row.Name,
//         className: row.Class,
//         section: row.Section,
//         email: row.Email,
//         phone: row.Phone,
//       },
//       { upsert: true, new: true }
//     );

//     result.createdAt ? inserted++ : updated++;
//   }

//   return { inserted, updated };
// };

// const xlsx = require("xlsx");
// const Student = require("./student.model");

// exports.importStudents = async (filePath, instituteId) => {
//   const wb = xlsx.readFile(filePath);
//   const sheet = wb.Sheets[wb.SheetNames[0]];
//   const rows = xlsx.utils.sheet_to_json(sheet);

//   let inserted = 0;
//   let updated = 0;
//   let skipped = 0;

//   for (const row of rows) {
//     if (!row.RollNo || !row.Name) continue;

//     const data = {
//       instituteId,
//       rollNo: String(row.RollNo),
//       name: row.Name,
//       className: row.Class,
//       section: row.Section,
//       email: row.Email,
//       phone: row.Phone,
//       rfidCardId: row.RFID ? String(row.RFID) : undefined,
//       faceId: row.FaceId ? String(row.FaceId) : undefined,
//     };

//     // Check for duplicate RFID
//     if (data.rfidCardId) {
//       const rfidExists = await Student.findOne({ rfidCardId: data.rfidCardId });
//       if (rfidExists) {
//         skipped++;
//         continue; // Skip this row
//       }
//     }

//     // Check for existing student by rollNo, class, section, institute
//     const existing = await Student.findOne({
//       instituteId,
//       rollNo: data.rollNo,
//       className: data.className,
//       section: data.section,
//     });

//     if (existing) {
//       await Student.updateOne({ _id: existing._id }, data);
//       updated++;
//     } else {
//       await Student.create(data);
//       inserted++;
//     }
//   }

//   return { inserted, updated, skipped };
// };

const Student = require("./student.model");

// exports.importStudentsFromJson = async (students, instituteId) => {
//   let inserted = 0;
//   let updated = 0;
//   let skipped = 0;

//   for (const row of students) {
//     const rollNo = String(row.RollNo || "").trim();
//     const name = String(row.Name || "").trim();
//     const className = String(row.ClassName || "").trim();
//     const section = String(row.Section || "").trim();
//     const rfidCardId = row.RfidCardId
//       ? String(row.RfidCardId).trim()
//       : null;

//     // ❌ basic required check
//     if (!rollNo || !name || !className || !section) {
//       skipped++;
//       continue;
//     }

//     // 🔴 RFID global unique
//     if (rfidCardId) {
//       const rfidExists = await Student.findOne({
//         rfidCardId,
//         instituteId,
//       });

//       if (rfidExists) {
//         skipped++;
//         continue;
//       }
//     }

//     // 🔍 Check same roll + class + section
//     const existing = await Student.findOne({
//       instituteId,
//       rollNo,
//       className,
//       section,
//     });

//     const data = {
//       instituteId,
//       rollNo,
//       name,
//       className,
//       section,
//       email: row.Email || "",
//       phone: row.Phone || "",
//       rfidCardId,
//       faceId: row.FaceId ? String(row.FaceId) : null,
//     };

//     if (existing) {
//       await Student.updateOne({ _id: existing._id }, data);
//       updated++;
//     } else {
//       await Student.create(data);
//       inserted++;
//     }
//   }

//   return { inserted, updated, skipped };
// };
exports.importStudentsFromJson = async (students, instituteId) => {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of students) {
    const rollNo = String(row.RollNo || "").trim();
    const name = String(row.Name || "").trim();
    const className = String(row.ClassName || "").trim();
    const section = String(row.Section || "").trim();
    const rfidCardId = row.RfidCardId
      ? String(row.RfidCardId).trim()
      : null;

    if (!rollNo || !name || !className || !section) {
      skipped++;
      continue;
    }

    // 1️⃣ find existing student
    const existing = await Student.findOne({
      instituteId,
      rollNo,
      className,
      section,
    });

    // 2️⃣ RFID ownership check
    if (rfidCardId) {
      const rfidOwner = await Student.findOne({
        instituteId,
        rfidCardId,
      });

      if (rfidOwner && (!existing || !rfidOwner._id.equals(existing._id))) {
        skipped++;
        continue;
      }
    }

    const data = {
      instituteId,
      rollNo,
      name,
      className,
      section,
      email: row.Email || "",
      phone: row.Phone || "",
      rfidCardId,
      faceId: row.FaceId || null,
    };

    if (!existing) {
      await Student.create(data);
      inserted++;
      continue;
    }

    // 3️⃣ compare only editable fields
    let isDifferent = false;
    const fieldsToCompare = [
      "name",
      "email",
      "phone",
      "rfidCardId",
      "faceId",
    ];

    for (const field of fieldsToCompare) {
      const oldVal = existing[field] ?? null;
      const newVal = data[field] ?? null;

      if (String(oldVal) !== String(newVal)) {
        isDifferent = true;
        break;
      }
    }

    if (isDifferent) {
      await Student.updateOne({ _id: existing._id }, data);
      updated++;
    } else {
      skipped++;
    }
  }

  return { inserted, updated, skipped };
};
