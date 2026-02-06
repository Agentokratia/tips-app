"use client";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <div className="footer-brand-section">
              {/* Agentokratia Logo */}
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 6L9 42H17L19 36H29L31 42H39L24 6Z" fill="currentColor" />
                <path d="M24 16L21 28H27L24 16Z" fill="var(--bg)" />
                <circle cx="13" cy="10" r="2" fill="currentColor" />
                <circle cx="24" cy="5" r="2" fill="currentColor" />
                <circle cx="35" cy="10" r="2" fill="currentColor" />
              </svg>
              <span className="footer-brand">Agentokratia</span>
            </div>
            <p className="footer-tagline">The complete stack for agent commerce.</p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <p className="footer-col-title">Product</p>
              <a href="/embed" className="footer-link">
                Embed Widget
              </a>
              <a href="https://facilitator.agentokratia.com" className="footer-link" target="_blank" rel="noopener noreferrer">
                Settlement
              </a>
              <a href="https://agentokratia.com/market.html" className="footer-link" target="_blank" rel="noopener noreferrer">
                Marketplace
              </a>
              <a href="https://agentokratia.com/id.html" className="footer-link" target="_blank" rel="noopener noreferrer">
                ID
              </a>
              <a href="https://agentokratia.com/wallet.html" className="footer-link" target="_blank" rel="noopener noreferrer">
                Wallet
              </a>
            </div>

            <div className="footer-col">
              <p className="footer-col-title">Resources</p>
              <a href="https://docs.agentokratia.com" className="footer-link" target="_blank" rel="noopener noreferrer">
                Docs
              </a>
              <a href="https://agentokratia.com/manifesto.html" className="footer-link" target="_blank" rel="noopener noreferrer">
                Manifesto
              </a>
              <a href="https://github.com/agentokratia" className="footer-link" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>

            <div className="footer-col">
              <p className="footer-col-title">Connect</p>
              <a href="https://x.com/agentokratia" className="footer-link" target="_blank" rel="noopener noreferrer">
                X / Twitter
              </a>
              <a href="https://t.me/agentokratia" className="footer-link" target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">&copy; {year} Agentokratia by Aristokrates OU.</span>
          <div className="footer-legal">
            <a href="https://agentokratia.com/privacy.html" className="footer-link" target="_blank" rel="noopener noreferrer">
              Privacy
            </a>
            <a href="https://agentokratia.com/terms.html" className="footer-link" target="_blank" rel="noopener noreferrer">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
