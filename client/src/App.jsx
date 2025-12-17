import { useState, useEffect } from 'react';
import Login from './components/Login';
import MyServices from './components/MyServices';
import About from './components/About';
import OutOfOffice from './components/OutOfOffice';
import SetTimeoutDelay from './components/SetTimeoutDelay';
import AppointmentList from './components/AppointmentList';
import TimeSelection from './components/TimeSelection';
import BookAppointment from './components/BookAppointment';
import UserDetails from './components/UserDetails';
import BlockedUserModal from './components/BlockedUserModal';
import { saveLogin, getLogin, clearLogin, isLoggedIn, getUserEmail } from './utils/storage';
import { checkUserType } from './config/api';
import { useUserStatusCheck } from './hooks/useUserStatusCheck';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentPage, setCurrentPage] = useState('services'); // 'services', 'about', 'outOfOffice', 'setTimeoutDelay', 'appointmentList', 'timeSelection', 'bookAppointment', or 'userDetails'
  const [selectedService, setSelectedService] = useState(null); // { serviceId, serviceName }
  const [timeSelectionDate, setTimeSelectionDate] = useState(null); // Selected date for time selection
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null); // Selected time slot data
  const [selectedAppointmentBookingID, setSelectedAppointmentBookingID] = useState(null); // Selected appointment booking ID for user details
  const [selectedAppointmentData, setSelectedAppointmentData] = useState(null); // Selected appointment data for user details
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUserData, setBlockedUserData] = useState(null);

  // Check if user is already logged in on app load
  useEffect(() => {
    const checkLoginStatus = () => {
      const loginData = getLogin();
      
      if (loginData && loginData.isLoggedIn && loginData.email) {
        console.log('[App] User is already logged in:', loginData.email);
        console.log('[App] Login timestamp:', loginData.loginTimestamp);
        console.log('[App] User data:', loginData.userData);
        setIsLoggedIn(true);
        setUserEmail(loginData.email);
        setUserData(loginData.userData);
      } else {
        console.log('[App] User is not logged in');
        setIsLoggedIn(false);
        setUserEmail(null);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLoginSuccess = async (email) => {
    console.log('[App] ========================================');
    console.log('[App] Login successful, fetching user data...');
    console.log('[App] Email:', email);
    console.log('[App] ========================================');
    
    try {
      // Call CheckUserType API to get user data
      console.log('[App] Calling checkUserType API...');
      const userTypeData = await checkUserType(email);
      
      console.log('[App] ========================================');
      console.log('[App] CheckUserType API Response Received');
      console.log('[App] Raw Response Data:', userTypeData);
      console.log('[App] Response Type:', typeof userTypeData);
      console.log('[App] Is Object:', typeof userTypeData === 'object' && userTypeData !== null);
      console.log('[App] Full JSON:', JSON.stringify(userTypeData, null, 2));
      console.log('[App] ========================================');
      
      // Extract the data we need
      const userInfo = {
        AdminUserMasterID: userTypeData.AdminUserMasterID,
        City: userTypeData.City,
        CityID: userTypeData.CityID,
        Mobile: userTypeData.Mobile,
        UserType: userTypeData.UserType
      };
      
      console.log('[App] ========================================');
      console.log('[App] Extracted User Information:');
      console.log('[App] AdminUserMasterID:', userInfo.AdminUserMasterID);
      console.log('[App] City:', userInfo.City);
      console.log('[App] CityID:', userInfo.CityID);
      console.log('[App] Mobile:', userInfo.Mobile);
      console.log('[App] UserType:', userInfo.UserType);
      console.log('[App] Full User Info Object:', JSON.stringify(userInfo, null, 2));
      console.log('[App] ========================================');
      
      // Store login state and user data using storage utility
      const saved = saveLogin(email, userInfo);
      
      if (saved) {
        // Update state - go directly to MyServices page
        setIsLoggedIn(true);
        setUserEmail(email);
        setUserData(userInfo);
      } else {
        console.error('[App] Failed to save login data');
      }
    } catch (error) {
      console.error('[App] Error fetching user data:', error);
      // Still save login even if CheckUserType fails
      const saved = saveLogin(email);
      if (saved) {
        setIsLoggedIn(true);
        setUserEmail(email);
      }
    }
  };

  const handleLogout = () => {
    console.log('[App] Logging out user');
    
    // Clear login data using storage utility
    clearLogin();
    
    // Update state
    setIsLoggedIn(false);
    setUserEmail(null);
    setUserData(null);
    setCurrentPage('services');
    setShowBlockedModal(false);
    setBlockedUserData(null);
  };

  // Handle user blocked event
  const handleUserBlocked = (userData) => {
    console.log('[App] User blocked detected:', userData);
    setBlockedUserData(userData);
    setShowBlockedModal(true);
    
    // Force logout after showing modal
    setTimeout(() => {
      handleLogout();
    }, 3000); // Logout after 3 seconds
  };

  // Use the user status check hook - only when logged in
  useUserStatusCheck(isLoggedIn, handleUserBlocked);

  // Show blocked modal if user is blocked (overlay on current page)
  if (showBlockedModal) {
    return (
      <>
        {isLoggedIn && currentPage === 'about' ? (
          <About onBack={() => setCurrentPage('services')} />
        ) : isLoggedIn && currentPage === 'outOfOffice' ? (
          <OutOfOffice onBack={() => setCurrentPage('services')} />
        ) : isLoggedIn && currentPage === 'setTimeoutDelay' ? (
          <SetTimeoutDelay onBack={() => setCurrentPage('services')} />
        ) : isLoggedIn && currentPage === 'appointmentList' ? (
          <AppointmentList 
            serviceId={selectedService?.serviceId} 
            serviceName={selectedService?.serviceName}
            onBack={() => setCurrentPage('services')}
            onShowTimeSelection={(date) => {
              setTimeSelectionDate(date);
              setCurrentPage('timeSelection');
            }}
            onShowUserDetails={(appointmentData) => {
              setSelectedAppointmentData(appointmentData);
              setCurrentPage('userDetails');
            }}
          />
        ) : isLoggedIn && currentPage === 'userDetails' ? (
          <UserDetails
            appointmentData={selectedAppointmentData}
            onBack={() => setCurrentPage('appointmentList')}
          />
        ) : isLoggedIn && currentPage === 'timeSelection' ? (
          <TimeSelection
            serviceId={selectedService?.serviceId}
            serviceName={selectedService?.serviceName}
            selectedDate={timeSelectionDate}
            onBack={() => setCurrentPage('appointmentList')}
            onTimeSelect={(timeData) => {
              console.log('[App] Time selected:', timeData);
              setSelectedTimeSlot(timeData);
              setCurrentPage('bookAppointment');
            }}
          />
        ) : isLoggedIn && currentPage === 'bookAppointment' ? (
          <BookAppointment
            serviceId={selectedService?.serviceId}
            serviceName={selectedService?.serviceName}
            selectedDate={timeSelectionDate}
            selectedTimeSlot={selectedTimeSlot}
            onBack={() => setCurrentPage('appointmentList')}
          />
        ) : isLoggedIn ? (
          <MyServices 
            onLogout={handleLogout} 
            onShowAbout={() => setCurrentPage('about')}
            onShowOutOfOffice={() => setCurrentPage('outOfOffice')}
            onShowSetTimeoutDelay={() => setCurrentPage('setTimeoutDelay')}
            onShowAppointmentList={(serviceId, serviceName) => {
              setSelectedService({ serviceId, serviceName });
              setCurrentPage('appointmentList');
            }}
          />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
        <BlockedUserModal onClose={handleLogout} />
      </>
    );
  }

  // Show MyServices page if logged in
  if (isLoggedIn) {
    if (currentPage === 'about') {
      return <About onBack={() => setCurrentPage('services')} />;
    }
    if (currentPage === 'outOfOffice') {
      return <OutOfOffice onBack={() => setCurrentPage('services')} />;
    }
    if (currentPage === 'setTimeoutDelay') {
      return <SetTimeoutDelay onBack={() => setCurrentPage('services')} />;
    }
    if (currentPage === 'appointmentList') {
      return (
        <AppointmentList 
          serviceId={selectedService?.serviceId || selectedService?.APServiceID} 
          serviceName={selectedService?.serviceName || selectedService?.ServiceName}
          onBack={() => setCurrentPage('services')}
          onShowTimeSelection={(date) => {
            setTimeSelectionDate(date);
            setCurrentPage('timeSelection');
          }}
          onShowUserDetails={(appointmentData) => {
            setSelectedAppointmentData(appointmentData); // Store full appointment data
            setCurrentPage('userDetails');
          }}
        />
      );
    }
    if (currentPage === 'userDetails') {
      return (
        <UserDetails
          appointmentData={selectedAppointmentData}
          onBack={() => setCurrentPage('appointmentList')}
        />
      );
    }
    if (currentPage === 'timeSelection') {
      return (
        <TimeSelection
          serviceId={selectedService?.serviceId || selectedService?.APServiceID}
          serviceName={selectedService?.serviceName || selectedService?.ServiceName}
          selectedDate={timeSelectionDate}
          onBack={() => setCurrentPage('appointmentList')}
          onTimeSelect={(timeData) => {
            console.log('[App] Time selected:', timeData);
            setSelectedTimeSlot(timeData);
            setCurrentPage('bookAppointment');
          }}
        />
      );
    }
    if (currentPage === 'bookAppointment') {
      return (
        <BookAppointment
          serviceId={selectedService?.serviceId || selectedService?.APServiceID}
          serviceName={selectedService?.serviceName || selectedService?.ServiceName}
          selectedDate={timeSelectionDate}
          selectedTimeSlot={selectedTimeSlot}
          onBack={() => setCurrentPage('appointmentList')}
        />
      );
    }
    return (
      <MyServices 
        onLogout={handleLogout} 
        onShowAbout={() => setCurrentPage('about')}
        onShowOutOfOffice={() => setCurrentPage('outOfOffice')}
        onShowSetTimeoutDelay={() => setCurrentPage('setTimeoutDelay')}
        onShowAppointmentList={(serviceId, serviceName) => {
          setSelectedService({ serviceId, serviceName });
          setCurrentPage('appointmentList');
        }}
      />
    );
  }

  // Show login page if not logged in
  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;