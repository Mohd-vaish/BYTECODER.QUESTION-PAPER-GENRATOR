export function buildMessages(payload) {
  const { subject, difficulty, count, types, title, institute, duration, instructions, marks } = payload || {};
  const sys = "You generate structured exam papers. Return strict JSON: {title,institute,duration,instructions:[string],sections:[{name,type,questions:[{text,options,marks}]}]}. Hinglish tone, concise.";
  const user = `Subject: ${subject}. Difficulty: ${difficulty}. Total: ${count}. Types: ${(types || []).join(",")}. Title: ${title || "Final Exam"}. Institute: ${institute || ""}. Duration: ${duration || ""}. Instructions: ${instructions || ""}. Marks: ${JSON.stringify(marks || {})}. JSON only.`;
  return [
    { role: "system", content: sys },
    { role: "user", content: user }
  ];
}
