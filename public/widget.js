/**
 * Tip Widget Embed Script
 *
 * Usage:
 * <script src="https://tip.agentokratia.com/widget.js"></script>
 * <div data-tip-widget data-recipient="jesse.base.eth"></div>
 *
 * Options (data attributes):
 * - data-recipient: Basename, ENS, or address (required)
 * - data-amount: Default tip amount (default: 5)
 * - data-theme: "light" | "dark" (default: light)
 * - data-accent: Accent color hex without # (default: 0052FF)
 * - data-compact: "true" for button-only mode
 */
(function() {
  'use strict';

  const WIDGET_HOST = 'https://tip.agentokratia.com';
  // For local development, uncomment:
  // const WIDGET_HOST = 'http://localhost:3001';

  function createWidget(container) {
    const recipient = container.dataset.recipient;
    if (!recipient) {
      console.error('[TipWidget] Missing data-recipient attribute');
      return;
    }

    const amount = container.dataset.amount || '5';
    const theme = container.dataset.theme || 'light';
    const accent = container.dataset.accent || '0052FF';
    const compact = container.dataset.compact === 'true';

    // Build widget URL
    const params = new URLSearchParams({
      recipient,
      amount,
      theme,
      accent,
      compact: compact.toString()
    });

    const widgetUrl = `${WIDGET_HOST}/widget?${params.toString()}`;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = widgetUrl;
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';

    if (compact) {
      iframe.style.width = '120px';
      iframe.style.height = '50px';
    } else {
      iframe.style.width = '320px';
      iframe.style.height = '180px';
    }

    // Allow iframe to open popups
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin');

    container.innerHTML = '';
    container.appendChild(iframe);
  }

  function init() {
    const widgets = document.querySelectorAll('[data-tip-widget]');
    widgets.forEach(createWidget);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for dynamic usage
  window.TipWidget = {
    init: init,
    create: createWidget
  };
})();
