import { useState } from 'react';
import '../css/app.css';
import '../css/qwicbookpro-style.css';
import { insertLateDetails } from '../config/api';
import { getLogin } from '../utils/storage';

function SetTimeoutDelay({ onBack }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [reachOfficeBy, setReachOfficeBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  // Format date from YYYY-MM-DD to dd-MMM-yyyy (e.g., "12-Dec-2025")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  // Format time from HH:mm to HH:mm (already in correct format, but ensure it's valid)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Time input already returns HH:mm format, so just return it
    return timeString;
  };

  const handleSubmit = async () => {
    console.log('[SetTimeoutDelay] Form submitted:', { selectedDate, reachOfficeBy });
    
    // Clear previous messages
    setError('');
    setSuccess(false);
    
    // Validation
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    
    if (!reachOfficeBy) {
      setError('Please select a time');
      return;
    }
    
    // Get AdminUserMasterID from localStorage
    const loginData = getLogin();
    
    if (!loginData || !loginData.userData || !loginData.userData.AdminUserMasterID) {
      setError('AdminUserMasterID not found. Please login again.');
      return;
    }
    
    const adminUserMasterID = loginData.userData.AdminUserMasterID;
    
    // Format date and time
    const formattedDate = formatDate(selectedDate);
    const formattedTime = formatTime(reachOfficeBy);
    
    console.log('[SetTimeoutDelay] Formatted data:', {
      adminUserMasterID,
      formattedDate,
      formattedTime
    });
    
    setLoading(true);
    
    try {
      // Call the API
      const response = await insertLateDetails(adminUserMasterID, formattedDate, formattedTime);
      
      console.log('[SetTimeoutDelay] API response:', response);
      
      // Check if the request was successful
      // API returns 1 on success, so check for response value of 1
      let isSuccess = false;
      
      // Handle different response formats
      if (typeof response === 'object' && response !== null) {
        // Check if response.data is 1
        if (response.data === 1 || response.data === '1') {
          isSuccess = true;
        }
        // Check if response itself has value 1
        else if (response.value === 1 || response.value === '1') {
          isSuccess = true;
        }
        // Check for success property
        else if (response.success === true) {
          isSuccess = true;
        }
      } else {
        // Direct value check (response is 1 or "1")
        if (response === 1 || response === '1' || String(response).trim() === '1') {
          isSuccess = true;
        }
      }
      
      if (isSuccess) {
        setSuccess(true);
        // Reset form
        setSelectedDate('');
        setReachOfficeBy('');
        
        // Show success message
        setTimeout(() => {
          setSuccess(false);
          if (onBack) {
            onBack();
          }
        }, 2000);
      } else {
        setError('Failed to save delay details. Please try again.');
      }
    } catch (err) {
      console.error('[SetTimeoutDelay] Error:', err);
      setError(err.message || 'Unable to save delay details. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="w-100 d-flex justify-content-between align-items-center innerPage-app-header">
          <div className="d-flex align-items-center leftPert">
            <button className="back-btn" onClick={handleBack} title="Go Back">
              <i className="bi bi-arrow-left"></i>
            </button>
            <h1 className="ms-2 page-title">Set Your date and time for delay </h1>
          </div>
          <div className="rightPart">
          </div>
        </div>
      </header>

      {/* My Service List Area */}
      <div className="qwicbokkProSec">
        <div className="app-wrapper">
          <div className="qwicbokkProSecinner">
            <div className="qwicbokkProFormArea">
              <div className="mt-4 form-group">
                <label className="labelName">Selet Date</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <img src="/images/calendar.png" className="img-fluid" alt="" />
                  </span>
                  <input 
                    type="date" 
                    className="form-control" 
                    placeholder=""
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="labelName">I Will Reach Office By</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <img src="/images/clock.png" className="img-fluid" alt="" />
                  </span>
                  <input 
                    type="time" 
                    className="form-control" 
                    placeholder=""
                    value={reachOfficeBy}
                    onChange={(e) => setReachOfficeBy(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success mt-3" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Delay details saved successfully!
                </div>
              )}
              <div className="qwicbokkProFormBtnArea">
                <button 
                  type="button" 
                  className="w-100 btn qwicbokkProFormBtn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetTimeoutDelay;

