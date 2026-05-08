import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Table2, BarChart2, Users, AlertCircle, HelpCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load remembered username on mount
  useEffect(() => {
    const loadRememberedUsername = async () => {
      try {
        const result = await window.electron.getRememberedUsername();
        if (result.success && result.username) {
          setUsername(result.username);
          setRememberMe(true);
        }
      } catch (err) {
        console.error('Failed to load remembered username:', err);
      }
    };
    loadRememberedUsername();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);

    if (result.success) {
      // Handle remember me
      if (rememberMe) {
        await window.electron.rememberUsername(username);
      } else {
        await window.electron.forgetUsername();
      }

      // Show success state
      setSuccess(true);
      toast.success(`Welcome back, ${result.user.full_name} 👋`);

      // Navigate after brief delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } else {
      setError('Incorrect username or password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">

      <div className="login-left">
        <div className="login-left-bg" />
        <div className="login-left-overlay" />
        <div className="login-left-content">
          <div className="login-appname">
            <span>🎱</span>
            <span>Cue Club Manager</span>
          </div>
          <p className="login-tagline">Your club. Under control.</p>
          <div className="login-pills">
            <div className="login-pill">
              <Table2 size={16} />
              <span>Live table tracking</span>
            </div>
            <div className="login-pill">
              <BarChart2 size={16} />
              <span>Daily revenue reports</span>
            </div>
            <div className="login-pill">
              <Users size={16} />
              <span>Member management</span>
            </div>
          </div>
          <p className="login-version">v1.0.0</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">

          <div className="login-icon">
            <div className="login-icon-inner">8</div>
          </div>

          <h1 className="login-heading">Welcome back</h1>
          <p className="login-subheading">Sign in to manage your club</p>

          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <User size={18} />
                <input
                  className={`login-input ${error ? 'error' : ''}`}
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`login-input ${error ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  style={{ paddingRight: '52px' }}
                  required
                />
                <button
                  className="login-input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button">
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            <div className="login-remember">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>

            {error && (
              <div className="login-error-banner">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            <button
              className="login-btn"
              type="submit"
              disabled={isLoading || success}>
              {success ? (
                <>
                  <CheckCircle size={16} />
                  Success!
                </>
              ) : isLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="login-forgot">
              <HelpCircle size={12} />
              <span>Forgot your PIN? Contact admin.</span>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}
