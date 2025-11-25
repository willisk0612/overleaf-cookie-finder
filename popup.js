document.addEventListener('DOMContentLoaded', function () {
  const copyBtn = document.getElementById('copyBtn');
  const cookieDisplay = document.getElementById('cookieDisplay');
  let currentCookieValue = '';

  function formatExpiry(expires) {
    if (!expires) return 'Session';
    try {
      let date;
      if (typeof expires === 'number') {
        date = new Date(expires * 1000);
      } else {
        date = new Date(expires);
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return expires;
    }
  }

  function displayCookie(cookieData) {
    const cookieValue = document.getElementById('cookieValue');
    const cookieExpires = document.getElementById('cookieExpires');
    const cookieDetails = document.querySelector('.cookie-details');

    const formattedValue = `overleaf_session2=${cookieData.value}`;
    currentCookieValue = formattedValue;

    cookieValue.textContent = formattedValue;
    cookieExpires.textContent = formatExpiry(cookieData.expirationDate || cookieData.expires);

    cookieDisplay.style.display = 'block';
    if (copyBtn) copyBtn.style.display = 'block';
    if (cookieDetails) cookieDetails.style.display = 'block';
  }

  function displayNoCookie() {
    const cookieValue = document.getElementById('cookieValue');
    const cookieDetails = document.querySelector('.cookie-details');

    currentCookieValue = '';
    if (cookieValue) {
      cookieValue.innerHTML =
        'Visit <a href="https://www.overleaf.com" target="_blank" rel="noreferrer">overleaf.com</a> and login to get a valid cookie.';
    }

    cookieDisplay.style.display = 'block';
    if (copyBtn) copyBtn.style.display = 'none';
    if (cookieDetails) cookieDetails.style.display = 'none';
  }

  function getCurrentOverleafCookies() {
    chrome.runtime.sendMessage({
      action: 'getCurrentOverleafCookies'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        return;
      }

      if (response && response.success && response.sessionCookie) {
        displayCookie(response.sessionCookie);
      } else {
        displayNoCookie();
      }
    });
  }

  copyBtn.addEventListener('click', async function () {
    if (!currentCookieValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentCookieValue);
      // Brief success feedback for UX (2s)
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');

      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  });

  function ensureOverleafTabThenFetch() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs?.[0]?.url || '';
      const onOverleaf = /^https:\/\/(?:[^/]+\.)?overleaf\.com\/?/i.test(url);
      if (!onOverleaf) {
        displayNoCookie();
        return;
      }

      getCurrentOverleafCookies();
    });
  }
  ensureOverleafTabThenFetch();
});
