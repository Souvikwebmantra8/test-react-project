import { useState, useEffect } from 'react';
import '../css/app.css';
import '../css/app-home-style.css';
import { getAppointmentByShop, updateAppointmentStatus, deleteMultipleAppointments, insertAppointments, getSchedule } from '../config/api';
import { getLogin } from '../utils/storage';

function AppointmentList({ serviceId, serviceName, onBack, onShowTimeSelection, onShowUserDetails }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [pointerStartX, setPointerStartX] = useState(0);
  const [bookingError, setBookingError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  // Pull to refresh state
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullStartScrollTop, setPullStartScrollTop] = useState(0);
  // Long-press selection state
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressFired, setLongPressFired] = useState(false);
  // Phone number modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');

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

  // Check if date is in the past
  const isPastDate = (dateString) => {
    if (!dateString) return false;
    const today = new Date(getTodayDate());
    const selected = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    return selected < today;
  };

  const handleBookAppointment = () => {
    // Validate: Cannot book previous dates (but can view them)
    if (isPastDate(selectedDate)) {
      setBookingError('Cannot book appointments for previous dates. Please select today or a future date to book an appointment.');
      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setBookingError(null);
      }, 4000);
      return;
    }

    // Navigate to time selection page
    if (onShowTimeSelection) {
      onShowTimeSelection(selectedDate);
    }
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

  // Validate mobile number
  const validateMobileNumber = (mobile) => {
    if (!mobile || mobile.trim() === '') {
      return 'Mobile number is required';
    }
    
    // Remove any non-digit characters
    const digitsOnly = mobile.replace(/\D/g, '');
    
    // Check if it's exactly 10 digits
    if (digitsOnly.length !== 10) {
      return 'Mobile number must be exactly 10 digits';
    }
    
    // Check if it starts with 6, 7, 8, or 9
    const firstDigit = digitsOnly.charAt(0);
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      return 'Mobile number must start with 6, 7, 8, or 9';
    }
    
    return null; // Valid
  };

  const handleAutoToken = async () => {
    // Validate: Cannot create auto token for previous dates
    if (isPastDate(selectedDate)) {
      setBookingError('Cannot create auto token for previous dates. Please select today or a future date.');
      setTimeout(() => {
        setBookingError(null);
      }, 4000);
      return;
    }

    try {
      // Get AdminUserMasterID from localStorage
      const loginData = getLogin();
      
      if (!loginData || !loginData.userData || !loginData.userData.AdminUserMasterID) {
        setBookingError('AdminUserMasterID not found. Please login again.');
        setTimeout(() => {
          setBookingError(null);
        }, 4000);
        return;
      }

      if (!serviceId) {
        setBookingError('Service information is missing.');
        setTimeout(() => {
          setBookingError(null);
        }, 4000);
        return;
      }

      // Get schedule to find APServiceTransID
      const currentDate = formatDate(getTodayDate());
      const todayDate = formatDate(selectedDate);
      const todayTime = isToday(selectedDate) ? getCurrentTime() : '00:00';

      console.log('[AppointmentList] Fetching schedule for Auto Token:', {
        serviceId,
        currentDate,
        todayDate,
        todayTime
      });

      const scheduleData = await getSchedule(serviceId, currentDate, todayDate, todayTime);
      const schedule = Array.isArray(scheduleData) ? scheduleData : [];

      if (schedule.length === 0) {
        setBookingError('No time slots available for this date. Cannot create auto token.');
        setTimeout(() => {
          setBookingError(null);
        }, 4000);
        return;
      }

      // Use the first available time slot's APServiceTransID
      const firstTimeSlot = schedule[0];
      const apserviceTransID = firstTimeSlot.APServiceTransID;

      if (!apserviceTransID) {
        setBookingError('Service transaction ID not found. Cannot create auto token.');
        setTimeout(() => {
          setBookingError(null);
        }, 4000);
        return;
      }

      // Format date for API: "Mon Dec 08 2025"
      const bookedForDate = formatDateForAPI(selectedDate);
      
      // Prepare API data
      const adminUserMasterID = loginData.userData.AdminUserMasterID;
      const patientName = 'Auto Token';
      const remarks = 'Auto Token';
      const alternateMobile = null; // NULL as specified

      console.log('[AppointmentList] Creating Auto Token:', {
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
        alternateMobile || ''
      );

      console.log('[AppointmentList] Auto Token API response:', response);

      // Check if the request was successful
      let isSuccess = false;
      
      // Handle different response formats
      if (typeof response === 'object' && response !== null) {
        if (response.data === 1 || response.data === '1') {
          isSuccess = true;
        } else if (response.value === 1 || response.value === '1') {
          isSuccess = true;
        } else if (response.success === true) {
          isSuccess = true;
        }
      } else {
        if (response === 1 || response === '1' || String(response).trim() === '1') {
          isSuccess = true;
        }
      }

      if (isSuccess) {
        // Show success message
        setSuccessMessage('Auto token created successfully');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);

        // Refresh the appointments list
        await fetchAppointments(selectedDate);
      } else {
        setBookingError('Failed to create auto token. Please try again.');
        setTimeout(() => {
          setBookingError(null);
        }, 4000);
      }

    } catch (err) {
      console.error('[AppointmentList] Error creating auto token:', err);
      setBookingError(err.message || 'Failed to create auto token. Please check your connection and try again.');
      setTimeout(() => {
        setBookingError(null);
      }, 4000);
    }
  };

  const handlePhoneNoClick = () => {
    // Validate: Cannot create appointment for previous dates
    if (isPastDate(selectedDate)) {
      setBookingError('Cannot create appointment for previous dates. Please select today or a future date.');
      setTimeout(() => {
        setBookingError(null);
      }, 4000);
      return;
    }
    
    // Open the modal
    setShowPhoneModal(true);
    setPhoneNumber('');
    setPhoneNumberError('');
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 10 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(digitsOnly);
    // Clear error when user starts typing
    if (phoneNumberError) {
      setPhoneNumberError('');
    }
  };

  const handlePhoneNoCancel = () => {
    setShowPhoneModal(false);
    setPhoneNumber('');
    setPhoneNumberError('');
  };

  const handlePhoneNoSubmit = async () => {
    // Validate mobile number
    const validationError = validateMobileNumber(phoneNumber);
    if (validationError) {
      setPhoneNumberError(validationError);
      return;
    }

    try {
      // Get AdminUserMasterID from localStorage
      const loginData = getLogin();
      
      if (!loginData || !loginData.userData || !loginData.userData.AdminUserMasterID) {
        setPhoneNumberError('AdminUserMasterID not found. Please login again.');
        return;
      }

      if (!serviceId) {
        setPhoneNumberError('Service information is missing.');
        return;
      }

      // Get schedule to find APServiceTransID
      const currentDate = formatDate(getTodayDate());
      const todayDate = formatDate(selectedDate);
      const todayTime = isToday(selectedDate) ? getCurrentTime() : '00:00';

      console.log('[AppointmentList] Fetching schedule for Phone No. appointment:', {
        serviceId,
        currentDate,
        todayDate,
        todayTime
      });

      const scheduleData = await getSchedule(serviceId, currentDate, todayDate, todayTime);
      const schedule = Array.isArray(scheduleData) ? scheduleData : [];

      if (schedule.length === 0) {
        setPhoneNumberError('No time slots available for this date. Cannot create appointment.');
        return;
      }

      // Use the first available time slot's APServiceTransID
      const firstTimeSlot = schedule[0];
      const apserviceTransID = firstTimeSlot.APServiceTransID;

      if (!apserviceTransID) {
        setPhoneNumberError('Service transaction ID not found. Cannot create appointment.');
        return;
      }

      // Format date for API: "Mon Dec 08 2025"
      const bookedForDate = formatDateForAPI(selectedDate);
      
      // Prepare API data
      const adminUserMasterID = loginData.userData.AdminUserMasterID;
      const patientName = 'Auto Token';
      const remarks = 'Auto Token';
      const alternateMobile = phoneNumber.trim(); // The entered phone number

      console.log('[AppointmentList] Creating appointment with phone number:', {
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

      console.log('[AppointmentList] Phone No. appointment API response:', response);

      // Check if the request was successful
      let isSuccess = false;
      
      // Handle different response formats
      if (typeof response === 'object' && response !== null) {
        if (response.data === 1 || response.data === '1') {
          isSuccess = true;
        } else if (response.value === 1 || response.value === '1') {
          isSuccess = true;
        } else if (response.success === true) {
          isSuccess = true;
        }
      } else {
        if (response === 1 || response === '1' || String(response).trim() === '1') {
          isSuccess = true;
        }
      }

      if (isSuccess) {
        // Close modal
        setShowPhoneModal(false);
        setPhoneNumber('');
        setPhoneNumberError('');

        // Show success message
        setSuccessMessage('Appointment created successfully');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);

        // Refresh the appointments list
        await fetchAppointments(selectedDate);
      } else {
        setPhoneNumberError('Failed to create appointment. Please try again.');
      }

    } catch (err) {
      console.error('[AppointmentList] Error creating appointment with phone number:', err);
      setPhoneNumberError(err.message || 'Failed to create appointment. Please check your connection and try again.');
    }
  };

  // Format time from HH:mm to 12-hour format (e.g., "15:15" to "3:15 PM")
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get avatar class based on index
  const getAvatarClass = (index) => {
    const avatarClasses = ['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4'];
    return avatarClasses[index % avatarClasses.length];
  };

  // Get status badge based on UserIn and UserOut
  const getStatusBadge = (userIn, userOut) => {
    if (userIn === 1 && userOut === 0) {
      return <div className="status-badge status-in">IN</div>;
    } else if (userOut === 1) {
      return <div className="status-badge status-out">OUT</div>;
    }
    return null;
  };

  useEffect(() => {
    // Set today's date as default
    const today = getTodayDate();
    setSelectedDate(today);
    fetchAppointments(today);
  }, [serviceId]);

  const fetchAppointments = async (date) => {
    if (!serviceId || !date) return;
    
    try {
      setLoading(true);
      setError(null);

      // Format date for API
      const formattedDate = formatDate(date);
      console.log('[AppointmentList] Fetching appointments for:', { serviceId, formattedDate });

      // Call API
      const appointmentsData = await getAppointmentByShop(serviceId, formattedDate);
      
      console.log('[AppointmentList] Appointments received:', appointmentsData);
      
      // Sort appointments by FromTime
      const sortedAppointments = Array.isArray(appointmentsData) 
        ? [...appointmentsData].sort((a, b) => {
            const timeA = a.FromTime || '';
            const timeB = b.FromTime || '';
            return timeA.localeCompare(timeB);
          })
        : [];
      
      setAppointments(sortedAppointments);
    } catch (err) {
      console.error('[AppointmentList] Error fetching appointments:', err);
      setError(err.message || 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchAppointments(newDate);
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    const newDate = date.toISOString().split('T')[0];
    
    // Allow viewing previous dates - no validation needed for viewing
    setSelectedDate(newDate);
    fetchAppointments(newDate);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const newDate = date.toISOString().split('T')[0];
    setSelectedDate(newDate);
    fetchAppointments(newDate);
  };

  const handleToday = () => {
    const today = getTodayDate();
    setSelectedDate(today);
    fetchAppointments(today);
  };

  const handleInClick = async (appointment) => {
    console.log('[AppointmentList] IN clicked for:', appointment);
    
    if (!appointment.AppointmentBookingID) {
      console.error('[AppointmentList] AppointmentBookingID not found');
      return;
    }

    try {
      // Call API to update status to IN
      const response = await updateAppointmentStatus(appointment.AppointmentBookingID, 'In');
      
      console.log('[AppointmentList] Update status response:', response);
      
      // Check if successful (API returns 1 on success)
      let isSuccess = false;
      if (typeof response === 'object' && response !== null) {
        if (response.data === 1 || response.data === '1') {
          isSuccess = true;
        } else if (response.success === true) {
          isSuccess = true;
        }
      } else {
        if (response === 1 || response === '1' || String(response).trim() === '1') {
          isSuccess = true;
        }
      }
      
      if (isSuccess) {
        // Update the appointment in the list
        setAppointments(prevAppointments => 
          prevAppointments.map(apt => 
            apt.APServiceTransID === appointment.APServiceTransID
              ? { ...apt, UserIn: 1, UserOut: 0 }
              : apt
          )
        );
        // Show success message
        setSuccessMessage('Status updated successfully');
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        console.log('[AppointmentList] Status updated to IN successfully');
      } else {
        console.error('[AppointmentList] Failed to update status');
      }
    } catch (err) {
      console.error('[AppointmentList] Error updating status to IN:', err);
    }
  };

  const handleOutClick = async (appointment) => {
    console.log('[AppointmentList] OUT clicked for:', appointment);
    
    if (!appointment.AppointmentBookingID) {
      console.error('[AppointmentList] AppointmentBookingID not found');
      return;
    }

    try {
      // Call API to update status to OUT
      const response = await updateAppointmentStatus(appointment.AppointmentBookingID, 'Out');
      
      console.log('[AppointmentList] Update status response:', response);
      
      // Check if successful (API returns 1 on success)
      let isSuccess = false;
      if (typeof response === 'object' && response !== null) {
        if (response.data === 1 || response.data === '1') {
          isSuccess = true;
        } else if (response.success === true) {
          isSuccess = true;
        }
      } else {
        if (response === 1 || response === '1' || String(response).trim() === '1') {
          isSuccess = true;
        }
      }
      
      if (isSuccess) {
        // Update the appointment in the list
        setAppointments(prevAppointments => 
          prevAppointments.map(apt => 
            apt.APServiceTransID === appointment.APServiceTransID
              ? { ...apt, UserIn: 0, UserOut: 1 }
              : apt
          )
        );
        // Show success message
        setSuccessMessage('Status updated successfully');
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        console.log('[AppointmentList] Status updated to OUT successfully');
      } else {
        console.error('[AppointmentList] Failed to update status');
      }
    } catch (err) {
      console.error('[AppointmentList] Error updating status to OUT:', err);
    }
  };

  // Long-press delay constant
  const LONG_PRESS_DELAY = 600; // ms
  const SWIPE_THRESHOLD = 40; // pixels

  // Swipe handlers using pointer events (works for both touch and mouse)
  const handlePointerDown = (e, itemId) => {
    // Don't start if clicking on action buttons
    if (e.target.closest('.item-actions')) {
      return;
    }

    e.preventDefault();
    setActiveItemId(itemId);
    setPointerStartX(e.clientX);
    setLongPressFired(false);
    
    // Start long-press timer
    const timer = setTimeout(() => {
      setLongPressFired(true);
      // Add to selected items
      setSelectedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.add(itemId);
        return newSet;
      });
      // Clear swipe if any
      setSwipedItemId(null);
    }, LONG_PRESS_DELAY);
    
    setLongPressTimer(timer);
    
    // Capture pointer for this element
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e, itemId) => {
    if (activeItemId !== itemId) return;
    
    const deltaX = e.clientX - pointerStartX;
    
    // If moved horizontally significantly, cancel long press
    if (Math.abs(deltaX) > 10 && longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Swipe left (show actions) - negative deltaX means moving left
    if (deltaX < -SWIPE_THRESHOLD) {
      // Cancel long press if swiping
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      // Only set if not already swiped (to avoid unnecessary re-renders)
      if (swipedItemId !== itemId) {
        setSwipedItemId(itemId);
      }
    }
    
    // Swipe right (hide actions) - positive deltaX means moving right
    if (deltaX > SWIPE_THRESHOLD && swipedItemId === itemId) {
      setSwipedItemId(null);
    }
  };

  const handlePointerUp = (e) => {
    // Clear long-press timer if it exists
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (e.currentTarget.releasePointerCapture) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setActiveItemId(null);
    setPointerStartX(0);
  };

  const handlePointerCancel = (e) => {
    // Clear long-press timer if it exists
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (e.currentTarget.releasePointerCapture) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setActiveItemId(null);
    setPointerStartX(0);
  };

  // Close swipe and exit selection mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.item') && !e.target.closest('.top-bar')) {
        setSwipedItemId(null);
        // Exit selection mode if clicking outside
        if (selectedItemIds.size > 0) {
          setSelectedItemIds(new Set());
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedItemIds.size]);

  // Close swipe after IN/OUT button click
  const handleInClickWithClose = async (appointment) => {
    await handleInClick(appointment);
    setSwipedItemId(null);
  };

  const handleOutClickWithClose = async (appointment) => {
    await handleOutClick(appointment);
    setSwipedItemId(null);
  };

  // Pull to refresh handlers
  const PULL_THRESHOLD = 80; // Minimum distance to trigger refresh
  const MAX_PULL_DISTANCE = 120; // Maximum pull distance

  const handlePullStart = (e) => {
    // Don't start pull if user is interacting with an item
    if (e.target.closest('.item')) {
      return;
    }
    
    // Only start pull if we're at the top of the scrollable container
    const container = e.currentTarget;
    const scrollTop = container.scrollTop || 0;
    
    if (scrollTop <= 5 && !isRefreshing && !isPulling) {
      setIsPulling(true);
      const startY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      setPullStartY(startY);
      setPullStartScrollTop(scrollTop);
      setPullDistance(0);
    }
  };

  const handlePullMove = (e) => {
    if (!isPulling) return;
    
    const container = e.currentTarget;
    const scrollTop = container.scrollTop || 0;
    
    // Cancel if scrolled away from top
    if (scrollTop > 5) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    
    const currentY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    const deltaY = currentY - pullStartY;
    
    // Only allow downward pull (positive deltaY)
    if (deltaY > 0) {
      const distance = Math.min(deltaY, MAX_PULL_DISTANCE);
      setPullDistance(distance);
      
      // Prevent default scrolling when pulling
      if (distance > 10) {
        e.preventDefault();
        e.stopPropagation();
      }
    } else {
      // If user moves up, cancel pull
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const handlePullEnd = async (e) => {
    if (!isPulling) return;
    
    // If pulled enough, trigger refresh
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      // Refresh the appointments
      try {
        await fetchAppointments(selectedDate);
      } catch (err) {
        console.error('[AppointmentList] Error refreshing:', err);
      }
      
      // Reset after a short delay
      setTimeout(() => {
        setIsRefreshing(false);
        setIsPulling(false);
        setPullDistance(0);
      }, 500);
    } else {
      // Not enough pull, just reset
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const handlePullCancel = () => {
    setIsPulling(false);
    setPullDistance(0);
  };

  const displayDate = selectedDate ? formatDate(selectedDate) : '';

  // Show full-page loader while loading
  if (loading) {
    return (
      <div className="app-container">
        {/* Toast Notification for Booking Error */}
        {bookingError && (
          <div
            className="toast-notification"
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
              maxWidth: '90%',
              width: '400px'
            }}
          >
            <div
              className="alert alert-danger d-flex align-items-center"
              role="alert"
              style={{
                margin: 0,
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: 'none',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
            >
              <i 
                className="bi bi-exclamation-triangle-fill me-2" 
                style={{ fontSize: '20px', flexShrink: 0 }}
              ></i>
              <span style={{ flex: 1 }}>{bookingError}</span>
              <button
                type="button"
                className="btn-close"
                onClick={() => setBookingError(null)}
                aria-label="Close"
                style={{
                  marginLeft: '12px',
                  opacity: 0.7
                }}
              ></button>
            </div>
          </div>
        )}
        {/* Full-page loader */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f0f9ff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="spinner-border text-primary" role="status" style={{
            width: '48px',
            height: '48px',
            borderWidth: '4px'
          }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ 
            marginTop: '20px', 
            color: '#64748b',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Loading appointments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification for Booking Error */}
      {bookingError && (
        <div
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            maxWidth: '90%',
            width: '400px'
          }}
        >
          <div
            className="alert alert-danger d-flex align-items-center"
            role="alert"
            style={{
              margin: 0,
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: 'none',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          >
            <i 
              className="bi bi-exclamation-triangle-fill me-2" 
              style={{ fontSize: '20px', flexShrink: 0 }}
            ></i>
            <span style={{ flex: 1 }}>{bookingError}</span>
            <button
              type="button"
              className="btn-close"
              onClick={() => setBookingError(null)}
              aria-label="Close"
              style={{
                marginLeft: '12px',
                opacity: 0.7
              }}
            ></button>
          </div>
        </div>
      )}
      
      {/* Toast Notification for Success Message */}
      {successMessage && (
        <div
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            maxWidth: '90%',
            width: '400px'
          }}
        >
          <div
            className="alert alert-success d-flex align-items-center"
            role="alert"
            style={{
              margin: 0,
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: 'none',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          >
            <i 
              className="bi bi-check-circle-fill me-2" 
              style={{ fontSize: '20px', flexShrink: 0 }}
            ></i>
            <span style={{ flex: 1 }}>{successMessage}</span>
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccessMessage(null)}
              aria-label="Close"
              style={{
                marginLeft: '12px',
                opacity: 0.7
              }}
            ></button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-10 pt-6 pb-4 px-4 bg-blue-50 dark:bg-slate-900">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button 
            className="back-btn" 
            onClick={onBack} 
            title="Go Back"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <i className="bi bi-arrow-left" style={{ fontSize: '20px', color: '#334155' }}></i>
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-0" style={{ flex: 1, textAlign: 'center' }}>
            {serviceName?.toUpperCase() || 'SERVICE'}
          </h1>
          <div style={{ width: '40px' }}></div> {/* Spacer for centering */}
        </div>
        <div className="d-flex flex-col align-items-center">
          <div className="d-flex align-items-center space-x-2 mt-0">
            <button
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm d-flex align-items-center space-x-1.5"
              onClick={handleAutoToken}
            >
              <span className="material-symbols-outlined text-base">confirmation_number</span>
              <span>Auto Token</span>
            </button>
            <button
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm d-flex align-items-center space-x-1.5"
              onClick={handlePhoneNoClick}
            >
              <span className="material-symbols-outlined text-base">smartphone</span>
              <span>Phone No.</span>
            </button>
            <button
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm d-flex align-items-center space-x-1.5"
              onClick={handleBookAppointment}
            >
              <span className="material-symbols-outlined text-base">book_online</span>
              <span>Book Appt.</span>
            </button>
          </div>
        </div>
      </header>
      <div className={`px-4 pt-6 py-2 bg-blue-50 dark:bg-slate-900 flex justify-between items-center pageTopSearchbar ${selectedItemIds.size > 0 ? 'buttonHide' : ''}`}>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-0 dateText">
          {displayDate}
        </p>
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm countText">
          {appointments.length}
        </div>
        <div className={`top-bar ${selectedItemIds.size > 0 ? 'visible' : ''}`} id="topBar">
          <button 
            className="top-btn in" 
            id="topIn"
            onClick={async () => {
              // Mark all selected appointments as IN
              const selectedIdsArray = Array.from(selectedItemIds);
              for (const itemId of selectedIdsArray) {
                const appointment = appointments.find((apt, idx) => {
                  const aptId = apt.APServiceTransID || idx;
                  return String(aptId) === String(itemId);
                });
                if (appointment) {
                  await handleInClick(appointment);
                }
              }
              // Clear selection
              setSelectedItemIds(new Set());
            }}
          >
            <span className="material-symbols-outlined">login</span>
          </button>
          <button 
            className="top-btn out" 
            id="topOut"
            onClick={async () => {
              // Mark all selected appointments as OUT
              const selectedIdsArray = Array.from(selectedItemIds);
              for (const itemId of selectedIdsArray) {
                const appointment = appointments.find((apt, idx) => {
                  const aptId = apt.APServiceTransID || idx;
                  return String(aptId) === String(itemId);
                });
                if (appointment) {
                  await handleOutClick(appointment);
                }
              }
              // Clear selection
              setSelectedItemIds(new Set());
            }}
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
          <button 
            className="top-btn delete" 
            id="topDelete"
            onClick={async () => {
              // Get selected appointment IDs
              const selectedIdsArray = Array.from(selectedItemIds);
              
              if (selectedIdsArray.length === 0) {
                return;
              }
              
              // Find appointments and get their AppointmentBookingIDs
              const appointmentBookingIDs = selectedIdsArray
                .map(itemId => {
                  const appointment = appointments.find((apt, idx) => {
                    const aptId = apt.APServiceTransID || idx;
                    return String(aptId) === String(itemId);
                  });
                  return appointment?.AppointmentBookingID;
                })
                .filter(id => id !== undefined && id !== null);
              
              if (appointmentBookingIDs.length === 0) {
                console.error('[AppointmentList] No valid AppointmentBookingIDs found');
                return;
              }
              
              // Create comma-separated string of IDs
              const idsString = appointmentBookingIDs.join(',');
              
              try {
                console.log('[AppointmentList] Deleting appointments:', idsString);
                
                // Call API to delete multiple appointments
                const response = await deleteMultipleAppointments(idsString);
                
                console.log('[AppointmentList] Delete response:', response);
                
                // Check if successful (API might return different success indicators)
                let isSuccess = false;
                if (typeof response === 'object' && response !== null) {
                  if (response.data === 1 || response.data === '1' || response.success === true) {
                    isSuccess = true;
                  }
                } else if (response === 1 || response === '1' || String(response).trim() === '1') {
                  isSuccess = true;
                } else {
                  // If response doesn't indicate failure, consider it success
                  isSuccess = true;
                }
                
                if (isSuccess) {
                  // Show success message
                  setSuccessMessage('Appointment Canceled');
                  // Auto-dismiss after 3 seconds
                  setTimeout(() => {
                    setSuccessMessage(null);
                  }, 3000);
                  
                  // Refresh the appointments list
                  await fetchAppointments(selectedDate);
                  
                  // Clear selection
                  setSelectedItemIds(new Set());
                  
                  console.log('[AppointmentList] Appointments deleted successfully');
                } else {
                  console.error('[AppointmentList] Failed to delete appointments');
                  setError('Failed to delete appointments. Please try again.');
                  setTimeout(() => {
                    setError(null);
                  }, 4000);
                }
              } catch (err) {
                console.error('[AppointmentList] Error deleting appointments:', err);
                setError(err.message || 'Failed to delete appointments. Please try again.');
                setTimeout(() => {
                  setError(null);
                }, 4000);
              }
            }}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
        <div className="flex items-center space-x-1 dayCountSliderArea">
          <button
            className="p-1 text-slate-600 dark:text-slate-400 bg-transparent border-color-transparent"
            onClick={handlePreviousDay}
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm"
            onClick={handleToday}
          >
            Today
          </button>
          <button
            className="p-1 text-slate-600 dark:text-slate-400 bg-transparent border-color-transparent"
            onClick={handleNextDay}
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
      </div>
      {/* Appointments List */}
      <div 
        className="list appointments-container" 
        id="list"
        onTouchStart={handlePullStart}
        onTouchMove={handlePullMove}
        onTouchEnd={handlePullEnd}
        onTouchCancel={handlePullCancel}
        onPointerDown={handlePullStart}
        onPointerMove={handlePullMove}
        onPointerUp={handlePullEnd}
        onPointerCancel={handlePullCancel}
        style={{
          position: 'relative',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {/* Pull to Refresh Indicator */}
        {(isPulling || isRefreshing || pullDistance > 10) && (
          <div
            style={{
              position: 'absolute',
              top: `${Math.max(10 + pullDistance * 0.3, 10)}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              opacity: Math.min(Math.max(pullDistance / 25, 0.4), 1),
              transition: isRefreshing ? 'opacity 0.3s ease, top 0.3s ease' : 'none',
              pointerEvents: 'none'
            }}
          >
            {isRefreshing ? (
              <div 
                className="spinner-border spinner-border-sm text-primary" 
                role="status"
                style={{ 
                  width: '20px', 
                  height: '20px',
                  borderWidth: '2px',
                  borderColor: '#3b82f6',
                  borderRightColor: 'transparent'
                }}
              >
                <span className="visually-hidden">Refreshing...</span>
              </div>
            ) : (
              <span 
                className="material-symbols-outlined"
                style={{ 
                  fontSize: '20px', 
                  color: '#3b82f6',
                  transform: `rotate(${pullDistance * 2}deg)`,
                  transition: 'transform 0.1s linear'
                }}
              >
                refresh
              </span>
            )}
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
              onClick={() => fetchAppointments(selectedDate)}
              style={{ marginTop: '15px' }}
            >
              Retry
            </button>
          </div>
        )}

        {!error && appointments.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>No appointments found for this date.</p>
          </div>
        )}

        {!error && appointments.length > 0 && appointments.map((appointment, index) => {
          const itemId = appointment.APServiceTransID || index;
          const isSwiped = swipedItemId === itemId;
          
          const isSelected = selectedItemIds.has(itemId);

          const handleCardClick = (e) => {
            // Don't navigate if clicking on action buttons or if swiped
            if (e.target.closest('.item-actions') || isSwiped) {
              return;
            }
            
            // If in selection mode, toggle selection instead of navigating
            if (selectedItemIds.size > 0) {
              e.preventDefault();
              setSelectedItemIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(itemId)) {
                  newSet.delete(itemId);
                } else {
                  newSet.add(itemId);
                }
                return newSet;
              });
              return;
            }
            
            // Navigate to user details with appointment data directly from the list
            if (appointment.AppointmentBookingID && onShowUserDetails) {
              // Pass the appointment data directly - no API call needed
              const appointmentData = {
                AppointmentBookingID: appointment.AppointmentBookingID,
                PatientName: appointment.PatientName || appointment.DisplayName || 'N/A',
                Remarks: appointment.Remarks || 'None',
                FromTime: appointment.FromTime || '',
                ToTime: appointment.ToTime || '',
                AppointmentDate: appointment.AppointmentDate || appointment.BookedForDate || selectedDate,
                Mobile: appointment.Mobile || appointment.AlternateMobile || '',
                TokenNumber: appointment.TokenNumber || ''
              };
              onShowUserDetails(appointmentData);
            }
          };
          
          return (
            <div 
              key={itemId} 
              className={`item appointment-card ${isSwiped ? 'swiped' : ''} ${isSelected ? 'selected' : ''}`} 
              data-id={itemId}
              onPointerDown={(e) => handlePointerDown(e, itemId)}
              onPointerMove={(e) => handlePointerMove(e, itemId)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onClick={handleCardClick}
              style={{ touchAction: 'pan-y', cursor: 'pointer' }}
            >
              <div className="appointment-content">
                <div className={`appointment-avatar ${getAvatarClass(index)}`}>
                  <span>{index + 1}</span>
                </div>
                <div className="item-content">
                  <div className="appointment-details">
                    <div className="d-flex justify-content-between">
                      <div className="patient-name">{appointment.PatientName || appointment.DisplayName || 'N/A'}</div>
                      <div className="appointment-right p-0">
                        <div className="appointment-time">{formatTime(appointment.FromTime)}</div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between">
                      <div className="appointment-meta">
                        <div className="meta-item">
                          <i className="bi bi-chat-left-text"></i>
                          <span>{appointment.Remarks || 'No Remarks'}</span>
                        </div>
                      </div>
                      <div className="appointment-right p-0">
                        <div className="appointment-badges">
                          {appointment.TokenNumber && (
                            <div className="token-badge">{appointment.TokenNumber}</div>
                          )}
                          {getStatusBadge(appointment.UserIn, appointment.UserOut)}
                        </div>
                      </div>
                    </div>
                    <span className="reason-badge reason-none">No Reason</span>
                  </div>
                </div>
                <div className="item-actions">
                  <button className="btn-in" onClick={() => handleInClickWithClose(appointment)}>
                    <span className="material-symbols-outlined">login</span>
                    <span className="text-xs font-semibold">IN</span>
                  </button>
                  <button className="btn-out" onClick={() => handleOutClickWithClose(appointment)}>
                    <span className="material-symbols-outlined">logout</span>
                    <span className="text-xs font-semibold">OUT</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              handlePhoneNoCancel();
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#1f2937',
                  marginBottom: '12px'
                }}
              >
                Type Mobile Number :
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="Enter 10 digit mobile number"
                maxLength={10}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: phoneNumberError ? '2px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePhoneNoSubmit();
                  }
                }}
              />
              {phoneNumberError && (
                <div
                  style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    marginTop: '8px'
                  }}
                >
                  {phoneNumberError}
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '16px'
              }}
            >
              <button
                onClick={handlePhoneNoCancel}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePhoneNoSubmit}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AppointmentList;