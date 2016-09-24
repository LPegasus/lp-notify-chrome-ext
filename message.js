; (function (win) {
  'use strict';
  const msgs = ['col_number', 'col_url', 'col_interval',
    'col_expect', 'col_message', 'col_action', 'title',
    'btn_del', 'btn_add', 'col_timeout', 'btn_active',
    'btn_sleep', 'setting_1', 'setting_2', 'notify_showtime'];
  function initialMsg() {
    win.MSG = {};
    msgs.forEach(function(_d) {
      win.MSG[_d] = chrome.i18n.getMessage(_d);
    });
  }
  initialMsg();
})(window);