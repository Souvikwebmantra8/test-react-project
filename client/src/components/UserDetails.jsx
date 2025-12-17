import { useState } from 'react';
import '../css/app.css';
import '../css/qwicbookpro-style.css';
import { deleteAppointmentWithCustomMessage } from '../config/api';

function UserDetails({ appointmentData, onBack }) {
  const [showCancelBox, setShowCancelBox] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Format date from API format to display format (e.g., "17-Nov-2025, Mon")
  // Handles both YYYY-MM-DD format and dd-MMM-yyyy format
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      let date;
      
      // Check if date is in YYYY-MM-DD format (e.g., "2025-12-10")
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        date = new Date(year, month - 1, day); // month is 0-indexed
      }
      // Check if date is in dd-MMM-yyyy format (e.g., "17-Nov-2025")
      else if (dateString.includes('-') && dateString.length === 11) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = months.indexOf(parts[1]);
          if (monthIndex !== -1) {
            date = new Date(parseInt(parts[2]), monthIndex, parseInt(parts[0]));
          } else {
            date = new Date(dateString);
          }
        } else {
          date = new Date(dateString);
        }
      } else {
        // Try parsing as standard date format (ISO or other)
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('[UserDetails] Invalid date:', dateString);
        return dateString; // Return original if invalid
      }
      
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = days[date.getDay()];
      
      return `${day}-${month}-${year}, ${dayName}`;
    } catch (err) {
      console.error('[UserDetails] Error formatting date:', err, dateString);
      return dateString;
    }
  };

  // Format time range (e.g., "11:00 TO 11:15")
  const formatTimeRange = (fromTime, toTime) => {
    if (!fromTime) return '';
    
    const formatTime = (timeString) => {
      if (!timeString) return '';
      // If already in HH:mm format, convert to 12-hour
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      }
      return timeString;
    };
    
    const from = formatTime(fromTime);
    const to = toTime ? formatTime(toTime) : '';
    
    return to ? `${from} TO ${to}` : from;
  };


  const handleCancelCheckboxChange = (e) => {
    setShowCancelBox(e.target.checked);
    if (!e.target.checked) {
      setCancelReason('');
      setCancelError(null);
      setCancelSuccess(false);
    }
  };

  const handleCancelReasonChange = (e) => {
    const value = e.target.value;
    // Limit to 200 characters
    if (value.length <= 200) {
      setCancelReason(value);
      setCancelError(null);
    }
  };

  const handleCancelAppointment = async () => {
    // Validation
    if (!cancelReason.trim()) {
      setCancelError('Cancellation reason is required');
      return;
    }

    if (cancelReason.length > 200) {
      setCancelError('Cancellation reason must be 200 characters or less');
      return;
    }

    if (!appointmentData?.AppointmentBookingID) {
      setCancelError('Appointment ID is missing');
      return;
    }

    try {
      setIsCancelling(true);
      setCancelError(null);
      
      const response = await deleteAppointmentWithCustomMessage(
        appointmentData.AppointmentBookingID,
        cancelReason.trim()
      );
      
      console.log('[UserDetails] Cancel appointment response:', response);
      
      // Convert response to number for comparison
      const responseValue = Number(response);
      
      // Check if response is 1 (success)
      if (responseValue === 1 || response === '1' || response === 1) {
        setCancelSuccess(true);
        setCancelError(null);
        
        // Auto-dismiss success message and navigate back after 2 seconds
        setTimeout(() => {
          setCancelSuccess(false);
          if (onBack) {
            onBack();
          }
        }, 2000);
      } 
      // Check if response is 0 (error)
      else if (responseValue === 0 || response === '0' || response === 0) {
        setCancelError('Something went wrong. Try again.');
      } 
      // Other error cases
      else {
        setCancelError('Failed to cancel appointment. Please try again.');
      }
    } catch (err) {
      console.error('[UserDetails] Error cancelling appointment:', err);
      setCancelError(err.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // If no appointment data, show error
  if (!appointmentData) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="w-100 d-flex justify-content-between align-items-center innerPage-app-header">
            <div className="d-flex align-items-center leftPert">
              <button className="back-btn" onClick={onBack} title="Go Back">
                <i className="bi bi-arrow-left"></i>
              </button>
              <h1 className="ms-2 page-title">User Details</h1>
            </div>
            <div className="rightPart"></div>
          </div>
        </header>
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>No appointment details found.</p>
        </div>
      </div>
    );
  }

  // Extract data from appointmentData (passed from AppointmentList)
  const displayDate = appointmentData.AppointmentDate || '';
  const patientName = appointmentData.PatientName || 'N/A';
  const remarks = appointmentData.Remarks || 'None';
  const fromTime = appointmentData.FromTime || '';
  const toTime = appointmentData.ToTime || '';
  const mobile = appointmentData.Mobile || '';
  
  // Format remarks with mobile if available
  const remarksDisplay = mobile ? `${mobile} - ${remarks}` : remarks;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="w-100 d-flex justify-content-between align-items-center innerPage-app-header">
          <div className="d-flex align-items-center leftPert">
            <button className="back-btn" onClick={onBack} title="Go Back">
              <i className="bi bi-arrow-left"></i>
            </button>
            <h1 className="ms-2 page-title">User Details</h1>
          </div>
          <div className="rightPart"></div>
        </div>
      </header>
      
      {/* Date Bar */}
      <div className="userDetailsTopBar">
        <div className="app-wrapper">
          <div className="text-end userDetailsTopBarinner">
            <div className="d-inline-flex align-items-center dataTime">
              <span className="icon">
                <img src="/images/timetable-icon.png" className="img-fluid" alt="Time" style={{ height: '22px' }} />
              </span>
              <span className="txt">{formatDateDisplay(displayDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Section */}
      <div className="qwicbokkProSec userDetailsSec">
        <div className="app-wrapper">
          <div className="qwicbokkProSecinner userDetailsSecinner">
            <div className="qwicbokkProFormArea userDetailsInfoFormArea">
              <div className="mb-3 form-group userDetailsInfoArea">
                <div className="userDetailsInfoItem">
                  <h4 className="title">Name</h4>
                  <p className="mb-0 para">{patientName}</p>
                </div>
                <div className="userDetailsInfoItem">
                  <h4 className="title">Remark</h4>
                  <p className="mb-0 para">{remarksDisplay}</p>
                </div>
                <div className="userDetailsInfoItem">
                  <h4 className="title">Time</h4>
                  <p className="para">{formatTimeRange(fromTime, toTime)}</p>
                  <p className="mb-0 para">On Time!</p>
                </div>
              </div>
              
              {/* Cancel Appointment Checkbox */}
              <div className="form-group">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="check1" 
                    name="option1" 
                    value="something"
                    checked={showCancelBox}
                    onChange={handleCancelCheckboxChange}
                  />
                  <label className="form-check-label" htmlFor="check1" style={{ fontSize: '14px' }}>
                    Cancel this appointment
                  </label>
                </div>
              </div>
              
              {/* Cancel Reason Box */}
              {showCancelBox && (
                <div className="hideBox" style={{ display: 'block' }}>
                  {/* Error Message */}
                  {cancelError && (
                    <div className="alert alert-danger mb-3" role="alert" style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginBottom: '15px'
                    }}>
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      {cancelError}
                    </div>
                  )}
                  
                  {/* Success Message */}
                  {cancelSuccess && (
                    <div className="alert alert-success mb-3" role="alert" style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      marginBottom: '15px'
                    }}>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      Appointment cancelled successfully!
                    </div>
                  )}
                  
                  <div className="userInfo">
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Enter cancellation reason"
                      value={cancelReason}
                      onChange={handleCancelReasonChange}
                      maxLength={200}
                      style={{ marginBottom: '8px' }}
                      disabled={isCancelling || cancelSuccess}
                    />
                    <div style={{ 
                      fontSize: '12px', 
                      color: cancelReason.length > 200 ? '#dc3545' : '#6c757d',
                      textAlign: 'right',
                      marginBottom: '15px'
                    }}>
                      {cancelReason.length}/200 characters
                    </div>
                  </div>
                  <div className="qwicbokkProFormBtnArea">
                    <button 
                      type="button" 
                      className="w-100 btn qwicbokkProFormBtn"
                      onClick={handleCancelAppointment}
                      disabled={isCancelling || cancelSuccess || !cancelReason.trim()}
                      style={{
                        opacity: (isCancelling || cancelSuccess || !cancelReason.trim()) ? 0.6 : 1,
                        cursor: (isCancelling || cancelSuccess || !cancelReason.trim()) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isCancelling ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Cancelling...
                        </>
                      ) : (
                        'Cancel appointment'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetails;

