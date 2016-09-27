// sender = {id: extension id, url: tab url}
; (function () {
  'use strict';
  const _watchHandler_ = {};  // tabId 标记监控是否激活中
  const funcs = {
    fetch: function (message, sender) {
      return _dbUtils_.fetchOptions().then(function (data) {
        sendMessage('fetch', { list: data, isActive: !!_watchHandler_[message.tabId] });
      });
    },
    active: function (message, sender) {// 激活
      return _dbUtils_.fetchOptions().then(function (data) {
        let datum = data.filter(function (d) { return d.url === message.url; })[0];
        if (!datum) {
          setIcon(false);
          chrome.tabs.query({ active: true }, function (t) {
            _watchHandler_[t[0].id] = undefined;
            sendMessage('active', { status: 'error', msg: 'No matched url.' }, t[0].id);
          });
        } else {
          setIcon('active');
          chrome.storage.local.get('notifyShowTime', function (res) {
            const time = res.notifyShowTime || 5;
            datum.notifyShowTime = time;
            chrome.tabs.query({ active: true }, function (t) {
              _watchHandler_[t[0].id] = true;
              sendMessage('active', { status: 'ok', meta: datum, }, t[0].id);
            });
          });
        }
      });
    },
    inactive: function (message) {
      return _dbUtils_.fetchOptions().then(function (data) {
        let datum = data.filter(function (d) { return d.url === message.url; })[0];
        if (!datum) {
          setIcon(false);
          chrome.tabs.query({ active: true }, function (t) {
            _watchHandler_[t[0].id] = undefined;
            sendMessage('inactive', { status: 'error', msg: 'No matched url.' }, t[0].id);
          });
        } else {
          setIcon(true);
          chrome.tabs.query({ active: true }, function (t) {
            _watchHandler_[t[0].id] = undefined;
            sendMessage('inactive', { status: 'ok', meta: datum }, t[0].id);
          });
        }
      });
    },
    success: function (message) {
      _watchHandler_[message.tabId] = undefined;
      notify('SUCCESS', message.msg);
      setIcon(true);
    },
    timeout: function (message) {
      _watchHandler_[message.tabId] = undefined;
      notify('TIMEOUT', message.msg);
      setIcon(true);
    }
  };


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
      if (_watchHandler_[tabId]) {
        return setIcon('active');
      }
      _dbUtils_.fetchOptions().then(function (data) {
        setIcon(data.some(function (d) {
          return new RegExp(d.url).test(tabInfo.url);
        }))
      });
    });
  });

  function sendMessage(type, data, withTabId) {
    const msg = JSON.stringify({ type: type, data: data });
    chrome.runtime.sendMessage(msg);
    if (withTabId) {
      chrome.tabs.sendMessage(withTabId, JSON.stringify({
        type: type, data: Object.assign({ tabId: withTabId }, data)
      }));
    }
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
    chrome.storage.local.get('notifyShowTime', function (res) {
      const notifyShowTime = (res.notifyShowTime || 5) * 1000;
      const icon = title === 'TIMEOUT' ? 'images/Notify-Ext@watch.png' : 'images/Notify-Ext@288x288.png';
      const n = new Notification(title, {
        // badge: chrome.extension.getURL('images/Notify-Ext@288x288.png'),
        body: msg,
        icon: chrome.extension.getURL(icon),
        data: data
      });
      n.onclick = function () {
        n.close();
      }
      const cid = setTimeout(function () {
        n.close();
      }, notifyShowTime);
      n.onclose = function() {
        clearTimeout(cid);
      }
    });
  }
})();
