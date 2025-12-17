import { useState, useEffect } from 'react';
import '../css/app.css';
import '../css/time-selection-style.css';
import { getSchedule } from '../config/api';

function TimeSelection({ serviceId, serviceName, selectedDate, onBack, onTimeSelect }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Format date from YYYY-MM-DD to dd-MMM-yyyy (e.g., "03-Dec-2025")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get current time in HH:mm format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Check if selected date is today
  const isToday = (dateString) => {
    const today = getTodayDate();
    return dateString === today;
  };

  // Extract time from FromTime string (e.g., "12:30 | TKN: 19" -> "12:30")
  const extractTime = (fromTimeString) => {
    if (!fromTimeString) return '';
    return fromTimeString.split('|')[0].trim();
  };

  // Extract token from FromTime string (e.g., "12:30 | TKN: 19" -> "19")
  const extractToken = (fromTimeString) => {
    if (!fromTimeString) return '';
    const tokenMatch = fromTimeString.match(/TKN:\s*(\d+)/);
    return tokenMatch ? tokenMatch[1] : '';
  };

  // Get avatar class based on index
  const getAvatarClass = (index) => {
    const avatarClasses = ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4'];
    return avatarClasses[index % avatarClasses.length];
  };

  useEffect(() => {
    if (serviceId && selectedDate) {
      fetchSchedule();
    }
  }, [serviceId, selectedDate]);

  const fetchSchedule = async () => {
    if (!serviceId || !selectedDate) return;
    
    try {
      setLoading(true);
      setError(null);

      // Current date is always today
      const currentDate = formatDate(getTodayDate());
      
      // Today date is the selected date
      const todayDate = formatDate(selectedDate);
      
      // Today time: current time if today, else "00:00"
      const todayTime = isToday(selectedDate) ? getCurrentTime() : '00:00';

      console.log('[TimeSelection] Fetching schedule:', {
        serviceId,
        currentDate,
        todayDate,
        todayTime
      });

      // Call API
      const scheduleData = await getSchedule(serviceId, currentDate, todayDate, todayTime);
      
      console.log('[TimeSelection] Schedule received:', scheduleData);
      
      setSchedule(Array.isArray(scheduleData) ? scheduleData : []);
    } catch (err) {
      console.error('[TimeSelection] Error fetching schedule:', err);
      setError(err.message || 'Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (timeSlot) => {
    console.log('[TimeSelection] Time slot selected:', timeSlot);
    setSelectedTimeSlot(timeSlot);
    
    // Extract time and token
    const time = extractTime(timeSlot.FromTime);
    const token = extractToken(timeSlot.FromTime);
    
    // Call the callback if provided - this will navigate to booking page
    if (onTimeSelect) {
      onTimeSelect({
        time,
        token,
        apserviceTransID: timeSlot.APServiceTransID,
        fromTime: timeSlot.FromTime,
        toTime: timeSlot.ToTime,
        dayPart: timeSlot.DayPart
      });
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
            <h1 className="ms-2 page-title">Select your time</h1>
          </div>
          <div className="rightPart">
          </div>
        </div>
      </header>

      {/* Time Slots */}
      <div className="time-slots-container">
        {loading && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ marginTop: '15px', color: '#64748b' }}>Loading time slots...</p>
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
              onClick={fetchSchedule}
              style={{ marginTop: '15px' }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && schedule.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>No time slots available for this date.</p>
          </div>
        )}

        {!loading && !error && schedule.length > 0 && schedule.map((timeSlot, index) => {
          const time = extractTime(timeSlot.FromTime);
          const token = extractToken(timeSlot.FromTime);
          const isSelected = selectedTimeSlot?.APServiceTransID === timeSlot.APServiceTransID;
          
          return (
            <div
              key={timeSlot.APServiceTransID || index}
              className="time-slot-card"
              onClick={() => handleTimeSelect(timeSlot)}
              style={{
                borderColor: isSelected ? 'var(--accent-color)' : 'transparent',
                borderWidth: isSelected ? '2px' : '1px',
                borderStyle: 'solid'
              }}
            >
              <div className="time-slot-left">
                <div className={`clock-icon ${getAvatarClass(index)}`}>
                  <i className="bi bi-clock"></i>
                </div>
                <div className="time-text">{time}</div>
              </div>
              <div className="token-badge timetoken-badge">TKN: {token}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimeSelection;

