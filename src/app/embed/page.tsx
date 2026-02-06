import { Metadata } from "next";
import { CodeBlock, SmallCodeBlock } from "./CodeBlock";

export const metadata: Metadata = {
  title: "Embed Tip Widget | Agentokratia",
  description: "Add a tip button to any website. One line of code.",
};

export default function EmbedPage() {
  return (
    <main className="main-content" style={{ padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Hero */}
        <header style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{
            fontSize: "40px",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            marginBottom: "16px"
          }}>
            Embed Tip Widget
          </h1>
          <p style={{
            fontSize: "18px",
            color: "var(--text-muted)",
            maxWidth: "500px",
            margin: "0 auto"
          }}>
            Add a tip button to any website. GitHub READMEs, blogs, portfolios.
            One line of code. Zero fees.
          </p>
        </header>

        {/* Quick Start */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Quick Start</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>
            Add these two lines to your HTML:
          </p>
          <CodeBlock code={`<script src="https://tip.agentokratia.com/widget.js"></script>
<div data-tip-widget data-recipient="YOUR_BASENAME"></div>`} />
        </section>

        {/* Live Examples */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Live Examples</h2>

          {/* Standard Widget */}
          <div style={{
            background: "var(--bg-card)",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid var(--border)"
          }}>
            <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Standard Widget</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>
              Full widget with recipient info
            </p>
            <div style={{
              background: "var(--paper)",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "16px"
            }}>
              <iframe
                src="/widget?recipient=jesse.base.eth&amount=5"
                title="Standard tip widget for jesse.base.eth"
                loading="lazy"
                style={{
                  border: "none",
                  width: "320px",
                  height: "180px",
                  display: "block"
                }}
              />
            </div>
            <SmallCodeBlock code={`<div data-tip-widget data-recipient="jesse.base.eth"></div>`} />
          </div>

          {/* Compact Button */}
          <div style={{
            background: "var(--bg-card)",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid var(--border)"
          }}>
            <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Compact Button</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>
              Minimal button for inline use
            </p>
            <div style={{
              background: "var(--paper)",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "16px"
            }}>
              <iframe
                src="/widget?recipient=jesse.base.eth&amount=5&compact=true"
                title="Compact tip button for jesse.base.eth"
                loading="lazy"
                style={{
                  border: "none",
                  width: "120px",
                  height: "50px",
                  display: "block"
                }}
              />
            </div>
            <SmallCodeBlock code={`<div data-tip-widget data-recipient="jesse.base.eth" data-compact="true"></div>`} />
          </div>

          {/* Custom Colors */}
          <div style={{
            background: "var(--bg-card)",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid var(--border)"
          }}>
            <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Custom Accent Color</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>
              Match your brand
            </p>
            <div style={{
              background: "var(--paper)",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "16px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap"
            }}>
              <iframe
                src="/widget?recipient=jesse.base.eth&amount=10&compact=true&accent=22C55E"
                title="Tip button with green accent"
                loading="lazy"
                style={{ border: "none", width: "120px", height: "50px" }}
              />
              <iframe
                src="/widget?recipient=jesse.base.eth&amount=10&compact=true&accent=F59E0B"
                title="Tip button with orange accent"
                loading="lazy"
                style={{ border: "none", width: "120px", height: "50px" }}
              />
              <iframe
                src="/widget?recipient=jesse.base.eth&amount=10&compact=true&accent=EC4899"
                title="Tip button with pink accent"
                loading="lazy"
                style={{ border: "none", width: "120px", height: "50px" }}
              />
            </div>
            <SmallCodeBlock code={`<div data-tip-widget data-recipient="jesse.base.eth" data-accent="22C55E"></div>`} />
          </div>

          {/* Dark Theme */}
          <div style={{
            background: "var(--bg-dark, #1a1a1a)",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid var(--border-dark, #333)"
          }}>
            <h3 style={{ fontSize: "16px", marginBottom: "8px", color: "#fff" }}>Dark Theme</h3>
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "16px" }}>
              For dark backgrounds
            </p>
            <div style={{
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "16px"
            }}>
              <iframe
                src="/widget?recipient=jesse.base.eth&amount=5&theme=dark"
                title="Dark theme tip widget for jesse.base.eth"
                loading="lazy"
                style={{
                  border: "none",
                  width: "320px",
                  height: "180px",
                  display: "block"
                }}
              />
            </div>
            <SmallCodeBlock code={`<div data-tip-widget data-recipient="jesse.base.eth" data-theme="dark"></div>`} dark />
          </div>
        </section>

        {/* Options Reference */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Options</h2>
          <div style={{
            background: "var(--bg-card)",
            borderRadius: "12px",
            overflow: "auto",
            border: "1px solid var(--border)"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "500px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th scope="col" style={{ padding: "12px 16px", textAlign: "left" }}>Attribute</th>
                  <th scope="col" style={{ padding: "12px 16px", textAlign: "left" }}>Description</th>
                  <th scope="col" style={{ padding: "12px 16px", textAlign: "left" }}>Default</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}><code>data-recipient</code></td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Basename, ENS, or address</td>
                  <td style={{ padding: "12px 16px" }}>Required</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}><code>data-amount</code></td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Default tip amount in USD</td>
                  <td style={{ padding: "12px 16px" }}>5</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}><code>data-theme</code></td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>light or dark</td>
                  <td style={{ padding: "12px 16px" }}>light</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}><code>data-accent</code></td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Accent color (hex without #)</td>
                  <td style={{ padding: "12px 16px" }}>0052FF</td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px" }}><code>data-compact</code></td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>true for button-only mode</td>
                  <td style={{ padding: "12px 16px" }}>false</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Cases */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Use Cases</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px"
          }}>
            {[
              { icon: "📦", title: "Open Source", desc: "Tip maintainers on GitHub READMEs" },
              { icon: "✍️", title: "Blogs", desc: "Let readers support your writing" },
              { icon: "🎨", title: "Portfolios", desc: "Accept tips for your creative work" },
              { icon: "📚", title: "Documentation", desc: "Reward helpful docs contributors" },
              { icon: "🎙️", title: "Podcasts", desc: "Listener support without subscriptions" },
              { icon: "🎮", title: "Games", desc: "Tips for indie game developers" },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "var(--bg-card)",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{item.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>{item.title}</div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Why Use This?</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px"
          }}>
            {[
              { title: "Zero Fees", desc: "100% goes to the recipient" },
              { title: "Any Token", desc: "Payers use any token, you get USDC" },
              { title: "Basenames", desc: "Use your .base.eth name" },
              { title: "One Line", desc: "Copy-paste integration" },
              { title: "Customizable", desc: "Match your brand colors" },
              { title: "Gasless", desc: "Payers don't pay gas fees" },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" aria-hidden="true" style={{ marginTop: "2px", flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "2px" }}>{item.title}</div>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
