const toggleEl = document.getElementById("toggle-enabled");
const handleEl = document.getElementById("input-handle");
const outNameEl = document.getElementById("output-name");
const outHandleEl = document.getElementById("output-handle");
const statusEl = document.getElementById("status");

// --- i18n ---
let currentLang = "en";

function applyLanguage(lang) {
    currentLang = lang;
    const t = i18n[lang] || i18n.en;

    // 替换 textContent
    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        if (t[key]) el.textContent = t[key];
    });

    // 替换 placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.dataset.i18nPlaceholder;
        if (t[key]) el.placeholder = t[key];
    });

    // 语言按钮高亮
    document.querySelectorAll(".lang-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // 保存语言偏好
    chrome.storage.sync.set({ lang });

    // 刷新状态栏
    updateStatus();
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
});

// --- 所有 blur toggle/chip 用 data-key 统一处理 ---
const blurToggles = document.querySelectorAll("[data-key]");

const blurKeys = Array.from(blurToggles).map((el) => el.dataset.key);
const allKeys = ["enabled", "handle", "displayedName", "displayedHandle", "lang", ...blurKeys];

// --- Chip 视觉状态同步 ---
function syncChipVisual(input) {
    const chip = input.closest(".chip");
    if (!chip) return;
    chip.classList.toggle("checked", input.checked);
}

// --- 加载设置 ---
chrome.storage.sync.get(allKeys, (result) => {
    toggleEl.checked = result.enabled !== false;
    handleEl.value = result.handle || "";
    outNameEl.value = result.displayedName || "";
    outHandleEl.value = result.displayedHandle || "";

    blurToggles.forEach((el) => {
        el.checked = result[el.dataset.key] !== false;
        syncChipVisual(el);
    });

    // 加载语言（默认跟随浏览器）
    const savedLang = result.lang || (navigator.language.startsWith("zh") ? "zh" : "en");
    applyLanguage(savedLang);

    updateStatus();
});

// --- Master toggle ---
toggleEl.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: toggleEl.checked });
    updateStatus();
});

// --- Blur toggles + chips ---
blurToggles.forEach((el) => {
    el.addEventListener("change", () => {
        chrome.storage.sync.set({ [el.dataset.key]: el.checked });
        syncChipVisual(el);
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

// --- Reload ---
document.getElementById("reload-btn").addEventListener("click", () => {
    chrome.tabs.query({ url: ["*://x.com/*", "*://twitter.com/*"] }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.reload(tab.id));
    });
});

// --- Status ---
function updateStatus() {
    const handle = handleEl.value.trim().replace("@", "");
    const t = i18n[currentLang] || i18n.en;

    if (!toggleEl.checked) {
        statusEl.textContent = t.status_paused;
        statusEl.className = "status";
    } else if (!handle) {
        statusEl.textContent = t.status_enter;
        statusEl.className = "status";
    } else {
        const outName = outNameEl.value.trim();
        const outHandle = outHandleEl.value.trim();
        const parts = [outName, outHandle ? `@${outHandle}` : ""].filter(Boolean);
        statusEl.textContent = parts.length
            ? `✓ @${handle} → ${parts.join(" / ")}`
            : `✓ @${handle} → ${t.status_random}`;
        statusEl.className = "status active";
    }
}