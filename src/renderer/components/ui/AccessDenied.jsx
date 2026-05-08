import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 56px)',
      padding: '40px'
    }}>
      <Lock style={{ width: '56px', height: '56px', color: '#64748b', marginBottom: '20px' }} />
      <h2 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: '#0f172a',
        margin: '0 0 8px 0'
      }}>
        Access restricted
      </h2>
      <p style={{
        fontSize: '14px',
        color: '#64748b',
        maxWidth: '400px',
        textAlign: 'center',
        margin: '0 0 28px 0'
      }}>
        You don't have permission to access this page. Please contact your administrator if you believe this is an error.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          padding: '10px 20px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#374151',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#f9fafb';
          e.target.style.borderColor = '#d1d5db';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'white';
          e.target.style.borderColor = '#e5e7eb';
        }}
      >
        Go back to dashboard
      </button>
    </div>
  );
}
