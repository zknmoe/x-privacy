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
let myHandle = "";
let displayedName = "";
let displayedHandle = "";
let myFakeIdentity = null; // 你自己的假身份，单独存，保持一致

let blur_account_switcher = true;
let blur_who_to_follow = true;

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
chrome.storage.sync.get(["enabled", "handle", "displayedName", "displayedHandle", "blur_account_switcher", "blur_who_to_follow"], (result) => {
    enabled = result.enabled !== false;
    blur_account_switcher = result.blur_account_switcher !== false;
    blur_who_to_follow = result.blur_who_to_follow !== false;
    myHandle = (result.handle || "").toLowerCase().replace("@", "");
    displayedName = (result.displayedName || "").trim();
    displayedHandle = (result.displayedHandle || "").toLowerCase().replace("@", "");


    if (myHandle) {
        myFakeIdentity = getFakeIdentity(myHandle);
    }

    if (enabled) startDisguise();
});

// --- 监听设置变化 ---
chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) enabled = changes.enabled.newValue;
    if (changes.blur_account_switcher) blur_account_switcher = changes.blur_account_switcher.newValue;
    if (changes.blur_who_to_follow) blur_who_to_follow = changes.blur_who_to_follow.newValue;
    if (changes.handle) {
        myHandle = (changes.handle.newValue || "").toLowerCase().replace("@", "");
        if (myHandle) myFakeIdentity = getFakeIdentity(myHandle);
    }
    if (changes.displayedName) displayedName = (changes.displayedName.newValue || "").trim();
    if (changes.displayedHandle) displayedHandle = (changes.displayedHandle.newValue || "").toLowerCase().replace("@", "");

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
    if (!myHandle) return;
    if (root.dataset && root.dataset.xprivacyText === "done") return;

    const fakeHandle = displayedHandle || (myFakeIdentity
        ? myFakeIdentity.handle
        : "anon");

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        null
    );

    let node;
    while ((node = walker.nextNode())) {
        let text = node.textContent;
        let changed = false;

        if (myHandle) {
            const handleRegex = new RegExp(`@${escapeRegex(myHandle)}\\b`, "gi");
            if (handleRegex.test(text)) {
                text = text.replace(handleRegex, `@${fakeHandle}`);
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
        if (handle !== myHandle) return;

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

    // 2. Profile page 的 UserName（没有横杠，X就是这么不一致)
    document.querySelectorAll('[data-testid="UserName"]').forEach((nameBlock) => {
        if (nameBlock.dataset.xprivacy === "done") return;

        // 用 handle 确认身份
        const handleSpan = nameBlock.querySelector("span[class] > span");
        let handle = null;

        nameBlock.querySelectorAll("span").forEach((span) => {
            if (span.children.length > 0) return;
            const text = span.textContent.trim().toLowerCase();
            if (text.startsWith("@")) {
                handle = text.slice(1);
            }
        });

        if (!handle) return;
        if (handle !== myHandle) return;

        const identity = getFakeIdentity(handle);

        const profileHeader = document.querySelector('[data-testid="UserProfileHeader_Items"]');
        if (profileHeader) {
            const profileSection = profileHeader.closest("div[data-testid]")?.parentElement;
            if (profileSection && profileSection.dataset.xprivacy !== "blurred") {
                profileSection.style.filter = "blur(6px)";
                profileSection.style.transition = "filter 0.2s";
                profileSection.addEventListener("mouseenter", () => { profileSection.style.filter = "none"; });
                profileSection.addEventListener("mouseleave", () => { profileSection.style.filter = "blur(6px)"; });
                profileSection.dataset.xprivacy = "blurred";
            }
        }

        document.querySelectorAll('h2[role="heading"]').forEach((heading) => {
            if (heading.dataset.xprivacy === "done") return;

            const fakeName = myFakeIdentity ? myFakeIdentity.name : "Anon";
            heading.innerText = fakeName;
            heading.dataset.xprivacy = "done";
        });
        // 替换 @handle
        nameBlock.querySelectorAll("span").forEach((span) => {
            if (span.children.length > 0) return;
            if (span.dataset.xprivacy) return;

            const text = span.textContent.trim().toLowerCase();
            if (text === `@${handle}`) {
                span.textContent = `@${identity.handle}`;
                span.dataset.xprivacy = "replaced";
            }
        });

        const nameContainer = nameBlock.querySelector('div[dir="ltr"] > span');
        if (nameContainer && !nameContainer.dataset.xprivacy) {
            nameContainer.innerHTML = `<span>${identity.name}</span>`;
            nameContainer.dataset.xprivacy = "replaced";
        }

        nameBlock.dataset.xprivacy = "done";
    });


    //    只在 "me" 模式或 handle 存在时做，"all" 模式不做全局文本替换
    //    （"all" 模式下全局文本替换太重了，而且不知道哪些文本对应哪个用户）
    if (myHandle) {
        const areas = [
            '[data-testid="primaryColumn"]',
            '[data-testid="sidebarColumn"]',
            '[aria-label="Timeline: Notifications"]',
            '[data-testid="DmActivityContainer"]',
        ].map((s) => document.querySelector(s)).filter(Boolean);

        areas.forEach(replaceTextInElement);

        // 页面 title 直接写死
        if (document.title.toLowerCase().includes(myHandle)) {
            document.title = "X";
        }
    }


    // 4. 模糊 account switcher
    const accountBtn = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (accountBtn && accountBtn.dataset.xprivacy !== "blurred") {
        const fakeHandle = myFakeIdentity ? myFakeIdentity.handle : "anon";
        const fakeName = myFakeIdentity ? myFakeIdentity.name : "Anon";

        accountBtn.querySelectorAll("span").forEach((span) => {
            if (span.children.length > 0) return;
            const text = span.textContent.trim().toLowerCase();

            if (myHandle && text.includes(myHandle)) {
                span.textContent = `@${fakeHandle}`;
            } else if (text.length > 0 && !text.startsWith("@")) {
                // handle以外的文本大概率是显示名，直接换
                span.textContent = fakeName;
            }
        });

        if (blur_account_switcher) {
            accountBtn.style.filter = "blur(6px)";
            accountBtn.style.transition = "filter 0.2s";
            accountBtn.addEventListener("mouseenter", () => { accountBtn.style.filter = "none"; });
            accountBtn.addEventListener("mouseleave", () => { accountBtn.style.filter = "blur(6px)"; });
        }

        accountBtn.dataset.xprivacy = "blurred";
    }

    // 5. 模糊 推荐关注
    if (blur_who_to_follow) {
        document.querySelectorAll('[role="complementary"]').forEach((el) => {
            if (el.dataset.xprivacy === "blurred") return;
            el.style.filter = "blur(6px)";
            el.style.transition = "filter 0.2s";
            el.addEventListener("mouseenter", () => { el.style.filter = "none"; });
            el.addEventListener("mouseleave", () => { el.style.filter = "blur(6px)"; });
            el.dataset.xprivacy = "blurred";
        });
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