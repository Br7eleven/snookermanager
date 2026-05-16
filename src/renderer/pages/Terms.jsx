import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import '../styles/legal.css';

export default function Terms() {
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
          <FileText size={28} />
        </div>
        <h1 className="legal-title">Terms &amp; Conditions</h1>
        <p className="legal-meta">BR7 Technologies &amp; Co. · Last updated: May 2025</p>

        <section className="legal-section">
          <h2>1. Acceptance</h2>
          <p>
            By installing or using Cue Club Manager, you agree to these Terms &amp; Conditions set forth by
            <strong> BR7 Technologies &amp; Co.</strong> If you do not agree, please discontinue use of the software.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. License</h2>
          <p>
            BR7 Technologies &amp; Co. grants you a non-exclusive, non-transferable licence to use
            Cue Club Manager for your business operations. You may not redistribute, sell, or
            sublicense the software without written permission.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Permitted Use</h2>
          <p>This software is intended for use by snooker/billiards clubs and similar businesses to manage tables, sessions, members, and revenue. Any other use is at the user's own risk.</p>
        </section>

        <section className="legal-section">
          <h2>4. Data Responsibility</h2>
          <p>
            All business data stored within the application is your responsibility. BR7 Technologies &amp; Co. is not liable for data loss resulting from device failure, accidental deletion, or improper use. Regular backups are strongly recommended.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Disclaimer of Warranties</h2>
          <p>
            This software is provided "as is" without warranty of any kind. BR7 Technologies &amp; Co. does not guarantee uninterrupted or error-free operation of the software.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, BR7 Technologies &amp; Co. shall not be liable for any indirect, incidental, or consequential damages arising from the use of this software.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Updates</h2>
          <p>These terms may be updated from time to time. Continued use of the application after changes constitutes acceptance of the updated terms.</p>
        </section>

        <section className="legal-section">
          <h2>8. Contact</h2>
          <p>
            For any queries, reach us at{' '}
            <button className="legal-mail-link" onClick={() => window.electron.openLegal('contact')}>
              hello@br7tech.dev
            </button>
            {' '}or visit{' '}
            <button className="legal-mail-link" onClick={() => window.electron.openLegal('privacy')}>
              br7tech.dev
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}
