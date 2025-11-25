chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
