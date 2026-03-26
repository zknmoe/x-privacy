// --- Entry point ---
// Ordine di caricamento nel manifest:
//   config.js → state.js → identity.js → utils.js → disguise.js → content.js

chrome.storage.sync.get(
    ["enabled", "handle", "displayedName", "displayedHandle", "blur_account_switcher", "blur_who_to_follow", "blur_profile_header", "blur_profile_banner", "blur_user_description", "blur_profile_image"],
    (result) => {
        enabled = result.enabled !== false;
        blur_account_switcher = result.blur_account_switcher !== false;
        blur_who_to_follow = result.blur_who_to_follow !== false;
        blur_profile_header = result.blur_profile_header !== false;
        blur_profile_banner = result.blur_profile_banner !== false;
        blur_user_description = result.blur_user_description !== false;
        blur_profile_image = result.blur_profile_image !== false;
        myHandle = (result.handle || "").toLowerCase().replace("@", "");
        displayedName = (result.displayedName || "").trim();
        displayedHandle = (result.displayedHandle || "").toLowerCase().replace("@", "");

        if (myHandle) {
            myFakeIdentity = getFakeIdentity(myHandle);
        }

        if (enabled) startDisguise();
    }
);

chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) enabled = changes.enabled.newValue;
    if (changes.blur_account_switcher) blur_account_switcher = changes.blur_account_switcher.newValue;
    if (changes.blur_who_to_follow) blur_who_to_follow = changes.blur_who_to_follow.newValue;
    if (changes.blur_profile_header) blur_profile_header = changes.blur_profile_header.newValue;
    if (changes.blur_profile_banner) blur_profile_banner = changes.blur_profile_banner.newValue;
    if (changes.blur_user_description) blur_user_description = changes.blur_user_description.newValue;
    if (changes.blur_profile_image) blur_profile_image = changes.blur_profile_image.newValue;
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

console.log("X Privacy loaded");