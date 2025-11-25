// Monitor only Overleaf project navigations and capture the session cookie when it's set
let detectedCookie = null;

chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    if (!details.responseHeaders) return;

    for (const header of details.responseHeaders) {
      const name = header.name?.toLowerCase();
      const value = header.value;

      if (name === 'set-cookie' && value?.includes('overleaf_session2=')) {
        detectedCookie = { parsed: parseCookieHeader(value) };
        break;
      }
    }
  },
  {
    urls: [
      "https://*.overleaf.com/project/*"
    ],
    types: ["main_frame"]
  },
  ["responseHeaders"]
);

function parseCookieHeader(cookieString) {
  const parts = cookieString.split(';').map(part => part.trim());
  const [nameValue] = parts;
  const [name, value] = nameValue.split('=');

  const cookie = {
    name,
    value,
    expires: null
  };

  // Preserve original case to improve native Date parsing reliability
  for (let i = 1; i < parts.length; i++) {
    const rawPart = parts[i];
    if (rawPart.toLowerCase().startsWith('expires=')) {
      cookie.expires = rawPart.split('=')[1]?.trim() || null;
    }
  }

  return cookie;
}

// Messaging: keep a small surface (last detected cookie, current cookie)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLastCookie') {
    sendResponse({
      success: true,
      cookie: detectedCookie
    });
    return true;
  }

  if (request.action === 'getCurrentOverleafCookies') {
    chrome.cookies.getAll({
      domain: '.overleaf.com'
    }).then(cookies => {
      const overleafSession = cookies.find(c => c.name === 'overleaf_session2');
      sendResponse({
        success: true,
        sessionCookie: overleafSession
      });
    }).catch(error => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }

});
