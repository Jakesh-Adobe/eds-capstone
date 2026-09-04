import { getProfile } from '../../scripts/account.js';

/**
 * loads and decorates the account overview widget (mocked profile, no auth)
 * @param {Element} widget The account widget element
 */
export default function decorate(widget) {
  const profile = getProfile();
  widget.querySelector('.account-name').textContent = profile.name;
  widget.querySelector('.account-email').textContent = profile.email;
}
