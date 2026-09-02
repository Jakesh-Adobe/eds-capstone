export default function decorate(widget) {
  const form = widget.querySelector('.newsletter-form');
  const input = widget.querySelector('#newsletter-email');
  const message = widget.querySelector('.newsletter-message');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valid = input.checkValidity() && input.value.trim().length > 0;
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid) {
      message.textContent = 'Please enter a valid email address.';
      message.dataset.state = 'error';
      input.focus();
      return;
    }
    // no backend in this project — confirm locally and reset
    message.textContent = 'Thanks! Check your inbox to confirm your subscription.';
    message.dataset.state = 'success';
    form.reset();
  });
}
