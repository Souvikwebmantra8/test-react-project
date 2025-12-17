import { useState } from 'react';
import '../css/app.css';
import '../css/login.css';
import { getAuthUrl } from '../config/api';

function Login({ onLoginSuccess, userEmail }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Login] Form submitted');
    console.log('[Login] Form data:', { email: formData.email, password: formData.password ? '***' : 'empty' });
    
    setError('');
    setLoading(true);

    try {
      console.log('[Login] Step 1: Generating API URL...');
      // Call local Express API proxy (which handles CORS)
      const apiUrl = getAuthUrl(formData.email, formData.password);
      console.log('[Login] Step 2: API URL generated:', apiUrl);
      console.log('[Login] Step 3: Full URL will be:', window.location.origin + apiUrl);
      console.log('[Login] Step 4: Making fetch request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('[Login] Step 4: Response received');
      console.log('[Login] Response status:', response.status);
      console.log('[Login] Response statusText:', response.statusText);
      console.log('[Login] Response ok:', response.ok);
      console.log('[Login] Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is OK
      if (!response.ok) {
        console.error('[Login] Step 5: Response NOT OK - Status:', response.status);
        console.error('[Login] Response URL:', response.url);
        const errorText = await response.text();
        console.error('[Login] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('[Login] Step 5: Response OK, parsing JSON...');
      // Parse response
      const data = await response.json();
      console.log('[Login] Step 6: Parsed response data:', data);
      console.log('[Login] Step 7: Checking if login successful...');
      
      // Check if login is successful
      // Handle multiple response formats:
      // 1. Object with success property: {success: true, data: true, ...}
      // 2. Object with data property: {data: true, ...}
      // 3. Direct boolean: true
      // 4. String: "true"
      // 5. Number: 1
      let isSuccess = false;
      
      if (typeof data === 'object' && data !== null) {
        // Check for success property first
        if (data.success === true || data.success === 'true' || data.success === 1) {
          isSuccess = true;
        }
        // Check for data property (nested success indicator)
        else if (data.data === true || data.data === 'true' || data.data === 1) {
          isSuccess = true;
        }
        // Check if the object itself represents success
        else if (data === true) {
          isSuccess = true;
        }
      } else {
        // Handle primitive values: boolean, string, number
        isSuccess = data === true || data === 'true' || data === 1 || String(data).toLowerCase() === 'true';
      }
      
      console.log('[Login] Step 8: Is login successful?', isSuccess);
      console.log('[Login] Step 8: Data type:', typeof data);
      console.log('[Login] Step 8: Data structure:', JSON.stringify(data));
      
      if (isSuccess) {
        // Login successful
        console.log('[Login] Step 9: Login SUCCESS - calling onLoginSuccess with email:', formData.email);
        if (onLoginSuccess) {
          // Pass the email to store in localStorage
          onLoginSuccess(formData.email);
        }
      } else {
        // Login failed
        console.log('[Login] Step 9: Login FAILED - incorrect credentials');
        console.log('[Login] Step 9: Response data:', data);
        setError('Incorrect email or password. Please try again.');
      }
    } catch (err) {
      console.error('[Login] ERROR CAUGHT:', err);
      console.error('[Login] Error name:', err.name);
      console.error('[Login] Error message:', err.message);
      console.error('[Login] Error stack:', err.stack);
      setError('Unable to connect to server. Please check your internet connection and try again.');
    } finally {
      console.log('[Login] Step 10: Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="app-container auth-container">
      <section className="auth-hero">
        <div className="auth-brand">
          <i className="bi bi-heart-pulse-fill"></i>
        </div>
        <h1>QwicbookPro</h1>
        <p>Sign in to manage appointments, track patients, and stay on top of your clinic day.</p>
      </section>
      <main className="auth-body">
        <div className="auth-card">
          <div>
            <h2>Welcome back</h2>
            <p>Log in with your registered email ID and password.</p>
          </div>
          {error && (
            <div className="error-message">
              <i className="bi bi-exclamation-circle-fill"></i>
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label className="input-label" htmlFor="email">Email ID</label>
              <div className="input-wrapper">
                <i className="bi bi-envelope"></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="auth-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="login-input-group" style={{ marginTop: '18px' }}>
              <div className="d-flex justify-content-between align-items-center">
                <label className="input-label" htmlFor="password">Password</label>
                <div className="auth-links">
                  <a href="#">Forgot password?</a>
                </div>
              </div>
              <div className="input-wrapper">
                <i className="bi bi-lock"></i>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="auth-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="primary-btn" 
              style={{ marginTop: '28px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" style={{ marginRight: '8px' }}></span>
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>
        </div>
      </main>
      <footer className="app-footer">
        Need help? Contact support@omclinic.com
      </footer>
    </div>
  );
}
export default Login;