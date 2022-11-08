const s = document.createElement('script');
s.src = chrome.runtime.getURL('inspection-script.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

const l = document.createElement('link');
l.type = "text/css";
l.rel = "stylesheet";
l.href = "https://unpkg.com/@picocss/pico@latest/css/pico.min.css"
l.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(l);


const sendTokenToDome = (token) => {
    const input = document.createElement('input');
    input.value = token;
    input.style.display = 'none';
    input.id = 'githubInspectorToken';
    (document.body || document.documentElement).appendChild(input);
}

let localGithubInspectorToken;
chrome.storage.local.get("githubInspectorToken", async ({ githubInspectorToken }) => {
    if (githubInspectorToken) {
        localGithubInspectorToken = githubInspectorToken
        sendTokenToDome(localGithubInspectorToken)
    }
    else {
        console.log("no token")
    }
})