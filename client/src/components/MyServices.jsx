import { useEffect, useState } from 'react';
import '../css/app.css';
import '../css/services-style.css';
import { getProviderDetails } from '../config/api';
import { getLogin } from '../utils/storage';

function MyServices({ onLogout, onShowAbout, onShowOutOfOffice, onShowSetTimeoutDelay, onShowAppointmentList }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch services when component mounts
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get AdminUserMasterID from localStorage
      const loginData = getLogin();
      
      if (!loginData || !loginData.userData || !loginData.userData.AdminUserMasterID) {
        throw new Error('AdminUserMasterID not found. Please login again.');
      }

      const adminUserMasterID = loginData.userData.AdminUserMasterID;
      console.log('[MyServices] Fetching services for AdminUserMasterID:', adminUserMasterID);

      // Call ProviderDetails API
      const servicesData = await getProviderDetails(adminUserMasterID);
      
      console.log('[MyServices] Services received:', servicesData);
      
      // Process services data - generate avatar classes and first letter
      const processedServices = servicesData.map((service, index) => {
        // Get first letter of service name for avatar
        const firstLetter = service.ServiceName ? service.ServiceName.charAt(0).toUpperCase() : '?';
        
        // Assign avatar class based on index (cycling through available classes)
        const avatarClasses = ['', 'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4'];
        const avatarClass = avatarClasses[index % avatarClasses.length];
        
        return {
          APServiceID: service.APServiceID,
          ServiceName: service.ServiceName,
          AssociationType: service.AssociationType,
          avatar: firstLetter,
          avatarClass: avatarClass
        };
      });

      setServices(processedServices);
      console.log('[MyServices] Processed services:', processedServices);
    } catch (err) {
      console.error('[MyServices] Error fetching services:', err);
      setError(err.message || 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const handleServiceClick = (e, service) => {
    e.preventDefault();
    console.log('[MyServices] Service clicked:', {
      APServiceID: service.APServiceID,
      ServiceName: service.ServiceName
    });
    
    // Store selected service in localStorage for next page
    const selectedService = {
      APServiceID: service.APServiceID,
      ServiceName: service.ServiceName,
      AssociationType: service.AssociationType
    };
    localStorage.setItem('qwicbookpro_selected_service', JSON.stringify(selectedService));
    
    // Navigate to appointment list page
    if (onShowAppointmentList) {
      onShowAppointmentList(service.APServiceID, service.ServiceName);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="w-100 d-flex justify-content-between align-items-center innerPage-app-header">
          <div className="d-flex align-items-center leftPert">
            <h1 className="page-title">My Services</h1>
          </div>
          <div className="rightPart">
            <div className="dropdown moreDropdown">
              <button 
                type="button" 
                className="btn btn-primary dropdown-toggle" 
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="fa-sharp fa-regular fa-ellipsis-vertical"></i>
              </button>
              <ul className="dropdown-menu moreDropdown-menu">
                <li>
                  <a 
                    className="dropdown-item" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (onShowSetTimeoutDelay) {
                        onShowSetTimeoutDelay();
                      }
                    }}
                  >
                    Set Time delay
                  </a>
                </li>
                <li>
                  <a 
                    className="dropdown-item" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (onShowOutOfOffice) {
                        onShowOutOfOffice();
                      }
                    }}
                  >
                    Out of Office
                  </a>
                </li>
                <li>
                  <a 
                    className="dropdown-item" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (onShowAbout) {
                        onShowAbout();
                      }
                    }}
                  >
                    Profile
                  </a>
                </li>
                <li>
                  <a 
                    className="dropdown-item" 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    Log Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* My Service List Area */}
      <div className="servicesListSec">
        <div className="servicesListSecinner">
          {loading && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ marginTop: '15px', color: '#64748b' }}>Loading services...</p>
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
                onClick={fetchServices}
                style={{ marginTop: '15px' }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && services.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ color: '#64748b' }}>No services found.</p>
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <div className="servicesList">
              {services.map((service) => (
                <div key={service.APServiceID} className="servicesListItem">
                  <a 
                    href="#" 
                    className="d-block servicesListIteminner"
                    onClick={(e) => handleServiceClick(e, service)}
                  >
                    <div className="d-flex align-items-center">
                      <div className={`userPic ${service.avatarClass}`}>
                        {service.avatar}
                      </div>
                      <div className="userInfo">
                        <h4 className="mb-0 title">{service.ServiceName}</h4>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyServices;

