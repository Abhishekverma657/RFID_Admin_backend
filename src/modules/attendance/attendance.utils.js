exports.toMinutes = (time) => {
  if (!time || typeof time !== "string" || !time.includes(":")) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

exports.diffMinutes = (t1, t2) => {
  return Math.abs(exports.toMinutes(t1) - exports.toMinutes(t2));
};
