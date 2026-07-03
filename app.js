/* ————————————————————————————————————————————————
   Founder Era — form logic
   ————————————————————————————————————————————————

   CONFIG: after deploying the Google Apps Script Web App
   (see README.md), paste its URL between the quotes below.
   Until then the form runs in preview mode: it shows the
   confirmation screen but logs the submission to the console
   instead of saving it.                                       */

const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycby139zYMNfXtbRSes0woXSzElqiqm1nf7b7LsuXG6WoRphZKd3t2AqDz1EqkJmuRqI/exec";

/* ————————————————————————————————————————————————— */

const form = document.getElementById('signupForm');
const submitBtn = document.getElementById('submitBtn');
const formError = document.getElementById('formError');
const stateForm = document.getElementById('stateForm');
const stateDone = document.getElementById('stateDone');

/* ——— helpers ——————————————————————————————————— */

const $ = (id) => document.getElementById(id);

function setError(fieldEl, inputName, message) {
  const p = document.querySelector(`[data-error-for="${inputName}"]`);
  if (message) {
    fieldEl.classList.add('has-error');
    if (p) p.textContent = message;
  } else {
    fieldEl.classList.remove('has-error');
    if (p) p.textContent = '';
  }
}

function fieldOf(input) {
  return input.closest('.field');
}

/* ——— city autocomplete ————————————————————————— */

const cityInput = $('city');
const cityList = $('cityList');
let cityMatches = [];
let cityActive = -1;
let citySuppress = false;

// CITIES is loaded from cities.js — India-biased ordering, then by population.
const CITIES_NORM = (typeof CITIES !== 'undefined' ? CITIES : []).map(c => c.toLowerCase());

function normalizeQuery(q) {
  return q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function searchCities(q) {
  const starts = [];
  const contains = [];
  for (let i = 0; i < CITIES_NORM.length; i++) {
    const c = CITIES_NORM[i];
    if (c.startsWith(q)) {
      starts.push(i);
      if (starts.length >= 8) break;
    } else if (contains.length < 8 && c.includes(q)) {
      contains.push(i);
    }
  }
  return starts.concat(contains).slice(0, 8);
}

function renderCityList() {
  cityList.innerHTML = '';
  cityActive = -1;
  if (!cityMatches.length) { closeCityList(); return; }
  cityMatches.forEach((idx, i) => {
    const li = document.createElement('li');
    li.id = `city-opt-${i}`;
    li.setAttribute('role', 'option');
    const parts = CITIES[idx].split(/,(.+)/);
    li.appendChild(document.createTextNode(parts[0]));
    const cc = document.createElement('span');
    cc.className = 'cc';
    cc.textContent = ',' + (parts[1] || '');
    li.appendChild(cc);
    // mousedown fires before the input's blur
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      pickCity(idx);
    });
    cityList.appendChild(li);
  });
  cityList.hidden = false;
  cityInput.setAttribute('aria-expanded', 'true');
}

function closeCityList() {
  cityList.hidden = true;
  cityList.innerHTML = '';
  cityActive = -1;
  cityInput.setAttribute('aria-expanded', 'false');
  cityInput.removeAttribute('aria-activedescendant');
}

function pickCity(idx) {
  citySuppress = true;
  cityInput.value = CITIES[idx];
  closeCityList();
  setError(fieldOf(cityInput), 'city', '');
  setTimeout(() => { citySuppress = false; }, 50);
}

cityInput.addEventListener('input', () => {
  if (citySuppress) return;
  setError(fieldOf(cityInput), 'city', '');
  const q = normalizeQuery(cityInput.value);
  if (q.length < 2) { closeCityList(); return; }
  cityMatches = searchCities(q);
  renderCityList();
});

cityInput.addEventListener('keydown', (e) => {
  if (cityList.hidden) return;
  const items = cityList.children;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if (cityActive >= 0) items[cityActive].removeAttribute('aria-selected');
    cityActive = e.key === 'ArrowDown'
      ? (cityActive + 1) % items.length
      : (cityActive - 1 + items.length) % items.length;
    items[cityActive].setAttribute('aria-selected', 'true');
    items[cityActive].scrollIntoView({ block: 'nearest' });
    cityInput.setAttribute('aria-activedescendant', items[cityActive].id);
  } else if (e.key === 'Enter') {
    if (cityActive >= 0) {
      e.preventDefault(); // only intercept Enter while an option is highlighted
      pickCity(cityMatches[cityActive]);
    } else {
      closeCityList(); // free-typed text is fine — never a gate
    }
  } else if (e.key === 'Escape') {
    closeCityList();
  }
});

cityInput.addEventListener('blur', () => setTimeout(closeCityList, 120));

/* ——— validation ————————————————————————————————— */

const validators = {
  name(v) {
    if (!v.trim()) return 'I’ll need your name.';
    return '';
  },
  dob(v) {
    const val = v.trim();
    if (!val) return 'your date of birth — DD/MM/YYYY.';
    const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return 'DD/MM/YYYY — like 21/08/1994.';
    const day = +m[1], month = +m[2], year = +m[3];
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1920 || year > 2012) {
      return 'that date doesn’t look quite right — mind checking it?';
    }
    return '';
  },
  city(v) {
    if (!v.trim()) return 'which city are you in?';
    return '';
  },
  journey() {
    const checked = form.querySelector('input[name="journey"]:checked');
    if (!checked) return 'pick the one that fits best.';
    return '';
  },
  linkedin(v) {
    const val = v.trim();
    if (!val) return 'your LinkedIn helps me know it’s really you.';
    if (/\s/.test(val) || !val.includes('.')) {
      return 'that doesn’t look like a link — try linkedin.com/in/you.';
    }
    return '';
  },
  email(v) {
    const val = v.trim();
    if (!val) return 'I’ll need your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
      return 'hmm, that email doesn’t look quite right — mind checking it?';
    }
    return '';
  },
  whatsapp(v) {
    const val = v.replace(/[\s\-().]/g, '');
    if (!val) return 'this is where your invite lands — don’t skip it.';
    if (!/^\+?\d{8,15}$/.test(val)) {
      return 'that number looks off — include your country code, like +91.';
    }
    return '';
  },
};

function validateField(name) {
  const input = form.elements[name];
  const el = name === 'journey'
    ? form.querySelector('.field-journey')
    : fieldOf(input);
  const value = name === 'journey' ? '' : input.value;
  const msg = validators[name](value);
  setError(el, name, msg);
  return !msg;
}

// gentle DD/MM/YYYY assist — adds the slashes while typing forward
form.elements.dob.addEventListener('input', (e) => {
  if (e.inputType && e.inputType.startsWith('insert')) {
    const v = form.elements.dob.value;
    if (/^\d{2}$/.test(v) || /^\d{2}\/\d{2}$/.test(v)) form.elements.dob.value = v + '/';
  }
});

['name', 'dob', 'city', 'linkedin', 'email', 'whatsapp'].forEach((name) => {
  form.elements[name].addEventListener('blur', () => {
    if (form.elements[name].value.trim()) validateField(name);
  });
  form.elements[name].addEventListener('input', () => {
    setError(fieldOf(form.elements[name]), name, '');
  });
});

form.querySelectorAll('input[name="journey"]').forEach((r) => {
  r.addEventListener('change', () => {
    setError(form.querySelector('.field-journey'), 'journey', '');
  });
});

/* ——— submit ————————————————————————————————————— */

function normalizeLinkedIn(v) {
  let val = v.trim();
  if (val && !/^https?:\/\//i.test(val)) val = 'https://' + val;
  return val;
}

async function postToSheet(payload) {
  if (!SHEET_ENDPOINT) {
    // Preview mode — no endpoint configured yet.
    console.warn('[Founder Era] No SHEET_ENDPOINT configured. Submission (not saved):', payload);
    await new Promise((r) => setTimeout(r, 900));
    return;
  }
  // text/plain avoids a CORS preflight, which Apps Script can't answer.
  const res = await fetch(SHEET_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('sheet post failed: ' + res.status);
  const data = await res.json().catch(() => ({}));
  if (data && data.ok === false) throw new Error(data.error || 'sheet error');
}

let submitting = false;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (submitting) return;
  formError.hidden = true;

  // honeypot: bots fill it, humans never see it
  if (form.elements.website.value) {
    showDone();
    return;
  }

  const fields = ['name', 'dob', 'city', 'journey', 'linkedin', 'email', 'whatsapp'];
  const results = fields.map(validateField);
  if (results.includes(false)) {
    const firstBad = form.querySelector('.field.has-error');
    if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const payload = {
    name: form.elements.name.value.trim(),
    dob: form.elements.dob.value.trim(),
    city: form.elements.city.value.trim(),
    journey: form.querySelector('input[name="journey"]:checked').value,
    linkedin: normalizeLinkedIn(form.elements.linkedin.value),
    email: form.elements.email.value.trim().toLowerCase(),
    whatsapp: form.elements.whatsapp.value.trim(),
  };

  submitting = true;
  submitBtn.disabled = true;
  submitBtn.classList.add('is-sending');

  try {
    await postToSheet(payload);
    showDone();
  } catch (err) {
    console.error(err);
    formError.hidden = false;
    formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    submitting = false;
    submitBtn.disabled = false;
    submitBtn.classList.remove('is-sending');
    return;
  }
  submitting = false;
});

/* ——— state transition ——————————————————————————— */

function showDone() {
  stateForm.classList.add('is-leaving');
  setTimeout(() => {
    stateForm.hidden = true;
    document.body.classList.add('is-done');
    stateDone.hidden = false;
    stateDone.classList.add('is-entering');
    window.scrollTo({ top: 0, behavior: 'auto' });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => stateDone.classList.remove('is-entering'));
    });
  }, 650);
}

/* ——— share link ————————————————————————————————— */

$('shareLink').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const url = window.location.href.split('#')[0];
  if (navigator.share) {
    navigator.share({
      title: 'Founder Era',
      text: 'in my Founder era — a small, closed space for women founders.',
      url,
    }).catch(() => {});
  } else {
    try {
      await navigator.clipboard.writeText(url);
      const orig = btn.textContent;
      btn.textContent = 'link copied.';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    } catch { /* clipboard unavailable — nothing graceful left to do */ }
  }
});
