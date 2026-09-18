(function () {
  'use strict';

  const forms = document.querySelectorAll('[data-flow-form]');

  function errorElement(field) {
    return document.getElementById(field.getAttribute('aria-describedby'));
  }

  function validationMessage(field) {
    if (field.validity.valueMissing) return '請填寫這個欄位。';
    if (field.validity.typeMismatch) return field.type === 'email' ? 'Email 格式不正確，請確認是否包含 @。' : '請輸入正確格式。';
    if (field.validity.tooShort) return `至少需要 ${field.minLength} 個字元。`;
    if (field.validity.patternMismatch) return field.dataset.patternMessage || '格式不正確，請重新確認。';
    return '';
  }

  function validateField(field) {
    if (field.disabled || field.type === 'hidden' || field.type === 'button') return true;
    const message = validationMessage(field);
    const target = errorElement(field);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (target) target.textContent = message;
    return !message;
  }

  forms.forEach((form) => {
    form.setAttribute('novalidate', '');
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('change', () => validateField(field));
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter((field) => !field.disabled);
      const valid = fields.map(validateField).every(Boolean);
      const password = form.querySelector('[name="password"]');
      const confirmation = form.querySelector('[name="password_confirmation"]');

      if (password && confirmation && password.value !== confirmation.value) {
        const target = errorElement(confirmation);
        confirmation.setAttribute('aria-invalid', 'true');
        if (target) target.textContent = '兩次輸入的密碼不一致，請重新確認。';
        confirmation.focus();
        return;
      }

      if (!valid) {
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const next = form.dataset.next;
      const submit = form.querySelector('[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.dataset.originalText = submit.textContent;
        submit.textContent = form.dataset.loading || '資料處理中…';
      }
      window.setTimeout(() => {
        if (next) window.location.assign(next);
      }, 420);
    });
  });

  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    const input = document.getElementById(button.dataset.passwordToggle);
    if (!input) return;
    button.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.textContent = isPassword ? '隱藏' : '顯示';
      button.setAttribute('aria-label', isPassword ? '隱藏密碼' : '顯示密碼');
    });
  });

  document.querySelectorAll('[data-demo-next]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      button.setAttribute('aria-busy', 'true');
      window.setTimeout(() => window.location.assign(button.dataset.demoNext), 360);
    });
  });

  document.querySelectorAll('.upload-field input[type="file"]').forEach((input) => {
    const wrapper = input.closest('.upload-field');
    const filename = wrapper && wrapper.querySelector('[data-filename]');
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!wrapper || !filename) return;
      wrapper.classList.toggle('is-selected', Boolean(file));
      filename.textContent = file ? file.name : filename.dataset.default;
    });
  });

  const domainChoices = document.querySelectorAll('[name="domain_choice"]');
  const buyNotice = document.getElementById('domain-buy');
  domainChoices.forEach((choice) => {
    choice.addEventListener('change', () => {
      if (buyNotice) buyNotice.hidden = choice.value !== 'buy';
    });
  });
})();
