import { useEffect, useState } from 'react';
import '../css/app.css';
import { getUserInformation } from '../config/api';
import { getLogin } from '../utils/storage';

function About({ onBack }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user information when component mounts
    fetchUserInformation();
  }, []);

  const fetchUserInformation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get AdminUserMasterID from localStorage
      const loginData = getLogin();
      
      if (!loginData || !loginData.userData || !loginData.userData.AdminUserMasterID) {
        throw new Error('AdminUserMasterID not found. Please login again.');
      }

      const adminUserMasterID = loginData.userData.AdminUserMasterID;
      console.log('[About] Fetching user information for AdminUserMasterID:', adminUserMasterID);

      // Call GetUserInformation API
      const userInfoData = await getUserInformation(adminUserMasterID);
      
      console.log('[About] User information received:', userInfoData);
      setUserInfo(userInfoData);
    } catch (err) {
      console.error('[About] Error fetching user information:', err);
      setError(err.message || 'Failed to load user information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content app-header-two">
          <div className="header-inner-left">
            <button className="back-btn" onClick={handleBack} title="Go Back">
              <i className="bi bi-arrow-left"></i>
            </button>
            <h1 className="clinic-title">About Us</h1>
          </div>
          <div className="header-actions">
            <button className="header-btn" title="Menu">
              <i className="bi bi-three-dots-vertical"></i>
            </button>
          </div>
        </div>
      </header>

      {/* About Section */}
      <div className="appointments-container">
        {loading && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ marginTop: '15px', color: '#64748b' }}>Loading user information...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ 
              padding: '20px', 
              backgroundColor: '#fef3c7', 
              borderRadius: '8px',
              border: '1px solid #fde68a',
              color: '#92400e'
            }}>
              <i className="bi bi-exclamation-triangle" style={{ marginRight: '8px' }}></i>
              {error}
            </div>
            <button 
              className="primary-btn" 
              onClick={fetchUserInformation}
              style={{ marginTop: '15px' }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && userInfo && (
          <div className="about-sec">
            <div className="about-header">
              <div className="about-top-left">
                <div className="about-top-img">Q</div>
              </div>
              <div className="about-top-right">
                <p>Version: 3.0</p>
                <p>{userInfo.RegisteredEmailID || 'Support@quickbook.com'}</p>
              </div>
            </div>
            <div className="about-bottom">
              <ul>
                <li>
                  <h4>Email:</h4>
                  <p>{userInfo.RegisteredEmailID || 'N/A'}</p>
                </li>
                <li>
                  <h4>Phone:</h4>
                  <p>{userInfo.RegisteredMobile || userInfo.SupportMobileNumber1 || 'N/A'}</p>
                </li>
                <li>
                  <h4>Customer No:</h4>
                  <p>{userInfo.CustomerNumber || 'N/A'}</p>
                </li>
                <li>
                  <h4>Subscription End On:</h4>
                  <p>{userInfo.ExpiryDate || 'N/A'}</p>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default About;


