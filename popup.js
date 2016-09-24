; (function (win) {
  'use strict';
  let vm;
  const funcs = {
    fetch: function (data) {
      if (!vm) return;
      vm.list = data;
      vm.loading = false;
    }
  };

  win.vm = vm = avalon.define({
    $id: 'p',
    loading: true,
    list: [],
    isMatch: false,
    debug: '',
    active: false,
    switchActive: function() {
      if (!vm.isMatch) return;
      vm.active = !vm.active;
    },
    currentUrl: '',
    matchedUrl: '',
    btnname: function() {
      return !this.active ? MSG.btn_active : MSG.btn_sleep;
    }
  });
  chrome.tabs.getSelected(function(tab) {
    vm.debug = tab.url;
  });
  vm.$watch("list.*.url", function(n, o) {
    if ((new RegExp(n, 'i').test(this.currentUrl))) {
      vm.isMatch = true;
    }
  });
  vm.$watch("list.length", function(n, o) {
    vm.isMatch = vm.list.some(function(d) {
      let res = (new RegExp(d.url, 'i')).test(vm.currentUrl);
      if (res) {
        vm.matchedUrl = d.url;
      }
      return res;
    });
  });
  vm.$watch("active", function(n, o) {
    if (n === true && o === false && vm.matchedUrl) {
      chrome.runtime.sendMessage(JSON.stringify({type: 'active', url: vm.matchedUrl}));
    }
  });
  vm.$watch("inactive", function(n, o) {
    if (n === false && o === true && vm.matchedUrl) {
      chrome.runtime.sendMessage(JSON.stringify({ type: 'inactive', url: vm.matchedUrl }));
    }
  });

  const popupHandlerRes = popupHandlerFactory();
  chrome.runtime.sendMessage(JSON.stringify({ type: 'fetch' }));
  chrome.runtime.onMessage.addListener(popupHandlerRes.handler);
  function popupHandlerFactory() {
    return {
      handler: function (message, sender, response) {
        if (sender.id !== chrome.runtime.id || sender.url.indexOf('popup.html') !== -1) return;
        const res = JSON.parse(message);
        const func = funcs[res.type];
        if (!func) return;
        func.call(null, res.data);
      },
      dispose: function() {
        chrome.runtime.onMessage.removeListener(this.handler);
      }
    }
  }

/*
  chrome.tabs.onActiveChanged.addListener(function (tabId, selectInfo) {
    chrome.tabs.get(tabId, function(tabInfo) {
      if (tabInfo.url.indexOf('chrome-extension://') === 0) {
        return;
      }
      vm.currentUrl = tabInfo.url;
    });
  });
*/
  chrome.tabs.getSelected(function(tab) {
    vm.currentUrl = tab.url;
  });
})(window);
