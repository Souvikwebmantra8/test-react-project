import { useState } from 'react';
import '../css/app.css';
import '../css/qwicbookpro-style.css';
import { insertAppointments } from '../config/api';
import { getLogin } from '../utils/storage';

function BookAppointment({ serviceId, serviceName, selectedDate, selectedTimeSlot, onBack }) {
  const [formData, setFormData] = useState({
    visitorName: '',
    appointmentReason: '',
    additionalMobileNo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Format date from YYYY-MM-DD to "dd MMM, yyyy, Day" format (e.g., "18 Mar, 2025, Tue")
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[date.getDay()];
    
    return `${day} ${month}, ${year}, ${dayName}`;
  };

  // Format date for API: "Mon Dec 08 2025" format
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${dayName} ${month} ${day} ${year}`;
  };

  // Format time display (e.g., "11:00 | TKN : 1")
  const formatTimeDisplay = () => {
    if (!selectedTimeSlot) return '';
    const time = selectedTimeSlot.time || '';
    const token = selectedTimeSlot.token || '';
    return `${time} | TKN : ${token}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for Additional Mobile No. field
    if (name === 'additionalMobileNo') {
      // Only allow digits and limit to 10 characters
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess(false);
    
    // Validation
    if (!formData.visitorName.trim()) {
      setError('Please enter visitor name');
      return;
    }
    
    if (!formData.appointmentReason.trim()) {
      setError('Please enter appointment reason');
      return;
    }
    
    // Validate Additional Mobile No. if provided
    if (formData.additionalMobileNo.trim()) {
      const mobileNo = formData.additionalMobileNo.trim();
      
      // Check if it's exactly 10 digits
      if (mobileNo.length !== 10) {
        setError('Additional Mobile No. must be exactly 10 digits');
        return;
      }
      
      // Check if it starts with 6, 7, 8, or 9
      const firstDigit = mobileNo.charAt(0);
      if (!['6', '7', '8', '9'].includes(firstDigit)) {
        setError('Additional Mobile No. must start with 6, 7, 8, or 9');
        return;
      }
    }
    
    // Get AdminUserMasterID from localStorage
    const loginData = getLogin();
    
    if (!loginData || !loginData.userData || !loginData.userData.AdminUserMasterID) {
      setError('AdminUserMasterID not found. Please login again.');
      return;
    }
    
    if (!selectedTimeSlot || !selectedTimeSlot.apserviceTransID) {
      setError('Time slot information is missing. Please select a time slot again.');
      return;
    }
    
    if (!selectedDate) {
      setError('Date information is missing. Please select a date again.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Format date for API: "Mon Dec 08 2025"
      const bookedForDate = formatDateForAPI(selectedDate);
      
      // Prepare API data
      const adminUserMasterID = loginData.userData.AdminUserMasterID;
      const apserviceTransID = selectedTimeSlot.apserviceTransID;
      const patientName = formData.visitorName.trim();
      const remarks = formData.appointmentReason.trim();
      const alternateMobile = formData.additionalMobileNo.trim();
      
      console.log('[BookAppointment] Booking data:', {
        adminUserMasterID,
        apserviceTransID,
        patientName,
        remarks,
        bookedForDate,
        alternateMobile
      });
      
      // Call the API
      const response = await insertAppointments(
        adminUserMasterID,
        apserviceTransID,
        patientName,
        remarks,
        bookedForDate,
        alternateMobile
      );
      
      console.log('[BookAppointment] API response:', response);
      
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
          visitorName: '',
          appointmentReason: '',
          additionalMobileNo: ''
        });
        
        // Show success message and navigate back after 2 seconds
        setTimeout(() => {
          setSuccess(false);
          if (onBack) {
            onBack();
          }
        }, 2000);
      } else {
        setError('Failed to book appointment. Please try again.');
      }
      
    } catch (err) {
      console.error('[BookAppointment] Error:', err);
      setError(err.message || 'Failed to book appointment. Please check your connection and try again.');
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
            <button className="back-btn" onClick={onBack} title="Go Back">
              <i className="bi bi-arrow-left"></i>
            </button>
            <h1 className="ms-2 page-title">Book an Appointment</h1>
          </div>
          <div className="rightPart">
          </div>
        </div>
      </header>
      
      {/* Booking Form Area */}
      <div className="qwicbokkProSec">
        <div className="app-wrapper">
          <div className="qwicbokkProSecinner">
            <div className="qwicbokkProFormArea">
              {/* Booking Info */}
              <div className="mt-4 mb-3 form-group">
                <div className="bookingInfo">
                  <div className="mb-2 bookingInfoItem">
                    <span className="title">Date</span>
                    <span className="txt">{formatDateDisplay(selectedDate)}</span>
                  </div>
                  <div className="bookingInfoItem">
                    <span className="title">Time</span>
                    <span className="txt">{formatTimeDisplay()}</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="alert alert-success mt-3" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Appointment Booked Successfully
                </div>
              )}

              {/* Visitor Name */}
              <div className="mb-3 form-group">
                <label className="labelName">Visitor Name</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <img src="/images/visitors.png" className="img-fluid" alt="" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Visitor Name"
                    name="visitorName"
                    value={formData.visitorName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Appointment Reason */}
              <div className="mb-3 form-group">
                <label className="labelName">Appointment Reson</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <img src="/images/date-time.png" className="img-fluid" alt="" />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Appointment Reson"
                    name="appointmentReason"
                    value={formData.appointmentReason}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Additional Mobile No. */}
              <div className="mb-4 form-group">
                <label className="labelName">Additional Mobile No.</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <img src="/images/contact-book.png" className="img-fluid" alt="" />
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Additional Mobile No."
                    name="additionalMobileNo"
                    value={formData.additionalMobileNo}
                    onChange={handleInputChange}
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                  />
                </div>
              </div>

              {/* Submit Button */}
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
                      Booking...
                    </>
                  ) : (
                    'Book Appointment'
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

export default BookAppointment;

