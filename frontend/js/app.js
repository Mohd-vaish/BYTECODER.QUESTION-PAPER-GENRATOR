import { readValues } from "./ui.js";
import { validate } from "./validation.js";
import { renderPaper } from "./generator.js";
import { bindPrint } from "./print.js";

async function generate() {
  const status = document.getElementById("status");
  const output = document.getElementById("paper-output");
  const payload = readValues();
  const err = validate(payload);
  if (err) {
    status.textContent = err;
    return;
  }
  status.textContent = "Generating...";
  document.getElementById("generate").disabled = true;
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }
    const data = await res.json();
    renderPaper(output, payload, data);
    status.textContent = "Ready";
  } catch (e) {
    status.textContent = "Error: " + e.message;
  } finally {
    document.getElementById("generate").disabled = false;
  }
}

document.getElementById("generate").addEventListener("click", generate);
bindPrint("print");
