function redirectLegacyRoute() {
    if (!window.location.hash.startsWith("#/")) return false;
    window.location.replace("legacy.html" + window.location.search + window.location.hash);
    return true;
}

window.addEventListener("hashchange", redirectLegacyRoute);

if (!redirectLegacyRoute()) {
    window.alert("이것은 공식 페이지가 아닙니다.\nThis is not an official website.");
}
