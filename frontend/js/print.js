let wmEl = null;
let wmText = "";
export function setWatermark(text) {
  wmText = text || "";
}
export function bindPrint(btnId) {
  const btn = document.getElementById(btnId);
  btn.addEventListener("click", () => {
    if (wmText) {
      wmEl = document.createElement("div");
      wmEl.style.position = "fixed";
      wmEl.style.top = "50%";
      wmEl.style.left = "50%";
      wmEl.style.transform = "translate(-50%, -50%)";
      wmEl.style.fontSize = "48px";
      wmEl.style.color = "#b7b7b7";
      wmEl.style.opacity = "0.25";
      wmEl.style.pointerEvents = "none";
      wmEl.style.userSelect = "none";
      wmEl.style.zIndex = "9999";
      wmEl.textContent = wmText;
      document.body.appendChild(wmEl);
    }
    window.print();
  });
  window.addEventListener("afterprint", () => {
    if (wmEl) {
      wmEl.remove();
      wmEl = null;
    }
  });
}
