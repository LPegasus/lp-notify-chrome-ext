// sender = {id: extension id, url: tab url}
; (function () {
  'use strict';
  const funcs = {
    fetch: function (message, sender) {
      return _dbUtils_.fetchOptions().then(function (data) {
        sendMessage('fetch', data);
      });
    },
    active: function (message, sender) {// 激活
      return _dbUtils_.fetchOptions().then(function (data) {
        let datum = data.filter(function (d) { return d.url === message.url; })[0];
        if (!datum) {
          setIcon(false);
          sendMessage('active', { status: 'error', msg: 'No matched url.' });
        } else {
          setIcon('active');
          sendMessage('active', { status: 'ok', meta: datum });
        }
      });
    }
  };

  const _watchHandler_ = {};  // 监控句柄

  _dbUtils_.connect().then(function () {
    chrome.runtime.onMessage.addListener(function (message, sender) {
      try {
        if (sender.id !== chrome.runtime.id || sender.url.indexOf('background.html') !== -1) return;
        const res = JSON.parse(message);
        if (!funcs[res.type]) return;
        funcs[res.type].apply(null, [res, sender]);
      } catch (e) {
        console.log('********* stack **********');
        console.log(message);
        console.log(e);
      }
    });
  });

  chrome.tabs.onActiveChanged.addListener(function (tabId, selectInfo) {
    chrome.tabs.get(tabId, function (tabInfo) {
      if (tabInfo.url.indexOf('chrome-extension://') === 0) {
        setIcon(true);
        return;
      }
      _dbUtils_.fetchOptions().then(function (data) {
        setIcon(data.some(function (d) {
          return new RegExp(d.url).test(tabInfo.url);
        }))
      });
    });
  });

  function sendMessage(type, data) {
    chrome.runtime.sendMessage(JSON.stringify({ type: type, data: data }));
  }

  function setIcon(b) {
    let path;
    if (b !== 'active') {
      path = `images/Notify-Ext@64x64${!b ? '-disable' : ''}.png`;
    } else {
      path = 'images/Notify-Ext@watch.png';
    }
    chrome.browserAction.setIcon({ path: { '19': path, '38': path } });
  }

  function notify(title, msg, data) {
    const n = new Notification(title, {
      badge: chrome.extension.getURL('images/Notify-Ext@288x288.png'),
      body: msg,
      icon: chrome.extension.getURL('images/Notify-Ext@288x288.png'),
      data: data
    });
    n.onclick = function() {
      
    }
    setTimeout(function() {
      n.close();
    }, 5000);
  }
})();
