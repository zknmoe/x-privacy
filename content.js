const FAKE_NAMES = [
    "Stealth User", "Ghost", "Incognito", "Shadow", "Phantom",
    "Anon", "Invisible", "Nobody", "Mystery", "Unknown Entity",
    "404 Not Found", "Null Pointer", "Segfault", "Void", "Cipher",
    "Spectre", "/dev/null", "Redacted", "Classified", "Enigma",
    "Glitch", "Proxy", "Firewall", "Kernel Panic", "Stack Overflow",
    "Bit Flipper", "NaN", "Undefined", "Lorem Ipsum", "Placeholder",
];

const identityMap = new Map();
let nameIndex = 0;
let seedIndex = 0;

let enabled = true;
let blur_enabled = true;
let myHandle = "";
let myProfileName = "";
let displayedName = "";
let displayedHandle = "";
let myFakeIdentity = null; // 你自己的假身份，单独存，保持一致
let mode = "all";

function getFakeIdentity(handle) {
    const key = handle.toLowerCase();
    if (identityMap.has(key)) return identityMap.get(key);

    let identity;
    if (key === myHandle && (displayedName || displayedHandle)) {
        identity = {
            name: displayedName || FAKE_NAMES[nameIndex % FAKE_NAMES.length],
            handle: displayedHandle || displayedName?.toLowerCase().replace(/[\s/]/g, "") || "anon",
        };
    } else {
        identity = {
            name: FAKE_NAMES[nameIndex % FAKE_NAMES.length],
            handle: FAKE_NAMES[nameIndex % FAKE_NAMES.length].toLowerCase().replace(/[\s/]/g, ""),
        };
    }
    nameIndex++;
    seedIndex++;
    identityMap.set(key, identity);
    return identity;
}


// Get settings from storage
chrome.storage.sync.get(["enabled", "blur_enabled", "handle", "profileName", "displayedName", "displayedHandle", "mode"], (result) => {
    enabled = result.enabled !== false;
    blur_enabled = result.blur_enabled !== false;
    myHandle = (result.handle || "").toLowerCase().replace("@", "");
    myProfileName = (result.profileName || "").trim();
    displayedName = (result.displayedName || "").trim();
    displayedHandle = (result.displayedHandle || "").toLowerCase().replace("@", "");
    mode = result.mode || "all";

    if (myHandle) {
        myFakeIdentity = getFakeIdentity(myHandle);
    }

    if (enabled) startDisguise();
});

// --- 监听设置变化 ---
chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) enabled = changes.enabled.newValue;
    if (changes.blur_enabled) blur_enabled = changes.blur_enabled.newValue;
    if (changes.handle) {
        myHandle = (changes.handle.newValue || "").toLowerCase().replace("@", "");
        if (myHandle) myFakeIdentity = getFakeIdentity(myHandle);
    }
    if (changes.profileName) myProfileName = (changes.profileName.newValue || "").trim();
    if (changes.displayedName) displayedName = (changes.displayedName.newValue || "").trim();
    if (changes.displayedHandle) displayedHandle = (changes.displayedHandle.newValue || "").toLowerCase().replace("@", "");
    if (changes.mode) mode = changes.mode.newValue;

    if (enabled) {
        startDisguise();
    } else {
        location.reload();
    }
});

// --- 工具函数 ---
function extractHandle(link) {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("/")) return null;

    const handle = href.slice(1).split("/")[0].split("?")[0];

    const reserved = new Set([
        "home", "explore", "search", "notifications", "messages",
        "settings", "i", "compose", "hashtag", "lists", "bookmarks",
        "communities", "premium", "jobs", "tos", "privacy",
    ]);
    if (!handle || reserved.has(handle.toLowerCase())) return null;

    return handle.toLowerCase();
}

function replaceTextInElement(root) {
    if (!myHandle && !myProfileName) return;
    if (root.dataset && root.dataset.xprivacyText === "done") return;

    const fakeName = displayedName || (myFakeIdentity ? myFakeIdentity.name : "Anon");
    const fakeHandle = displayedHandle || (myFakeIdentity
        ? myFakeIdentity.name.toLowerCase().replace(/[\s/]/g, "")
        : "anon");

    // TreeWalker: 只遍历文本节点（NodeFilter.SHOW_TEXT）
    // 比 querySelectorAll + innerText 高效得多，不会触发 reflow
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        null
    );

    let node;
    while ((node = walker.nextNode())) {
        let text = node.textContent;
        let changed = false;

        // 替换 @handle（大小写不敏感）
        if (myHandle) {
            const handleRegex = new RegExp(`@${escapeRegex(myHandle)}\\b`, "gi");
            if (handleRegex.test(text)) {
                text = text.replace(handleRegex, `@${fakeHandle}`);
                changed = true;
            }
        }


        // 注意：只替换 2 个字符以上的名字，避免 "Li" 之类的短名误伤
        if (myProfileName && myProfileName.length >= 2) {
            const nameRegex = new RegExp(`\\b${escapeRegex(myProfileName)}\\b`, "gi");
            if (nameRegex.test(text)) {
                text = text.replace(nameRegex, fakeName);
                changed = true;
            }
        }

        if (changed) {
            node.textContent = text;
        }
    }

    if (root.dataset) root.dataset.xprivacyText = "done";
}

// 转义正则特殊字符，防止名字里有 . * + 之类的炸掉
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- 核心替换逻辑 ---
function disguise() {
    if (!enabled) return;

    // 1. 结构化替换：User-Name 区块
    document.querySelectorAll('[data-testid="User-Name"]').forEach((nameBlock) => {
        if (nameBlock.dataset.xprivacy === "done") return;

        const links = nameBlock.querySelectorAll("a[href^='/']");
        let handle = null;
        for (const link of links) {
            handle = extractHandle(link);
            if (handle) break;
        }
        if (!handle) return;
        if (mode === "me" && handle !== myHandle) return;

        const identity = getFakeIdentity(handle);

        links.forEach((link) => {
            link.querySelectorAll("span").forEach((span) => {
                if (span.children.length > 0) return;
                if (span.dataset.xprivacy) return;

                const text = span.textContent.trim().toLowerCase();
                if (text === `@${handle}`) {
                    span.textContent = `@${identity.handle}`;
                    span.dataset.xprivacy = "replaced";
                }
            });

            const nameSpan = link.querySelector("span span") || link.querySelector("span");
            if (nameSpan && !nameSpan.dataset.xprivacy) {
                const text = nameSpan.textContent.trim().toLowerCase();
                if (!text.startsWith("@")) {
                    nameSpan.textContent = identity.name;
                    nameSpan.dataset.xprivacy = "replaced";
                }
            }
        });

        nameBlock.dataset.xprivacy = "done";
    });

    //    只在 "me" 模式或 handle 存在时做，"all" 模式不做全局文本替换
    //    （"all" 模式下全局文本替换太重了，而且不知道哪些文本对应哪个用户）
    if (myHandle || myProfileName) {
        // 扫描关键区域而不是整个 body，避免性能问题
        const areas = [
            // 主 timeline
            '[data-testid="primaryColumn"]',
            // 右侧栏
            '[data-testid="sidebarColumn"]',
            // 通知面板
            '[aria-label="Timeline: Notifications"]',
            // DM
            '[data-testid="DmActivityContainer"]',
            // 页面标题
            "title",
        ].map((s) => document.querySelector(s)).filter(Boolean);

        areas.forEach(replaceTextInElement);

        // 页面 title（浏览器标签页上的文字）
        if (myProfileName && document.title.includes(myProfileName)) {
            document.title = document.title.replace(
                new RegExp(escapeRegex(myProfileName), "gi"),
                myFakeIdentity ? myFakeIdentity.name : "Anon"
            );
        }
        if (myHandle && document.title.toLowerCase().includes(myHandle)) {
            const fakeHandle = myFakeIdentity
                ? myFakeIdentity.handle
                : "anon";
            document.title = document.title.replace(
                new RegExp(`@?${escapeRegex(myHandle)}`, "gi"),
                fakeHandle
            );
        }
    }

    // 4. 模糊 account switcher
    const accountBtn = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (accountBtn && accountBtn.dataset.xprivacy !== "blurred") {
        const fakeName = myFakeIdentity ? myFakeIdentity.name : "Anon";
        const fakeHandle = myFakeIdentity ? myFakeIdentity.handle : "anon";

        accountBtn.querySelectorAll("span").forEach((span) => {
            if (span.children.length > 0) return;
            const text = span.textContent.trim().toLowerCase();

            if (myHandle && text.includes(myHandle)) {
                span.textContent = span.textContent.replace(
                    new RegExp(escapeRegex(myHandle), "gi"), fakeHandle
                );
            }
            if (myProfileName && myProfileName.length >= 2 &&
                text.includes(myProfileName.toLowerCase())) {
                span.textContent = span.textContent.replace(
                    new RegExp(escapeRegex(myProfileName), "gi"), fakeName
                );
            }
        });

        if (blur_enabled) {
            accountBtn.style.filter = "blur(6px)";
            accountBtn.style.transition = "filter 0.2s";
            accountBtn.addEventListener("mouseenter", () => { accountBtn.style.filter = "none"; });
            accountBtn.addEventListener("mouseleave", () => { accountBtn.style.filter = "blur(6px)"; });
        }

        accountBtn.dataset.xprivacy = "blurred";
    }


}

// --- MutationObserver ---
let observer = null;
let rafPending = false;

function startDisguise() {
    disguise();

    if (!observer) {
        observer = new MutationObserver(() => {
            // 防止 rAF 堆积：只有上一帧处理完了才 queue 下一帧
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(() => {
                    disguise();
                    rafPending = false;
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }
}

console.log("X Privacy loaded");