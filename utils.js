// --- Funzioni utility ---
// Dipende da: state.js (myHandle, myFakeIdentity, displayedHandle)

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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