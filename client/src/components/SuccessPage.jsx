import { useEffect } from 'react';
import '../css/app.css';
import '../css/login.css';

function SuccessPage() {
  useEffect(() => {
    // Optional: Auto-redirect after 3 seconds
    // Uncomment the lines below if you want auto-redirect
    // const timer = setTimeout(() => {
    //   // Redirect to dashboard or home page
    //   window.location.href = '/dashboard';
    // }, 3000);
    // return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app-container auth-container">
      <section className="auth-hero">
        <div className="auth-brand">
          <i className="bi bi-check-circle-fill" style={{ color: '#10b981' }}></i>
        </div>
        <h1>Login Successful!</h1>
        <p>Welcome to QwicbookPro. You have successfully logged in to your account.</p>
      </section>
      <main className="auth-body">
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ marginBottom: '30px' }}>
              <i 
                className="bi bi-check-circle-fill" 
                style={{ 
                  fontSize: '80px', 
                  color: '#10b981', 
                  marginBottom: '20px',
                  display: 'block',
                  animation: 'fadeIn 0.5s ease-in'
                }}
              ></i>
            </div>
            <h2 style={{ color: 'var(--dark-color)', marginBottom: '15px', fontSize: '28px' }}>
              Successfully Logged In
            </h2>
            <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '16px', lineHeight: '1.6' }}>
              Your credentials have been verified. You can now access all features of the application, 
              manage appointments, track patients, and stay on top of your clinic day.
            </p>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="app-footer">
        Need help? Contact support@omclinic.com
      </footer>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default SuccessPage;

