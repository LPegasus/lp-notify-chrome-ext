// only subscribe the message from background;
; (function (win) {
  'use strict';
  console.log('injected');
  const funcs = {
    'active': function (message, sender) {
      if (message.status !== 'ok') return;
      const meta = message.data.meta;
      if (!meta || !(new RegExp(meta.url, 'i')).test(location.href)) return;

    }
  };

  chrome.runtime.onMessage.addListener(function (message, sender) {
    if (sender.id !== chrome.runtime.id || sender.url.indexOf('background.html') === -1) {
      return;
    }
    const msg = JSON.parse(message.type);
    const func = funcs[msg.type];
    if (func) {
      func.call(null, msg, sender);
    }
  });

  /**
   * @param  {Object} meta IndexedDB urls data
   */
  function startWatch(meta) {
    let res;
    const url = meta.url;
    const msg = meta.msg;
    const interval = meta.interval * 1000;
    const expect = meta.select;
    const timeout = meta.timeout * 1000;
    const timeoutMsg = `url: ${url} timeout.`;
    if (select.indexOf('expect(') === -1) {
      alert('Invalid expect expression; Please check your expect in option page.');
      return;
    }

    try {
      res = eval(meta.expect);
    } catch (e) {
      alert('Invalid expect expression;');
    }
    let setTimeoutId = 0;
    const intervalId = setInterval(function () {
      res = eval(meta.expect);
      if (res === true) {
        clearInterval(intervalId);
        clearTimeout(setTimeoutId);
        new Notification('Finish', {
          badge: chrome.extension.getURL('images/Notify-Ext@288x288.png'),
          body: '<strong>1231123</strong>',
          tag: '<strong>tag</strong>',
          icon: chrome.extension.getURL('images/Notify-Ext@288x288.png'),
          data: {
            meta: 'meta'
          }
        });
      }
    }, interval);

    // 超时
    setTimeoutId = setTimeout(function() {
      clearInterval(intervalId);
    }, timeout);
  }

  function expect(v) {
    const be = {
      get ok() {
        return v === true;
      },
      equal: function(v_) {
        return v === v_;
      }
    };
    return {
      to: {
        be: be,
        get not() {
          v = !v;
          return { be };
        }
      }
    }
  }
})(window);
