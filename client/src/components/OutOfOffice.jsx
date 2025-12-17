import { useState } from 'react';
import '../css/app.css';
import '../css/qwicbookpro-style.css';
import { insertOutOfOffice } from '../config/api';
import { getLogin } from '../utils/storage';

function OutOfOffice({ onBack }) {
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    isOutOfOffice: true,
    message: ''
  });
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Format date from YYYY-MM-DD to dd-MMM-yyyy (e.g., "04-Dec-8888")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[OutOfOffice] Form submitted:', formData);
    
    // Clear previous messages
    setError('');
    setSuccess(false);
    
    // Validation 1: Check required fields
    if (!formData.fromDate) {
      setError('Please select a From Date');
      return;
    }
    
    if (!formData.toDate) {
      setError('Please select a To Date');
      return;
    }
    
    if (!formData.message || formData.message.trim() === '') {
      setError('Please enter a message');
      return;
    }
    
    // Validation 2: Max Length 200 characters for Remarks
    if (formData.message.length > 200) {
      setError('Message cannot exceed 200 characters');
      return;
    }
    
    // Validation 3: From Date cannot be greater than To Date
    const fromDateObj = new Date(formData.fromDate);
    const toDateObj = new Date(formData.toDate);
    
    if (fromDateObj > toDateObj) {
      setError('From Date cannot be greater than To Date');
      return;
    }
    
    // Get AdminUserMasterID from localStorage
    const loginData = getLogin();
    
    if (!loginData || !loginData.userData || !loginData.userData.AdminUserMasterID) {
      setError('AdminUserMasterID not found. Please login again.');
      return;
    }
    
    const adminUserMasterID = loginData.userData.AdminUserMasterID;
    
    // Format dates
    const formattedFromDate = formatDate(formData.fromDate);
    const formattedToDate = formatDate(formData.toDate);
    const trimmedMessage = formData.message.trim();
    
    console.log('[OutOfOffice] Formatted data:', {
      adminUserMasterID,
      formattedFromDate,
      formattedToDate,
      trimmedMessage
    });
    
    setLoading(true);
    
    try {
      // Call the API
      const response = await insertOutOfOffice(adminUserMasterID, formattedFromDate, formattedToDate, trimmedMessage);
      
      console.log('[OutOfOffice] API response:', response);
      
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
        setFormData({
          fromDate: '',
          toDate: '',
          isOutOfOffice: true,
          message: ''
        });
        
        // Show success message
        setTimeout(() => {
          setSuccess(false);
          if (onBack) {
            onBack();
          }
        }, 2000);
      } else {
        setError('Failed to save out of office details. Please try again.');
      }
    } catch (err) {
      console.error('[OutOfOffice] Error:', err);
      setError(err.message || 'Unable to save out of office details. Please check your connection and try again.');
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
            <h1 className="ms-2 page-title">I am Out of Office</h1>
          </div>
          <div className="rightPart">
          </div>
        </div>
      </header>

      {/* Out of Office Form Area */}
      <div className="qwicbokkProSec">
        <div className="app-wrapper">
          <div className="qwicbokkProSecinner">
            <div className="qwicbokkProFormArea">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="labelName">From Date</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <img src="/images/calendar.png" className="img-fluid" alt="Calendar" />
                    </span>
                    <input 
                      type="date" 
                      className="form-control" 
                      name="fromDate"
                      value={formData.fromDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="labelName">To Date</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <img src="/images/calendar.png" className="img-fluid" alt="Calendar" />
                    </span>
                    <input 
                      type="date" 
                      className="form-control" 
                      name="toDate"
                      value={formData.toDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="check1" 
                      name="isOutOfOffice"
                      checked={formData.isOutOfOffice}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="check1">
                      I am Out of Office
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="labelName">Remarks <span className="text-muted">(Max 200 characters)</span></label>
                  <textarea
                    className="form-control"
                    name="message"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message here..."
                    maxLength={200}
                    required
                  />
                  <small className="text-muted">
                    {formData.message.length}/200 characters
                  </small>
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
                    Out of office details saved successfully!
                  </div>
                )}

                <div className="qwicbokkProFormBtnArea">
                  <button 
                    type="submit" 
                    className="w-100 btn qwicbokkProFormBtn"
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutOfOffice;