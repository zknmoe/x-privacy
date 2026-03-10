const toggleEl = document.getElementById("toggle-enabled");
const blurToggleEl = document.getElementById("blur-switch-enabled")
const nameEl = document.getElementById("input-name");
const handleEl = document.getElementById("input-handle");
const outNameEl = document.getElementById("output-name");
const outHandleEl = document.getElementById("output-handle");
const statusEl = document.getElementById("status");
const modeBtns = document.querySelectorAll(".mode-btn");

let currentMode = "all";

chrome.storage.sync.get(["enabled", "blur_enabled", "handle", "profileName", "displayedName", "displayedHandle", "mode"], (result) => {
    toggleEl.checked = result.enabled !== false;
    blurToggleEl.checked = result.blur_enabled !== false;
    handleEl.value = result.handle || "";
    nameEl.value = result.profileName || "";
    outNameEl.value = result.displayedName || "";
    outHandleEl.value = result.displayedHandle || "";
    currentMode = result.mode || "all";
    updateModeUI();
    updateStatus();
});
// --- Reload Page ---
document.getElementById("reload-btn").addEventListener("click", () => {
    chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.reload(tab.id));
    });
});

// --- Toggle ---
toggleEl.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: toggleEl.checked });
    updateStatus();
});

// --- Blur ---
blurToggleEl.addEventListener("change", () => {
    chrome.storage.sync.set({ blur_enabled: blurToggleEl.checked });
    updateStatus();
});

// --- Mode 按钮 ---
modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        currentMode = btn.dataset.mode;
        chrome.storage.sync.set({ mode: currentMode });
        updateModeUI();
        updateStatus();
    });
});

function updateModeUI() {
    modeBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === currentMode);
    });
}

// --- 输入 debounce 工具函数 ---
function debounced(el, key, transform) {
    let timer = null;
    el.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const val = transform ? transform(el.value) : el.value.trim();
            chrome.storage.sync.set({ [key]: val });
            updateStatus();
        }, 300);
    });
}

debounced(handleEl, "handle", (v) => v.trim().replace("@", ""));
debounced(nameEl, "profileName", (v) => v.trim());
debounced(outHandleEl, "displayedHandle", (v) => v.trim().replace("@", ""));
debounced(outNameEl, "displayedName", (v) => v.trim());

// --- 状态显示 ---
function updateStatus() {
    const handle = handleEl.value.trim().replace("@", "");
    const name = nameEl.value.trim();
    const outHandle = outHandleEl.value.trim().replace("@", "");
    const outName = outNameEl.value.trim();

    if (!toggleEl.checked) {
        statusEl.textContent = "⏸ Disguise paused";
        statusEl.className = "status";
    } else if (!handleEl.value.trim() || !nameEl.value.trim()) {
        statusEl.textContent = "⚠ Fill in your profile name & handle";
        statusEl.className = "status";
    } else if (currentMode === "all") {
        const outParts = [outNameEl.value.trim(), outHandleEl.value.trim() ? `@${outHandleEl.value.trim()}` : ""].filter(Boolean);
        statusEl.textContent = outParts.length
            ? `✓ Everyone hidden · You → ${outParts.join(" / ")}`
            : "✓ Everyone hidden · You → random";
        statusEl.className = "status active";
    } else {
        // me mode
        const outParts = [outNameEl.value.trim(), outHandleEl.value.trim() ? `@${outHandleEl.value.trim()}` : ""].filter(Boolean);
        statusEl.textContent = outParts.length
            ? `✓ You → ${outParts.join(" / ")}`
            : `✓ Hiding ${nameEl.value.trim()}`;
        statusEl.className = "status active";
    }
}