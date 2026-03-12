const toggleEl = document.getElementById("toggle-enabled");
const handleEl = document.getElementById("input-handle");
const outNameEl = document.getElementById("output-name");
const outHandleEl = document.getElementById("output-handle");
const statusEl = document.getElementById("status");

// --- 所有 blur toggle 用 data-key 统一处理 ---
const blurToggles = document.querySelectorAll("[data-key]");

// 收集所有需要从 storage 读的 key
const blurKeys = Array.from(blurToggles).map((el) => el.dataset.key);
const allKeys = ["enabled", "handle", "displayedName", "displayedHandle", ...blurKeys];

// --- 加载设置 ---
chrome.storage.sync.get(allKeys, (result) => {
    toggleEl.checked = result.enabled !== false;
    handleEl.value = result.handle || "";
    outNameEl.value = result.displayedName || "";
    outHandleEl.value = result.displayedHandle || "";

    // 所有 blur toggle 默认开启
    blurToggles.forEach((el) => {
        el.checked = result[el.dataset.key] !== false;
    });

    updateStatus();
});

// --- Master toggle ---
toggleEl.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: toggleEl.checked });
    updateStatus();
});

// --- Blur toggles: 统一事件绑定 ---
blurToggles.forEach((el) => {
    el.addEventListener("change", () => {
        chrome.storage.sync.set({ [el.dataset.key]: el.checked });
    });
});

// --- 输入 debounce ---
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
debounced(outNameEl, "displayedName", (v) => v.trim());
debounced(outHandleEl, "displayedHandle", (v) => v.trim().replace("@", ""));

// --- Reload button ---
document.getElementById("reload-btn").addEventListener("click", () => {
    chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.reload(tab.id));
    });
});

// --- Status ---
function updateStatus() {
    const handle = handleEl.value.trim().replace("@", "");

    if (!toggleEl.checked) {
        statusEl.textContent = "⏸ Disguise paused";
        statusEl.className = "status";
    } else if (!handle) {
        statusEl.textContent = "Enter your username above";
        statusEl.className = "status";
    } else {
        const outName = outNameEl.value.trim();
        const outHandle = outHandleEl.value.trim();
        const parts = [outName, outHandle ? `@${outHandle}` : ""].filter(Boolean);
        statusEl.textContent = parts.length
            ? `✓ @${handle} → ${parts.join(" / ")}`
            : `✓ @${handle} → random identity`;
        statusEl.className = "status active";
    }
}