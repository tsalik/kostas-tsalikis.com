const cookieConsentKey = "cookie-consent";
const requested = "requested";
const accepted = "accepted";
const declined = "declined";

function setCookie(value) {
    localStorage.setItem(cookieConsentKey, value);
}

function getCookie(cname) {
    return localStorage.getItem(cname);
}

function checkCookie() {
    const cookieConsent = getCookie(cookieConsentKey);
    if (cookieConsent === requested) {
        slideUpConsent();
    } else if (cookieConsent === accepted || cookieConsent === declined) {
        slideDown();
    } else {
        setCookie(requested);
        slideUpConsent();
    }
}

function slideUpConsent() {
    const cookiesBanner = document.getElementById("cookies-consent");
    cookiesBanner.classList.remove("not-shown");
    cookiesBanner.classList.add("slideUp");

    document.getElementById("accept").onclick = function() { accept(); }
    document.getElementById("decline").onclick = function() { decline(); }
}

function slideDown() {
    const cookiesBanner = document.getElementById("cookies-consent");
    cookiesBanner.classList.remove("slideUp");
    cookiesBanner.classList.add("not-shown");
}

function accept() {
    setCookie(accepted)
    slideDown();
}

function decline() {
    setCookie(declined);
    slideDown();
}

checkCookie();
