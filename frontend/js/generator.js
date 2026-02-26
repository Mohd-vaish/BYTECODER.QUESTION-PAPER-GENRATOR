function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function renderPaper(root, payload, result) {
  root.innerHTML = "";
  const hdr = el("div", "hdr");
  const left = el("div", "");
  const right = el("div", "meta");
  const title = el("h2", "", result.paper?.title || payload.title || "Exam");
  const institute = el("div", "meta", result.paper?.institute || payload.institute || "");
  left.appendChild(title);
  left.appendChild(institute);
  const duration = el("div", "", `Duration: ${result.paper?.duration || payload.duration || ""}`);
  const subject = el("div", "", `Subject: ${payload.subject.toUpperCase()} • Difficulty: ${payload.difficulty}`);
  const board = payload.board ? el("div", "meta", `Board: ${payload.board}`) : null;
  const book = payload.book ? el("div", "meta", `Book: ${payload.book}`) : null;
  const chapter = payload.chapter ? el("div", "meta", `Chapter: ${payload.chapter}`) : null;
  right.appendChild(duration);
  right.appendChild(subject);
  if (board) right.appendChild(board);
  if (book) right.appendChild(book);
  if (chapter) right.appendChild(chapter);
  hdr.appendChild(left);
  hdr.appendChild(right);
  root.appendChild(hdr);

  const instr = result.paper?.instructions || [];
  if (instr.length) {
    const ul = el("ul", "meta");
    instr.forEach(i => {
      const li = el("li", "", i);
      ul.appendChild(li);
    });
    root.appendChild(ul);
  } else if (payload.instructions) {
    const p = el("p", "meta", payload.instructions);
    root.appendChild(p);
  }
  if (payload.addlInstructions) {
    const p2 = el("p", "meta", payload.addlInstructions);
    root.appendChild(p2);
  }

  const sections = result.paper?.sections || [];
  let idx = 1;
  sections.forEach(sec => {
    const s = el("div", "section");
    const h = el("h3", "", sec.name ? `Section ${sec.name}` : "Section");
    s.appendChild(h);
    (sec.questions || []).forEach(q => {
      const p = el("p", "q", `${idx}. ${q.text} (${q.marks || 0} marks)`);
      s.appendChild(p);
      const opts = q.options || [];
      if (opts.length) {
        const ul = el("ul", "opts");
        opts.forEach((o, i) => {
          const li = el("li", "", `${String.fromCharCode(65 + i)}. ${o}`);
          ul.appendChild(li);
        });
        s.appendChild(ul);
      }
      idx++;
    });
    root.appendChild(s);
  });
}
