window.onerror = function (e) { console.log(e); };
!function (win) {
  'use strict';
  avalon.filters.sec2min = function (seconds) {
    if (isNaN(seconds)) {
      console.log(seconds);
      return null;
    }
    if (seconds <= 59) return seconds + ' s';
    const sec = seconds % 60;
    const min = Math.floor(seconds / 60);
    return `${min} min ${sec} s`;
  }

  const vm = avalon.define({
    $id: 'n',
    list: [],
    iinterval: 1,
    imsg: '',
    iexpect: '',
    iurl: '',
    itimeout: 60,
    notifyShowTime: 5,
    add: function (e) {
      if (this.iurl === '') {
        alert('Please input the url field');
        let el = document.querySelector('[name=url]');
        return el.focus(), void el.select();
      }
      try {
        new RegExp(this.iurl);
      } catch (e) {
        alert('Invalid url source string');
        let el = document.querySelector('[name=url]');
        return el.focus(), void el.select();
      }
      if (this.iexpect === '') {
        alert('Please input the expect field');
        let el = document.querySelector('[name=expect]');
        return el.focus(), void el.select();
      }
      if (this.imsg === '') {
        alert('Please input the message field');
        let el = document.querySelector('[name=msg]');
        return el.focus(), void el.select();
      }

      _dbUtils_.add2DB('urls', {
        url: this.iurl,
        interval: this.iinterval,
        select: this.iexpect,
        msg: this.imsg,
        timeout: this.itimeout
      }).then(function (res) {
        return _dbUtils_.getAllData(res.store);
      }).then(function (list) {
        console.log('list:', list);
        vm.list = list;
      }).catch(function (e) { alert(e.message); });
    },

    del: function (index) {
      return _dbUtils_.del(this.list[index].url).then(function (res) {
        return _dbUtils_.fetchOptions();
      }).then(function (list) {
        vm.list = list;
      });
    }
  });
  _dbUtils_.connect().then(function () {
    return _dbUtils_.fetchOptions();
  }).then(function (list) {
    vm.list = list;
  });
  setTimeout(function () {
    document.body.classList.remove('waiting-render');
  }, 300)
  vm.$watch('notifyShowTime', function(n, o) {
    if (isNaN(n) || n < 5) vm.notifyShowTime = 5;
    if (n > 600) vm.notifyShowTime = 600;
  });
} (window);
