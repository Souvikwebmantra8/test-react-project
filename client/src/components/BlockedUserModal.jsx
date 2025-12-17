import '../css/app.css';
import '../css/login.css';

function BlockedUserModal({ onClose }) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="auth-card"
        style={{
          maxWidth: '400px',
          width: '100%',
          padding: '30px',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <i 
            className="bi bi-exclamation-triangle-fill" 
            style={{ 
              fontSize: '64px', 
              color: '#ef4444',
              display: 'block'
            }}
          ></i>
        </div>
        
        <h2 style={{ 
          color: 'var(--dark-color)', 
          marginBottom: '15px', 
          fontSize: '24px' 
        }}>
          Account Blocked
        </h2>
        
        <p style={{ 
          color: '#64748b', 
          marginBottom: '30px', 
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Your account has been blocked by the administrator. 
          Please contact support for assistance.
        </p>
        
        <button 
          className="primary-btn" 
          onClick={onClose}
          style={{ 
            width: '100%',
            backgroundColor: '#ef4444',
            borderColor: '#ef4444'
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default BlockedUserModal;

