(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) setMenu(false);
    });
  }

  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var form = document.getElementById('contact-form');
  if (!form) return;

  var success = document.getElementById('form-success');
  var dateInput = form.querySelector('#date');

  if (dateInput) {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    dateInput.min = now.getFullYear() + '-' + month + '-' + day;
  }

  function normalizeDigits(value) {
    return value
      .replace(/[\u0660-\u0669]/g, function (d) { return d.charCodeAt(0) - 0x0660; })
      .replace(/[\u06F0-\u06F9]/g, function (d) { return d.charCodeAt(0) - 0x06F0; });
  }

  var rules = {
    name: function (v) {
      if (v.trim().length < 3) return 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل).';
      return '';
    },
    phone: function (v) {
      var clean = normalizeDigits(v).replace(/[\s\-()]/g, '');
      if (!/^\+?\d{9,15}$/.test(clean)) return 'يرجى إدخال رقم جوال صحيح (من 9 إلى 15 رقماً).';
      return '';
    },
    email: function (v) {
      if (v.trim() === '') return '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'صيغة البريد الإلكتروني غير صحيحة.';
      return '';
    },
    service: function (v) {
      if (!v) return 'يرجى اختيار الخدمة المطلوبة.';
      return '';
    },
    date: function (v) {
      if (!v) return '';
      var chosen = new Date(v + 'T00:00:00');
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) return 'لا يمكن اختيار تاريخ سابق.';
      return '';
    },
    message: function (v) {
      if (v.trim().length < 10) return 'يرجى كتابة رسالتك (10 أحرف على الأقل).';
      return '';
    }
  };

  function validateField(field) {
    var rule = rules[field.id];
    if (!rule) return true;
    var group = field.closest('.form-group');
    var error = group.querySelector('.form-error');
    var message = rule(field.value);
    group.classList.toggle('invalid', message !== '');
    field.setAttribute('aria-invalid', message !== '' ? 'true' : 'false');
    if (error) error.textContent = message;
    return message === '';
  }

  var fields = form.querySelectorAll('input, select, textarea');

  fields.forEach(function (field) {
    field.addEventListener('blur', function () { validateField(field); });
    field.addEventListener('input', function () {
      if (field.closest('.form-group').classList.contains('invalid')) validateField(field);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (window.ClinicAuth && !window.ClinicAuth.isLoggedIn()) {
      window.ClinicAuth.open('login');
      return;
    }
    if (success) success.classList.remove('show');

    var firstInvalid = null;
    fields.forEach(function (field) {
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    form.reset();
    if (success) {
      success.textContent = 'تم استلام طلبك بنجاح. سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الموعد.';
      success.classList.add('show');
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
})();

(function () {
  'use strict';
  var blank = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  function mark(img) {
    if (img.src === blank) return;
    img.classList.add('img-missing');
    img.src = blank;
  }
  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () { mark(img); });
    if (img.complete && img.naturalWidth === 0) mark(img);
  });
})();

(function () {
  'use strict';

  var USERS = 'clinicUsers';
  var SESSION = 'clinicSession';
  var memory = {};
  var pending = null;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return memory[key] || null; }
  }
  function write(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* التخزين غير متاح */ }
  }
  function remove(key) {
    delete memory[key];
    try { localStorage.removeItem(key); } catch (e) { /* التخزين غير متاح */ }
  }

  function normalize(v) {
    return String(v)
      .replace(/[\u0660-\u0669]/g, function (d) { return d.charCodeAt(0) - 0x0660; })
      .replace(/[\u06F0-\u06F9]/g, function (d) { return d.charCodeAt(0) - 0x06F0; });
  }
  function cleanPhone(v) { return normalize(v).replace(/[\s\-()]/g, ''); }

  function hash(text) {
    if (window.crypto && window.crypto.subtle) {
      return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      });
    }
    return Promise.resolve(btoa(unescape(encodeURIComponent(text))));
  }

  function currentUser() { return read(SESSION); }

  var overlay = document.querySelector('.auth-page') || document.createElement('div');

  var toastEl = document.createElement('div');
  toastEl.className = 'auth-toast';
  toastEl.setAttribute('role', 'status');
  document.body.appendChild(toastEl);

  function $(id) { return document.getElementById(id); }
  function on(id, type, fn) { var el = $(id); if (el) el.addEventListener(type, fn); }
  var views = overlay.querySelectorAll('.auth-view');
  var steps = overlay.querySelectorAll('.reg-step');
  var timer;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }

  function setView(name) {
    views.forEach(function (v) {
      var on = v.getAttribute('data-name') === name;
      v.classList.toggle('is-active', on);
      v.inert = !on;
    });
    if (name === 'register') setStep(1);
    var first = overlay.querySelector('.auth-view.is-active input');
    if (first) setTimeout(function () { first.focus(); }, 350);
  }

  function setStep(n) {
    steps.forEach(function (s) {
      var on = Number(s.getAttribute('data-step')) === n;
      s.classList.toggle('is-active', on);
      s.inert = !on;
    });
    $('reg-bar').classList.toggle('step2', n === 2);
    $('reg-label').textContent = n === 1 ? 'الخطوة 1 من 2: بيانات الحساب' : 'الخطوة 2 من 2: بياناتك الشخصية';
    var first = overlay.querySelector('.reg-step.is-active input, .reg-step.is-active select');
    if (first && overlay.classList.contains('open')) setTimeout(function () { first.focus(); }, 300);
  }

  function open(view) {
    if (overlay.classList.contains('auth-page')) {
      setView(view || 'login');
      return;
    }
    var next = pending && pending.url ? pending.url : (window.location.pathname.split('/').pop() || 'index.html');
    var query = '?next=' + encodeURIComponent(next);
    if (pending && pending.service) query += '&service=' + encodeURIComponent(pending.service);
    window.location.href = 'login.html' + query;
  }

  function fromQuery() {
    var params = new URLSearchParams(window.location.search);
    var next = params.get('next') || '';
    var safe = /^[A-Za-z0-9_\-.\/#?=&%]+$/.test(next) && next.indexOf('//') < 0 && next.charAt(0) !== '/';
    return { url: safe ? next : 'index.html', service: params.get('service') };
  }

  overlay.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) setView(go.getAttribute('data-go'));
    var eyeBtn = e.target.closest('.pw-toggle');
    if (eyeBtn) {
      var input = $(eyeBtn.getAttribute('data-target'));
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  });

  function phoneRule(v) { return /^\+?\d{9,15}$/.test(cleanPhone(v)) ? '' : 'أدخل رقم جوال صحيحاً (من 9 إلى 15 رقماً).'; }
  var rules = {
    'l-phone': phoneRule,
    'r-phone': phoneRule,
    'l-pass': function (v) { return v ? '' : 'أدخل كلمة المرور.'; },
    'r-name': function (v) { return v.trim().length >= 3 ? '' : 'أدخل الاسم الكامل (3 أحرف على الأقل).'; },
    'r-pass': function (v) { return v.length >= 6 ? '' : 'كلمة المرور 6 أحرف على الأقل.'; },
    'r-pass2': function (v) { return v === $('r-pass').value ? '' : 'كلمتا المرور غير متطابقتين.'; },
    'r-age': function (v) { var n = Number(normalize(v)); return Number.isInteger(n) && n >= 1 && n <= 120 ? '' : 'أدخل عمراً صحيحاً (من 1 إلى 120).'; },
    'r-gender': function (v) { return v ? '' : 'اختر الجنس.'; },
    'r-city': function (v) { return v.trim().length >= 2 ? '' : 'أدخل المدينة أو الحي.'; }
  };

  function validate(ids) {
    var firstBad = null;
    ids.forEach(function (id) {
      var el = $(id);
      var msg = rules[id](el.value);
      var group = el.closest('.form-group');
      group.classList.toggle('invalid', msg !== '');
      group.querySelector('.form-error').textContent = msg;
      if (msg && !firstBad) firstBad = el;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  overlay.addEventListener('input', function (e) {
    var group = e.target.closest('.form-group');
    if (group && group.classList.contains('invalid') && rules[e.target.id]) validate([e.target.id]);
  });

  function showAlert(id, msg) {
    var box = $(id);
    box.textContent = msg;
    box.classList.toggle('show', !!msg);
  }

  function finish(user) {
    write(SESSION, { name: user.name, phone: user.phone, age: user.age, gender: user.gender, city: user.city });
    var target = pending || fromQuery();
    pending = null;
    refresh();
    toast('أهلاً بك يا ' + user.name.split(' ')[0] + '، تم تسجيل دخولك بنجاح');
    try { if (target.service) sessionStorage.setItem('preService', target.service); } catch (e) { /* غير متاح */ }
    setTimeout(function () { window.location.href = target.url; }, 900);
  }

  on('login-form', 'submit', function (e) {
    e.preventDefault();
    showAlert('login-alert', '');
    if (!validate(['l-phone', 'l-pass'])) return;
    var phone = cleanPhone($('l-phone').value);
    var user = (read(USERS) || []).filter(function (u) { return u.phone === phone; })[0];
    hash($('l-pass').value).then(function (h) {
      if (!user || user.pass !== h) {
        showAlert('login-alert', 'رقم الجوال أو كلمة المرور غير صحيحة. إن لم يكن لديك حساب فأنشئ حساباً جديداً.');
        return;
      }
      $('login-form').reset();
      finish(user);
    });
  });

  on('reg-next', 'click', function () {
    if (validate(['r-name', 'r-phone', 'r-pass', 'r-pass2'])) {
      var exists = (read(USERS) || []).some(function (u) { return u.phone === cleanPhone($('r-phone').value); });
      if (exists) {
        showAlert('reg-alert', 'هذا الرقم مسجل مسبقاً، يمكنك تسجيل الدخول مباشرة.');
        return;
      }
      showAlert('reg-alert', '');
      setStep(2);
    }
  });
  on('reg-back', 'click', function () { setStep(1); });

  on('register-form', 'submit', function (e) {
    e.preventDefault();
    if (!validate(['r-age', 'r-gender', 'r-city'])) return;
    hash($('r-pass').value).then(function (h) {
      var users = read(USERS) || [];
      var user = {
        name: $('r-name').value.trim(),
        phone: cleanPhone($('r-phone').value),
        pass: h,
        age: Number(normalize($('r-age').value)),
        gender: $('r-gender').value,
        city: $('r-city').value.trim(),
        notes: $('r-notes').value.trim()
      };
      users.push(user);
      write(USERS, users);
      $('register-form').reset();
      finish(user);
    });
  });

  var authBtn = $('auth-btn');
  function refresh() {
    var user = currentUser();
    if (authBtn) authBtn.textContent = user ? 'خروج (' + user.name.split(' ')[0] + ')' : 'تسجيل الدخول';
  }
  if (authBtn) {
    authBtn.addEventListener('click', function () {
      if (currentUser()) {
        remove(SESSION);
        refresh();
        toast('تم تسجيل الخروج');
      } else {
        open('login');
      }
    });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-auth]');
    if (!trigger) return;
    var service = trigger.getAttribute('data-service');
    if (currentUser()) {
      try { if (service) sessionStorage.setItem('preService', service); } catch (err) { /* غير متاح */ }
      return;
    }
    e.preventDefault();
    pending = { url: trigger.getAttribute('href'), service: service };
    open('login');
  });

  function applyPrefill() {
    var form = $('contact-form');
    if (!form) return;
    var user = currentUser();
    if (user) {
      if ($('name') && !$('name').value) $('name').value = user.name;
      if ($('phone') && !$('phone').value) $('phone').value = user.phone;
    }
    try {
      var service = sessionStorage.getItem('preService');
      if (service && $('service')) {
        $('service').value = service;
        sessionStorage.removeItem('preService');
      }
    } catch (e) { /* غير متاح */ }
  }

  views.forEach(function (v) { v.inert = !v.classList.contains('is-active'); });
  steps.forEach(function (s) { s.inert = !s.classList.contains('is-active'); });
  refresh();
  applyPrefill();
  if (overlay.classList.contains('auth-page') && currentUser()) window.location.replace(fromQuery().url);

  window.ClinicAuth = { isLoggedIn: function () { return !!currentUser(); }, open: open };
})();
