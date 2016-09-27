// only subscribe the message from background;
; (function (win) {
  'use strict';
  let intervalId = 0, setTimeoutId = 0;
  const funcs = {
    'active': function (message, sender) {
      if (message.data.status !== 'ok') return;
      const meta = message.data.meta;
      if (!meta || !(new RegExp(meta.url, 'i')).test(location.href)) return;
      startWatch(meta);
    },
    'inactive': function (message, sender) {
      clearInterval(intervalId);
      clearTimeout(setTimeoutId);
    }
  };

  chrome.runtime.onMessage.addListener(function (message, sender) {
    if (sender.id !== chrome.runtime.id) {
      return;
    }
    const msg = JSON.parse(message);
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
    const msg = meta.msg;           // 成功提示
    const interval = meta.interval * 1000; // 间隔
    let expectExp = meta.select;           // 断言
    const timeout = meta.timeout * 1000;  // 超时
    const timeoutMsg = `url: ${url} timeout.`;  // 超时提示
    const notifyShowTime = meta.notifyShowTime * 1000;  // notification 显示时长

    // 检查断言
    if (expectExp.indexOf('expect(') === -1) {
      alert('Invalid expect expression; Please check your expect in option page.');
      return;
    }

    expectExp = expect.toString() + expectExp;
    // 非法断言检查
    try {
      res = eval(expectExp);
    } catch (e) {
      return alert('Invalid expect expression;');
    }
    clearInterval(intervalId);
    clearTimeout(setTimeoutId);
    // 声明轮询
    intervalId = setInterval(function () {
      res = eval(expectExp);
      // 匹配成功
      if (res === true) {
        clearInterval(intervalId);
        clearTimeout(setTimeoutId);
        chrome.runtime.sendMessage(JSON.stringify({ type: 'success', tabId: meta.tabId, msg: msg}));
      }
    }, interval);

    // 超时
    setTimeoutId = setTimeout(function() {
      clearInterval(intervalId);
      chrome.runtime.sendMessage(JSON.stringify({ type: 'timeout', tabId: meta.tabId, msg: timeoutMsg}));
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
