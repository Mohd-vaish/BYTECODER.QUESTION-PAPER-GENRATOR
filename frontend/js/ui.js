export function readValues() {
  const institute = document.getElementById("institute").value.trim();
  const title = document.getElementById("title").value.trim();
  const duration = document.getElementById("duration").value.trim();
  const subject = document.getElementById("subject").value;
  const board = document.getElementById("board")?.value || "";
  const book = document.getElementById("book")?.value.trim() || "";
  const chapter = document.getElementById("chapter")?.value.trim() || "";
  const difficulty = document.getElementById("difficulty").value;
  const count = parseInt(document.getElementById("count").value, 10) || 1;
  const types = [];
  if (document.getElementById("type-mcq").checked) types.push("mcq");
  if (document.getElementById("type-short").checked) types.push("short");
  if (document.getElementById("type-long").checked) types.push("long");
  const instructions = document.getElementById("instructions").value.trim();
  const topic = document.getElementById("topic")?.value.trim() || "";
  const addlInstructions = document.getElementById("addlInstructions")?.value.trim() || "";
  const marksRaw = document.getElementById("marks").value.trim();
  const [mMcq, mShort, mLong] = marksRaw.split("/").map(v => parseInt(v, 10));
  const marks = { mcq: mMcq || 1, short: mShort || 5, long: mLong || 10 };
  const distRaw = document.getElementById("distribution")?.value.trim() || "";
  const [dMcq, dShort, dLong] = distRaw.split("/").map(v => parseInt(v, 10));
  const distribution = { mcq: dMcq || 0, short: dShort || 0, long: dLong || 0 };
  const theme = document.getElementById("theme")?.value || "cream";
  const wmEnable = !!document.getElementById("wm-enable")?.checked;
  const wmText = document.getElementById("wm-text")?.value.trim() || "";
  return { institute, title, duration, subject, difficulty, count, types, instructions, topic, addlInstructions, marks, distribution, theme, watermark: { enable: wmEnable, text: wmText }, board, book, chapter };
}
