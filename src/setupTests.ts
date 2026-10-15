import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement <dialog>'s imperative API (showModal/close). This
// polyfill only kicks in when the API is missing, so it's a no-op in a real
// browser - lets components use the native <dialog> element without a modal
// library just to sidestep a test-environment limitation.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
    this.removeAttribute('open');
  };
}
