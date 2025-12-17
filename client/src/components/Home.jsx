import '../css/app.css';
import '../css/login.css';

function Home({ userEmail, userData, onLogout }) {
  return (
    <div className="app-container auth-container">
      <section className="auth-hero">
        <div className="auth-brand">
          <i className="bi bi-heart-pulse-fill"></i>
        </div>
        <h1>QwicbookPro</h1>
        <p>Welcome back! Manage your appointments and track your patients.</p>
      </section>
      <main className="auth-body">
        <div className="auth-card">
          <div style={{ padding: '40px 20px' }}>
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
              <i 
                className="bi bi-person-circle" 
                style={{ 
                  fontSize: '64px', 
                  color: 'var(--primary-color)', 
                  marginBottom: '20px',
                  display: 'block'
                }}
              ></i>
              <h2 style={{ color: 'var(--dark-color)', marginBottom: '10px', fontSize: '24px' }}>
                Welcome, Doctor!
              </h2>
              {userEmail && (
                <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
                  Logged in as: {userEmail}
                </p>
              )}
            </div>

            {/* Display User Data */}
            {userData && (
              <div style={{ 
                marginBottom: '30px', 
                padding: '20px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ color: 'var(--dark-color)', marginBottom: '15px', fontSize: '18px' }}>
                  User Information
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Admin User Master ID:</span>
                    <span style={{ color: 'var(--dark-color)', fontWeight: '600' }}>{userData.AdminUserMasterID || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>City:</span>
                    <span style={{ color: 'var(--dark-color)', fontWeight: '600' }}>{userData.City || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>City ID:</span>
                    <span style={{ color: 'var(--dark-color)', fontWeight: '600' }}>{userData.CityID || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>Mobile:</span>
                    <span style={{ color: 'var(--dark-color)', fontWeight: '600' }}>{userData.Mobile || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>User Type:</span>
                    <span style={{ color: 'var(--dark-color)', fontWeight: '600' }}>{userData.UserType || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {!userData && (
              <div style={{ 
                marginBottom: '30px', 
                padding: '15px', 
                backgroundColor: '#fef3c7', 
                borderRadius: '8px',
                border: '1px solid #fde68a',
                textAlign: 'center'
              }}>
                <p style={{ color: '#92400e', fontSize: '14px', margin: 0 }}>
                  <i className="bi bi-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                  User data not available
                </p>
              </div>
            )}
            
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: 'var(--dark-color)', marginBottom: '20px', fontSize: '18px' }}>
                Quick Actions
              </h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <button className="primary-btn" style={{ width: '100%', textAlign: 'left', padding: '15px 20px' }}>
                  <i className="bi bi-calendar-check" style={{ marginRight: '10px' }}></i>
                  View Appointments
                </button>
                <button className="primary-btn" style={{ width: '100%', textAlign: 'left', padding: '15px 20px' }}>
                  <i className="bi bi-people" style={{ marginRight: '10px' }}></i>
                  Manage Patients
                </button>
                <button className="primary-btn" style={{ width: '100%', textAlign: 'left', padding: '15px 20px' }}>
                  <i className="bi bi-clock-history" style={{ marginRight: '10px' }}></i>
                  Schedule Management
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '30px' }}>
              <button 
                className="primary-btn" 
                onClick={onLogout}
                style={{ 
                  width: '100%',
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444'
                }}
              >
                <i className="bi bi-box-arrow-right" style={{ marginRight: '8px' }}></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </main>
      <footer className="app-footer">
        Need help? Contact support@omclinic.com
      </footer>
    </div>
  );
}

export default Home;

