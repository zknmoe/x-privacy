// --- Stato globale condiviso ---
const identityMap = new Map();
let nameIndex = 0;
let seedIndex = 0;

let enabled = true;
let myHandle = "";
let displayedName = "";
let displayedHandle = "";
let myFakeIdentity = null;

let blur_account_switcher = true;
let blur_who_to_follow = true;
let blur_profile_header = true;
let blur_profile_banner = true;
let blur_user_description = true;
let blur_profile_image = true;