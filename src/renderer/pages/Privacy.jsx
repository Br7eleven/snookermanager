import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import '../styles/legal.css';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="legal-root">
      <div className="legal-header">
        <button className="legal-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="legal-content">
        <div className="legal-icon">
          <Shield size={28} />
        </div>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-meta">BR7 Technologies &amp; Co. · Last updated: May 2025</p>

        <section className="legal-section">
          <h2>1. Overview</h2>
          <p>
            Cue Club Manager is a desktop application developed and maintained by
            <strong> BR7 Technologies &amp; Co.</strong> This policy explains what data the
            application collects, how it is used, and your rights regarding that data.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Data We Collect</h2>
          <p>All data is stored <strong>locally on your device only</strong>. We do not collect, transmit, or share any data with external servers. The application stores:</p>
          <ul>
            <li>Staff login credentials (username &amp; hashed password)</li>
            <li>Member names, phone numbers, and account balances</li>
            <li>Table session records including start/end times and charges</li>
            <li>Beverage inventory and order history</li>
            <li>Business settings and pricing configuration</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How Data Is Used</h2>
          <p>All collected data is used solely to operate the Cue Club Manager application — including generating reports, managing members, and tracking sessions. No data is used for marketing or analytics purposes.</p>
        </section>

        <section className="legal-section">
          <h2>4. Data Storage</h2>
          <p>
            All data is stored in a local SQLite database file on your computer. You are responsible for securing access to the device. Use the built-in Backup feature to maintain copies of your data.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Third Parties</h2>
          <p>This application does not integrate with any third-party services. No data leaves your device during normal operation.</p>
        </section>

        <section className="legal-section">
          <h2>6. Contact</h2>
          <p>
            For privacy-related queries, contact us at{' '}
            <button className="legal-mail-link" onClick={() => window.electron.openLegal('contact')}>
              hello@br7tech.dev
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
