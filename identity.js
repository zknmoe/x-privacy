// --- Generazione identità fake ---
// Dipende da: config.js (FAKE_NAMES), state.js (identityMap, nameIndex, etc.)

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