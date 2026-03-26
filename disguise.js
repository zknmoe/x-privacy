// --- Logica di mascheramento ---
// Dipende da: state.js, identity.js, utils.js

let observer = null;
let rafPending = false;

function disguise() {
    if (!enabled) return;

    // 1. User-Name 区块 (timeline tweets)
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

    // 2. Profile page UserName
    document.querySelectorAll('[data-testid="UserName"]').forEach((nameBlock) => {
        if (nameBlock.dataset.xprivacy === "done") return;

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

        // Replace page heading
        document.querySelectorAll('h2[role="heading"]').forEach((heading) => {
            if (heading.dataset.xprivacy === "done") return;
            heading.innerText = myFakeIdentity ? myFakeIdentity.name : "Anon";
            heading.dataset.xprivacy = "done";
        });

        // Replace @handle
        nameBlock.querySelectorAll("span").forEach((span) => {
            if (span.children.length > 0) return;
            if (span.dataset.xprivacy) return;

            const text = span.textContent.trim().toLowerCase();
            if (text === `@${handle}`) {
                span.textContent = `@${identity.handle}`;
                span.dataset.xprivacy = "replaced";
            }
        });

        // Replace display name
        const nameContainer = nameBlock.querySelector('div[dir="ltr"] > span');
        if (nameContainer && !nameContainer.dataset.xprivacy) {
            nameContainer.innerHTML = `<span>${identity.name}</span>`;
            nameContainer.dataset.xprivacy = "replaced";
        }

        nameBlock.dataset.xprivacy = "done";
    });

    // 3. Text replacement in main areas
    if (myHandle) {
        const areas = [
            '[data-testid="primaryColumn"]',
            '[data-testid="sidebarColumn"]',
            '[aria-label="Timeline: Notifications"]',
            '[data-testid="DmActivityContainer"]',
        ].map((s) => document.querySelector(s)).filter(Boolean);

        areas.forEach(replaceTextInElement);

        if (document.title.toLowerCase().includes(myHandle)) {
            document.title = "X";
        }
    }

    // 4. Profile page elements
    if (blur_profile_header) disguiseProfileHeader();
    if (blur_profile_banner) disguiseProfileBanner();
    if (blur_user_description) disguiseUserDescription();
    if (blur_profile_image) disguiseProfileImage();

    // 5. Account switcher
    disguiseAccountSwitcher();

    // 6. Who to follow
    if (blur_who_to_follow) {
        disguiseWhoToFollow();
    }
}

function disguiseProfileHeader() {
    if (!myHandle) return;
    const path = window.location.pathname.toLowerCase();
    if (!path.includes(myHandle)) return;

    const profileHeader = document.querySelector('[data-testid="UserProfileHeader_Items"]');
    if (!profileHeader || profileHeader.dataset.xprivacy === "blurred") return;

    // Risali al contenitore che include bio + header items
    const container = profileHeader.closest("div[data-testid]")?.parentElement || profileHeader;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: absolute;
        inset: 0;
        backdrop-filter: blur(10px);
        background: rgba(15, 20, 25, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        transition: opacity 0.2s;
        border-radius: 16px;
    `;
    overlay.innerHTML = `
        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="20" r="12" fill="rgba(29, 155, 240, 0.15)" stroke="rgb(29, 155, 240)" stroke-width="1.5"/>
            <path d="M25 14v-1a3.5 3.5 0 0 1 3.5 3.5v2m-7 0h7a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z" 
                  stroke="rgb(29, 155, 240)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <text x="50" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" 
                  fill="rgb(29, 155, 240)" text-anchor="start">Protected</text>
        </svg>
    `;

    container.style.position = "relative";
    container.appendChild(overlay);

    container.addEventListener("mouseenter", () => { overlay.style.opacity = "0"; overlay.style.pointerEvents = "none"; });
    container.addEventListener("mouseleave", () => { overlay.style.opacity = "1"; overlay.style.pointerEvents = "auto"; });

    profileHeader.dataset.xprivacy = "blurred";
}

function disguiseProfileBanner() {
    // Solo sulla propria pagina profilo
    if (!myHandle) return;
    const path = window.location.pathname.toLowerCase();
    if (!path.includes(myHandle)) return;

    document.querySelectorAll("div[style*='profile_banners']").forEach((banner) => {
        if (banner.dataset.xprivacy === "blurred") return;

        banner.style.filter = "blur(20px) brightness(0.6)";
        banner.style.transition = "filter 0.2s";

        banner.addEventListener("mouseenter", () => { banner.style.filter = "none"; });
        banner.addEventListener("mouseleave", () => { banner.style.filter = "blur(20px) brightness(0.6)"; });

        banner.dataset.xprivacy = "blurred";
    });
}

function disguiseUserDescription() {
    if (!myHandle) return;
    const path = window.location.pathname.toLowerCase();
    if (!path.includes(myHandle)) return;

    const bio = document.querySelector('[data-testid="UserDescription"]');
    if (!bio || bio.dataset.xprivacy === "blurred") return;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: absolute;
        inset: 0;
        backdrop-filter: blur(10px);
        background: rgba(15, 20, 25, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        transition: opacity 0.2s;
        border-radius: 12px;
    `;
    overlay.innerHTML = `
        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="20" r="12" fill="rgba(29, 155, 240, 0.15)" stroke="rgb(29, 155, 240)" stroke-width="1.5"/>
            <path d="M25 14v-1a3.5 3.5 0 0 1 3.5 3.5v2m-7 0h7a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z" 
                  stroke="rgb(29, 155, 240)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <text x="50" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" 
                  fill="rgb(29, 155, 240)" text-anchor="start">Protected</text>
        </svg>
    `;

    bio.style.position = "relative";
    bio.appendChild(overlay);

    bio.addEventListener("mouseenter", () => { overlay.style.opacity = "0"; overlay.style.pointerEvents = "none"; });
    bio.addEventListener("mouseleave", () => { overlay.style.opacity = "1"; overlay.style.pointerEvents = "auto"; });

    bio.dataset.xprivacy = "blurred";
}

function disguiseProfileImage() {
    if (!myHandle) return;
    const path = window.location.pathname.toLowerCase();
    if (!path.includes(myHandle)) return;

    document.querySelectorAll("div[style*='profile_images']").forEach((avatar) => {
        if (avatar.dataset.xprivacy === "blurred") return;

        avatar.style.filter = "blur(20px) brightness(0.6)";
        avatar.style.transition = "filter 0.2s";

        avatar.addEventListener("mouseenter", () => { avatar.style.filter = "none"; });
        avatar.addEventListener("mouseleave", () => { avatar.style.filter = "blur(20px) brightness(0.6)"; });

        avatar.dataset.xprivacy = "blurred";
    });
}

function disguiseAccountSwitcher() {
    const accountBtn = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (!accountBtn || accountBtn.dataset.xprivacy === "blurred") return;

    const fakeHandle = myFakeIdentity ? myFakeIdentity.handle : "anon";
    const fakeName = myFakeIdentity ? myFakeIdentity.name : "Anon";

    accountBtn.querySelectorAll("span").forEach((span) => {
        if (span.children.length > 0) return;
        const text = span.textContent.trim().toLowerCase();

        if (myHandle && text.includes(myHandle)) {
            span.textContent = `@${fakeHandle}`;
        } else if (text.length > 0 && !text.startsWith("@")) {
            span.textContent = fakeName;
        }
    });

    if (blur_account_switcher) {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: absolute;
            inset: 0;
            backdrop-filter: blur(10px);
            background: rgba(15, 20, 25, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            transition: opacity 0.2s;
            border-radius: 9999px;
        `;
        overlay.innerHTML = `
            <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="20" r="12" fill="rgba(29, 155, 240, 0.15)" stroke="rgb(29, 155, 240)" stroke-width="1.5"/>
                <path d="M25 14v-1a3.5 3.5 0 0 1 3.5 3.5v2m-7 0h7a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z" 
                      stroke="rgb(29, 155, 240)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <text x="50" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" 
                      fill="rgb(29, 155, 240)" text-anchor="start">Protected</text>
            </svg>
        `;

        accountBtn.style.position = "relative";
        accountBtn.appendChild(overlay);

        accountBtn.addEventListener("mouseenter", () => { overlay.style.opacity = "0"; overlay.style.pointerEvents = "none"; });
        accountBtn.addEventListener("mouseleave", () => { overlay.style.opacity = "1"; overlay.style.pointerEvents = "auto"; });
    }

    accountBtn.dataset.xprivacy = "blurred";
}

function disguiseWhoToFollow() {
    document.querySelectorAll('[role="complementary"]').forEach((el) => {
        if (el.dataset.xprivacy === "blurred") return;

        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: absolute;
            inset: 0;
            backdrop-filter: blur(10px);
            background: rgba(15, 20, 25, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            transition: opacity 0.2s;
            border-radius: 16px;
        `;
        overlay.innerHTML = `
            <svg width="80" height="90" viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="35" r="20" fill="rgba(29, 155, 240, 0.15)" stroke="rgb(29, 155, 240)" stroke-width="2"/>
                <path d="M40 25v-2a6 6 0 0 1 6 6v4m-12 0h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H34a2 2 0 0 1-2-2V35a2 2 0 0 1 2-2z" 
                      stroke="rgb(29, 155, 240)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <text x="40" y="75" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" 
                      fill="rgb(29, 155, 240)" text-anchor="middle">Protected</text>
            </svg>
        `;

        el.style.position = "relative";
        el.appendChild(overlay);

        el.addEventListener("mouseenter", () => { overlay.style.opacity = "0"; overlay.style.pointerEvents = "none"; });
        el.addEventListener("mouseleave", () => { overlay.style.opacity = "1"; overlay.style.pointerEvents = "auto"; });

        el.dataset.xprivacy = "blurred";
    });
}

function startDisguise() {
    disguise();

    if (!observer) {
        observer = new MutationObserver(() => {
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