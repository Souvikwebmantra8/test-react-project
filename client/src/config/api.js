/**
 * API Configuration
 * 
 * IMPORTANT: We use Express server proxy to avoid CORS issues.
 * 
 * External API: http://ws.eighty20technologies.com/Appointment/Service1.svc
 * API Endpoint Format: Authenticate/ GET Service at http://ws.eighty20technologies.com/Appointment/Service1.svc/Authenticate/?Email={EMAIL}&Password={PASSWORD}
 * 
 * Frontend calls: http://localhost:5000/api/authenticate (Express server)
 * Express server calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/Authenticate/?Email={EMAIL}&Password={PASSWORD}
 */

// External API base URL (used by Express server)
export const EXTERNAL_API_BASE = 'http://ws.eighty20technologies.com/Appointment/Service1.svc';

// Express server URL - MUST be absolute with port 5000
export const EXPRESS_SERVER_URL = 'http://localhost:5000';

// Local API base URL (Express backend proxy)
export const LOCAL_API_BASE = `${EXPRESS_SERVER_URL}/api`;

// API Endpoints
export const API_ENDPOINTS = {
  AUTHENTICATE: '/Authenticate',
  CHECK_USER_TYPE: '/CheckUserType',
  PROVIDER_DETAILS: '/ProviderDetails',
  GET_USER_INFORMATION: '/GetUserInformation',
  GET_USER: '/GetUser',
  INSERT_LATE_DETAILS: '/InsertLateDetails',
  // Add more endpoints here as needed
  // EXAMPLE: GET_APPOINTMENTS: '/GetAppointments',
  // EXAMPLE: UPDATE_APPOINTMENT: '/UpdateAppointment',
};

/**
 * Build authentication URL - uses Express proxy to avoid CORS
 * Frontend calls: http://localhost:5000/api/authenticate?Email={EMAIL}&Password={PASSWORD}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/Authenticate/?Email={EMAIL}&Password={PASSWORD}
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {string} Express server URL
 */
export const getAuthUrl = (email, password) => {
  // Express server URL (frontend will call Express on port 5000)
  const expressUrl = `${LOCAL_API_BASE}/authenticate?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`;
  
  // External API URL (what Express server will actually call)
  const externalUrl = `${EXTERNAL_API_BASE}${API_ENDPOINTS.AUTHENTICATE}/?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`;
  
  console.log('[API Config] ========================================');
  console.log('[API Config] Building authentication URL...');
  console.log('[API Config] Email:', email);
  console.log('[API Config] Password:', password ? '***' : 'empty');
  console.log('[API Config] Express server URL (frontend calls):', expressUrl);
  console.log('[API Config] External API URL (server will call):', externalUrl);
  console.log('[API Config] ========================================');
  
  return expressUrl;
};

/**
 * Build API URL for any endpoint
 * @param {string} endpoint - API endpoint (e.g., '/GetAppointments')
 * @param {object} params - Query parameters
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint, params = {}) => {
  let url = `${EXTERNAL_API_BASE}${endpoint}`;
  
  // Add query parameters if provided
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  if (queryString) {
    url += `/?${queryString}`;
  }
  
  return url;
};

/**
 * Build proxy URL for Express server
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {string} Express proxy URL
 */
export const getProxyUrl = (endpoint, params = {}) => {
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const url = `${LOCAL_API_BASE}/proxy${endpoint}${queryString ? '?' + queryString : ''}`;
  return url;
};

/**
 * Get CheckUserType API URL - uses Express proxy to avoid CORS
 * Frontend calls: http://localhost:5000/api/checkusertype?Email={EMAIL}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/CheckUserType/?Email={EMAIL}
 * @param {string} email - User email
 * @returns {string} Express server URL
 */
export const getCheckUserTypeUrl = (email) => {
  // Express server URL (frontend will call Express on port 5000)
  const expressUrl = `${LOCAL_API_BASE}/checkusertype?Email=${encodeURIComponent(email)}`;
  
  // External API URL (what Express server will actually call)
  const externalUrl = `${EXTERNAL_API_BASE}${API_ENDPOINTS.CHECK_USER_TYPE}/?Email=${encodeURIComponent(email)}`;
  
  console.log('[API Config] ========================================');
  console.log('[API Config] Building CheckUserType URL...');
  console.log('[API Config] Email:', email);
  console.log('[API Config] Express server URL (frontend calls):', expressUrl);
  console.log('[API Config] External API URL (server will call):', externalUrl);
  console.log('[API Config] ========================================');
  
  return expressUrl;
};

/**
 * Call CheckUserType API
 * @param {string} email - User email
 * @returns {Promise<object>} User type data
 */

export const checkUserType = async (email) => {
  try {
    const apiUrl = getCheckUserTypeUrl(email);
    console.log('[API] ========================================');
    console.log('[API] Calling CheckUserType API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: GET');
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] ========================================');
    console.log('[API] CheckUserType Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] Headers:', Object.fromEntries(response.headers.entries()));
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] CheckUserType Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] CheckUserType Raw Response Data:');
    console.log('[API] Type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('[API] Is Array:', Array.isArray(data));
    console.log('[API] Has "value" property:', data && typeof data === 'object' && data.value !== undefined);
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    // Handle different response formats
    let responseData = data;
    
    // If response has a 'value' property (OData format), extract it
    if (data && typeof data === 'object' && data.value) {
      console.log('[API] ========================================');
      console.log('[API] Response has "value" property (OData format)');
      console.log('[API] Extracting value array...');
      responseData = data.value;
      console.log('[API] Extracted value:', JSON.stringify(responseData, null, 2));
      console.log('[API] ========================================');
    }
    
    // API returns an array, get the first item
    let result;
    if (Array.isArray(responseData) && responseData.length > 0) {
      result = responseData[0];
      console.log('[API] ========================================');
      console.log('[API] Extracted First Item from Array:');
      console.log('[API] AdminUserMasterID:', result.AdminUserMasterID);
      console.log('[API] City:', result.City);
      console.log('[API] CityID:', result.CityID);
      console.log('[API] Mobile:', result.Mobile);
      console.log('[API] UserType:', result.UserType);
      console.log('[API] Full Object:', JSON.stringify(result, null, 2));
      console.log('[API] ========================================');
      return result;
    }
    
    // If it's already an object (not array), return it directly
    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
      console.log('[API] ========================================');
      console.log('[API] Returning Object Response:');
      console.log('[API] Data:', JSON.stringify(responseData, null, 2));
      console.log('[API] ========================================');
      return responseData;
    }
    
    console.log('[API] ========================================');
    console.log('[API] Returning Response As-Is:');
    console.log('[API] Data:', JSON.stringify(responseData, null, 2));
    console.log('[API] ========================================');
    return responseData;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling CheckUserType:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Get ProviderDetails API URL - uses Express proxy to avoid CORS
 * Frontend calls: http://localhost:5000/api/providerdetails?AdminUserMasterID={ID}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/ProviderDetails/?AdminUserMasterID={ID}
 * @param {number} adminUserMasterID - Admin User Master ID
 * @returns {string} Express server URL
 */
export const getProviderDetailsUrl = (adminUserMasterID) => {
  // Express server URL (frontend will call Express on port 5000)
  const expressUrl = `${LOCAL_API_BASE}/providerdetails?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
  
  // External API URL (what Express server will actually call)
  const externalUrl = `${EXTERNAL_API_BASE}${API_ENDPOINTS.PROVIDER_DETAILS}/?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
  
  console.log('[API Config] ========================================');
  console.log('[API Config] Building ProviderDetails URL...');
  console.log('[API Config] AdminUserMasterID:', adminUserMasterID);
  console.log('[API Config] Express server URL (frontend calls):', expressUrl);
  console.log('[API Config] External API URL (server will call):', externalUrl);
  console.log('[API Config] ========================================');
  
  return expressUrl;
};

/**
 * Call ProviderDetails API to get services list
 * @param {number} adminUserMasterID - Admin User Master ID
 * @returns {Promise<Array>} Array of services
 */
export const getProviderDetails = async (adminUserMasterID) => {
  try {
    const apiUrl = getProviderDetailsUrl(adminUserMasterID);
    console.log('[API] ========================================');
    console.log('[API] Calling ProviderDetails API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: GET');
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] ========================================');
    console.log('[API] ProviderDetails Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] ProviderDetails Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] ProviderDetails Raw Response Data:');
    console.log('[API] Type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('[API] Is Array:', Array.isArray(data));
    console.log('[API] Has "value" property:', data && typeof data === 'object' && data.value !== undefined);
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    // Handle different response formats
    let responseData = data;
    
    // If response has a 'value' property (OData format), extract it
    if (data && typeof data === 'object' && data.value) {
      console.log('[API] ========================================');
      console.log('[API] Response has "value" property (OData format)');
      console.log('[API] Extracting value array...');
      responseData = data.value;
      console.log('[API] Extracted value:', JSON.stringify(responseData, null, 2));
      console.log('[API] ========================================');
    }
    
    // Ensure we return an array
    if (Array.isArray(responseData)) {
      console.log('[API] ========================================');
      console.log('[API] Returning Services Array:');
      console.log('[API] Services Count:', responseData.length);
      responseData.forEach((service, index) => {
        console.log(`[API] Service ${index + 1}:`, {
          APServiceID: service.APServiceID,
          ServiceName: service.ServiceName,
          AssociationType: service.AssociationType
        });
      });
      console.log('[API] ========================================');
      return responseData;
    }
    
    // If it's a single object, wrap it in an array
    if (responseData && typeof responseData === 'object') {
      console.log('[API] ========================================');
      console.log('[API] Response is single object, wrapping in array');
      console.log('[API] ========================================');
      return [responseData];
    }
    
    console.log('[API] ========================================');
    console.log('[API] Returning Empty Array (unexpected format)');
    console.log('[API] ========================================');
    return [];
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling ProviderDetails:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Get GetUserInformation API URL - uses Express proxy to avoid CORS
 * Frontend calls: http://localhost:5000/api/getuserinformation?AdminUserMasterID={ID}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/GetUserInformation/?AdminUserMasterID={ID}
 * @param {number} adminUserMasterID - Admin User Master ID
 * @returns {string} Express server URL
 */
export const getUserInformationUrl = (adminUserMasterID) => {
  // Express server URL (frontend will call Express on port 5000)
  const expressUrl = `${LOCAL_API_BASE}/getuserinformation?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
  
  // External API URL (what Express server will actually call)
  const externalUrl = `${EXTERNAL_API_BASE}${API_ENDPOINTS.GET_USER_INFORMATION}/?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
  
  console.log('[API Config] ========================================');
  console.log('[API Config] Building GetUserInformation URL...');
  console.log('[API Config] AdminUserMasterID:', adminUserMasterID);
  console.log('[API Config] Express server URL (frontend calls):', expressUrl);
  console.log('[API Config] External API URL (server will call):', externalUrl);
  console.log('[API Config] ========================================');
  
  return expressUrl;
};

/**
 * Call GetUserInformation API to get user information
 * @param {number} adminUserMasterID - Admin User Master ID
 * @returns {Promise<object>} User information data
 */
export const getUserInformation = async (adminUserMasterID) => {
  try {
    const apiUrl = getUserInformationUrl(adminUserMasterID);
    console.log('[API] ========================================');
    console.log('[API] Calling GetUserInformation API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: GET');
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] ========================================');
    console.log('[API] GetUserInformation Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GetUserInformation Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] GetUserInformation Raw Response Data:');
    console.log('[API] Type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('[API] Is Array:', Array.isArray(data));
    console.log('[API] Has "value" property:', data && typeof data === 'object' && data.value !== undefined);
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    // Handle different response formats
    let responseData = data;
    
    // If response has a 'value' property (OData format), extract it
    if (data && typeof data === 'object' && data.value) {
      console.log('[API] ========================================');
      console.log('[API] Response has "value" property (OData format)');
      console.log('[API] Extracting value array...');
      responseData = data.value;
      console.log('[API] Extracted value:', JSON.stringify(responseData, null, 2));
      console.log('[API] ========================================');
    }
    
    // If it's an array, get the first item
    if (Array.isArray(responseData) && responseData.length > 0) {
      const userInfo = responseData[0];
      console.log('[API] ========================================');
      console.log('[API] Extracted First Item from Array:');
      console.log('[API] CustomerNumber:', userInfo.CustomerNumber);
      console.log('[API] ExpiryDate:', userInfo.ExpiryDate);
      console.log('[API] RegisteredEmailID:', userInfo.RegisteredEmailID);
      console.log('[API] RegisteredMobile:', userInfo.RegisteredMobile);
      console.log('[API] Full Object:', JSON.stringify(userInfo, null, 2));
      console.log('[API] ========================================');
      return userInfo;
    }
    
    // If it's already an object (not array), return it directly
    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
      console.log('[API] ========================================');
      console.log('[API] Returning Object Response:');
      console.log('[API] Data:', JSON.stringify(responseData, null, 2));
      console.log('[API] ========================================');
      return responseData;
    }
    
    console.log('[API] ========================================');
    console.log('[API] Returning Response As-Is:');
    console.log('[API] Data:', JSON.stringify(responseData, null, 2));
    console.log('[API] ========================================');
    return responseData;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling GetUserInformation:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Get GetUser API URL - uses Express proxy to avoid CORS
 * Frontend calls: http://localhost:5000/api/getuser?AdminUserMasterID={ID}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/GetUser/?AdminUserMasterID={ID}
 * @param {number} adminUserMasterID - Admin User Master ID
 * @returns {string} Express server URL
 */
export const getUserUrl = (adminUserMasterID) => {
  // Express server URL (frontend will call Express on port 5000)
  const expressUrl = `${LOCAL_API_BASE}/getuser?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
  
  // External API URL (what Express server will actually call)
  const externalUrl = `${EXTERNAL_API_BASE}${API_ENDPOINTS.GET_USER}/?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
  
  console.log('[API Config] Building GetUser URL...');
  console.log('[API Config] AdminUserMasterID:', adminUserMasterID);
  console.log('[API Config] Express server URL:', expressUrl);
  console.log('[API Config] External API URL:', externalUrl);
  
  return expressUrl;
};

/**
 * Call GetUser API to check user status (including Active flag)
 * @param {number} adminUserMasterID - Admin User Master ID
 * @returns {Promise<object>} User data with Active flag
 */
export const getUser = async (adminUserMasterID) => {
  try {
    const apiUrl = getUserUrl(adminUserMasterID);
    console.log('[API] Calling GetUser API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] GetUser response:', data);
    
    // Handle different response formats
    let responseData = data;
    
    // If response has a 'value' property (OData format), extract it
    if (data && typeof data === 'object' && data.value) {
      responseData = data.value;
    }
    
    // If it's an array, get the first item
    if (Array.isArray(responseData) && responseData.length > 0) {
      return responseData[0];
    }
    
    // If it's already an object, return it directly
    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
      return responseData;
    }
    
    return responseData;
  } catch (error) {
    console.error('[API] Error calling GetUser:', error);
    throw error;
  }
};

/**
 * Call InsertLateDetails API to save late arrival details
 * Frontend calls: http://localhost:5000/api/insertlatedetails (POST)
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/InsertLateDetails
 * @param {number} adminUserMasterID - Admin User Master ID
 * @param {string} lateDate - Date in format "dd-MMM-yyyy" (e.g., "12-Dec-2025")
 * @param {string} lateTime - Time in format "HH:mm" (e.g., "10:30")
 * @returns {Promise<object>} API response
 */
export const insertLateDetails = async (adminUserMasterID, lateDate, lateTime) => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/insertlatedetails`;
    
    const requestBody = {
      lateDetails: {
        AdminUserMasterID: adminUserMasterID,
        LateDate: lateDate,
        LateTime: lateTime
      }
    };
    
    console.log('[API] ========================================');
    console.log('[API] Calling InsertLateDetails API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: POST');
    console.log('[API] Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] ========================================');
    console.log('[API] InsertLateDetails Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] InsertLateDetails Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] InsertLateDetails Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    return data;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling InsertLateDetails:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Call InsertLateDetails API to save out of office details
 * Frontend calls: http://localhost:5000/api/insertoutofoffice (POST)
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/InsertLateDetails
 * @param {number} adminUserMasterID - Admin User Master ID
 * @param {string} oooFrom - From date in format "dd-MMM-yyyy" (e.g., "04-Dec-8888")
 * @param {string} oooTo - To date in format "dd-MMM-yyyy" (e.g., "07-Dec-9999")
 * @param {string} oooMessage - Out of office message (max 200 characters)
 * @returns {Promise<object>} API response
 */
export const insertOutOfOffice = async (adminUserMasterID, oooFrom, oooTo, oooMessage) => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/insertoutofoffice`;
    
    const requestBody = {
      adminOOO: {
        AdminUserMasterID: adminUserMasterID,
        OOOFrom: oooFrom,
        OOOTo: oooTo,
        OOOMessage: oooMessage
      }
    };
    
    console.log('[API] ========================================');
    console.log('[API] Calling InsertOutOfOffice API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: POST');
    console.log('[API] Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] ========================================');
    console.log('[API] InsertOutOfOffice Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] InsertOutOfOffice Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] InsertOutOfOffice Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    return data;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling InsertOutOfOffice:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Get appointments by shop/service
 * Frontend calls: http://localhost:5000/api/getappointmentbyshop?APServiceID={ID}&AppointmentDate={DATE}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/GetAppointmentByShop/?APServiceID={ID}&AppointmentDate={DATE}
 * @param {number} apserviceID - Service ID
 * @param {string} appointmentDate - Date in format "dd-MMM-yyyy" (e.g., "03-Dec-2025")
 * @returns {Promise<Array>} Array of appointments
 */
export const getAppointmentByShop = async (apserviceID, appointmentDate) => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/getappointmentbyshop?APServiceID=${encodeURIComponent(apserviceID)}&AppointmentDate=${encodeURIComponent(appointmentDate)}`;
    
    console.log('[API] ========================================');
    console.log('[API] Calling GetAppointmentByShop API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: GET');
    console.log('[API] APServiceID:', apserviceID);
    console.log('[API] AppointmentDate:', appointmentDate);
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] ========================================');
    console.log('[API] GetAppointmentByShop Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GetAppointmentByShop Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] GetAppointmentByShop Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    // Handle different response formats
    let appointments = data;
    
    // If response has a 'data' property, extract it
    if (data && typeof data === 'object' && data.data) {
      appointments = Array.isArray(data.data) ? data.data : [data.data];
    }
    // If response has a 'value' property (OData format), extract it
    else if (data && typeof data === 'object' && data.value) {
      appointments = Array.isArray(data.value) ? data.value : [data.value];
    }
    // If it's already an array, use it directly
    else if (Array.isArray(data)) {
      appointments = data;
    }
    // If it's a single object, wrap it in an array
    else if (data && typeof data === 'object') {
      appointments = [data];
    }
    // If empty or null, return empty array
    else {
      appointments = [];
    }
    
    console.log('[API] Processed appointments:', appointments);
    return appointments;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling GetAppointmentByShop:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Update appointment status (IN/OUT)
 * Frontend calls: http://localhost:5000/api/updateappointmentstatus?AppointmentBookingIDs={ID}&UserInOut=1&InOutStatus={In|Out}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/UpdateAppointmentStatusEx/
 * @param {number} appointmentBookingID - Appointment Booking ID
 * @param {string} inOutStatus - "In" or "Out"
 * @returns {Promise<object>} API response
 */
export const updateAppointmentStatus = async (appointmentBookingID, inOutStatus) => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/updateappointmentstatus?AppointmentBookingIDs=${encodeURIComponent(appointmentBookingID)}&UserInOut=1&InOutStatus=${encodeURIComponent(inOutStatus)}`;
    
    console.log('[API] ========================================');
    console.log('[API] Calling UpdateAppointmentStatus API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: GET');
    console.log('[API] AppointmentBookingID:', appointmentBookingID);
    console.log('[API] InOutStatus:', inOutStatus);
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] ========================================');
    console.log('[API] UpdateAppointmentStatus Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] UpdateAppointmentStatus Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] UpdateAppointmentStatus Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    return data;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling UpdateAppointmentStatus:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Get schedule/time slots for booking
 * Frontend calls: http://localhost:5000/api/getschedule?APServiceID={ID}&CurrentDate={DATE}&TodayDate={DATE}&TodayTime={TIME}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/GetSchedule/
 * @param {number} apserviceID - Service ID
 * @param {string} currentDate - Current date in format "dd-MMM-yyyy" (always today)
 * @param {string} todayDate - Selected date in format "dd-MMM-yyyy" (user selected date)
 * @param {string} todayTime - Time in format "HH:mm" (current time if today, else "00:00")
 * @returns {Promise<Array>} Array of schedule slots
 */
export const getSchedule = async (apserviceID, currentDate, todayDate, todayTime) => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/getschedule?APServiceID=${encodeURIComponent(apserviceID)}&CurrentDate=${encodeURIComponent(currentDate)}&TodayDate=${encodeURIComponent(todayDate)}&TodayTime=${encodeURIComponent(todayTime)}`;
    
    console.log('[API] ========================================');
    console.log('[API] Calling GetSchedule API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: GET');
    console.log('[API] APServiceID:', apserviceID);
    console.log('[API] CurrentDate:', currentDate);
    console.log('[API] TodayDate:', todayDate);
    console.log('[API] TodayTime:', todayTime);
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] ========================================');
    console.log('[API] GetSchedule Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GetSchedule Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] GetSchedule Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    // Handle different response formats
    let schedule = data;
    
    // If response has a 'data' property, extract it
    if (data && typeof data === 'object' && data.data) {
      schedule = Array.isArray(data.data) ? data.data : [data.data];
    }
    // If response has a 'value' property (OData format), extract it
    else if (data && typeof data === 'object' && data.value) {
      schedule = Array.isArray(data.value) ? data.value : [data.value];
    }
    // If it's already an array, use it directly
    else if (Array.isArray(data)) {
      schedule = data;
    }
    // If it's a single object, wrap it in an array
    else if (data && typeof data === 'object') {
      schedule = [data];
    }
    // If empty or null, return empty array
    else {
      schedule = [];
    }
    
    console.log('[API] Processed schedule:', schedule);
    return schedule;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling GetSchedule:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Insert/Book an appointment
 * Frontend calls: http://localhost:5000/api/insertappointments (POST)
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/InsertAppointments
 * @param {number} adminUserMasterID - Admin User Master ID
 * @param {number} apserviceTransID - Service Transaction ID
 * @param {string} patientName - Patient/Visitor Name
 * @param {string} remarks - Appointment Reason/Remarks
 * @param {string} bookedForDate - Date in format "Mon Dec 08 2025"
 * @param {string} alternateMobile - Alternate Mobile Number (optional)
 * @returns {Promise<Object>} API response
 */
export const insertAppointments = async (adminUserMasterID, apserviceTransID, patientName, remarks, bookedForDate, alternateMobile = '') => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/insertappointments`;
    
    const requestBody = {
      InsertAppointmentBookings: {
        AdminUserMasterID: adminUserMasterID,
        APServiceTransID: apserviceTransID,
        PatientName: patientName,
        Remarks: remarks,
        BookedForDate: bookedForDate,
        AlternateMobile: alternateMobile || ''
      }
    };
    
    console.log('[API] ========================================');
    console.log('[API] Calling InsertAppointments API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: POST');
    console.log('[API] Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] ========================================');
    console.log('[API] InsertAppointments Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] InsertAppointments Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] InsertAppointments Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    return data;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling InsertAppointments:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Get provider details by appointment booking ID
 * Frontend calls: http://localhost:5000/api/getproviderdetailsbyappointment?AppointmentBookingID={ID}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/GetProviderDetailsByAppointment/?AppointmentBookingID={ID}
 * @param {number} appointmentBookingID - Appointment Booking ID
 * @returns {Promise<object>} Provider details data
 */
export const getProviderDetailsByAppointment = async (appointmentBookingID) => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/getproviderdetailsbyappointment?AppointmentBookingID=${encodeURIComponent(appointmentBookingID)}`;
    
    console.log('[API] ========================================');
    console.log('[API] Calling GetProviderDetailsByAppointment API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: GET');
    console.log('[API] AppointmentBookingID:', appointmentBookingID);
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] ========================================');
    console.log('[API] GetProviderDetailsByAppointment Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GetProviderDetailsByAppointment Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] GetProviderDetailsByAppointment Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    // Handle different response formats
    let responseData = data;
    
    // If response has a 'value' property (OData format), extract it
    if (data && typeof data === 'object' && data.value) {
      responseData = Array.isArray(data.value) ? data.value : [data.value];
    }
    // If it's already an array, get the first item
    else if (Array.isArray(data) && data.length > 0) {
      responseData = data[0];
    }
    // If it's already an object, return it directly
    else if (data && typeof data === 'object' && !Array.isArray(data)) {
      responseData = data;
    }
    
    console.log('[API] Processed provider details:', responseData);
    return responseData;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling GetProviderDetailsByAppointment:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Delete appointment with custom message
 * Frontend calls: http://localhost:5000/api/deleteappointmentwithcustommessage (POST)
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/DeleteAppointmentWithCustomMessage/?AppointmentBookingID={ID}&CancelMessage={MESSAGE}
 * @param {number} appointmentBookingID - Appointment Booking ID
 * @param {string} cancelMessage - Cancellation message (max 200 characters)
 * @returns {Promise<number>} API response (-1 on success)
 */
export const deleteAppointmentWithCustomMessage = async (appointmentBookingID, cancelMessage) => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/deleteappointmentwithcustommessage`;
    
    const requestBody = {
      AppointmentBookingID: appointmentBookingID,
      CancelMessage: cancelMessage
    };
    
    console.log('[API] ========================================');
    console.log('[API] Calling DeleteAppointmentWithCustomMessage API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: POST');
    console.log('[API] Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] ========================================');
    console.log('[API] DeleteAppointmentWithCustomMessage Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] DeleteAppointmentWithCustomMessage Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] DeleteAppointmentWithCustomMessage Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    // Handle different response formats
    let responseValue = data;
    
    // If response is an object with data property
    if (data && typeof data === 'object' && data.data !== undefined) {
      responseValue = data.data;
    }
    // If response is an object with value property
    else if (data && typeof data === 'object' && data.value !== undefined) {
      responseValue = data.value;
    }
    
    // Convert to number if it's a string
    if (typeof responseValue === 'string') {
      responseValue = parseInt(responseValue, 10);
    }
    
    console.log('[API] Processed response value:', responseValue);
    return responseValue;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling DeleteAppointmentWithCustomMessage:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

/**
 * Delete multiple appointments
 * Frontend calls: http://localhost:5000/api/deletemultipleappointments?AppointmentBookingIDs={IDS}
 * Express server then calls: http://ws.eighty20technologies.com/Appointment/Service1.svc/DeleteMultipleAppointments/?AppointmentBookingIDs={IDS}
 * @param {string} appointmentBookingIDs - Comma-separated Appointment Booking IDs (e.g., "101,102,103")
 * @returns {Promise<object>} API response
 */
export const deleteMultipleAppointments = async (appointmentBookingIDs) => {
  try {
    const apiUrl = `${LOCAL_API_BASE}/deletemultipleappointments?AppointmentBookingIDs=${encodeURIComponent(appointmentBookingIDs)}`;
    
    console.log('[API] ========================================');
    console.log('[API] Calling DeleteMultipleAppointments API');
    console.log('[API] URL:', apiUrl);
    console.log('[API] Method: GET');
    console.log('[API] AppointmentBookingIDs:', appointmentBookingIDs);
    console.log('[API] ========================================');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API] ========================================');
    console.log('[API] DeleteMultipleAppointments Response Received');
    console.log('[API] Status:', response.status);
    console.log('[API] Status Text:', response.statusText);
    console.log('[API] OK:', response.ok);
    console.log('[API] ========================================');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] DeleteMultipleAppointments Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] ========================================');
    console.log('[API] DeleteMultipleAppointments Response Data:');
    console.log('[API] Full Response:', JSON.stringify(data, null, 2));
    console.log('[API] ========================================');
    
    return data;
  } catch (error) {
    console.error('[API] ========================================');
    console.error('[API] ERROR calling DeleteMultipleAppointments:');
    console.error('[API] Error Name:', error.name);
    console.error('[API] Error Message:', error.message);
    console.error('[API] Error Stack:', error.stack);
    console.error('[API] ========================================');
    throw error;
  }
};

export default EXTERNAL_API_BASE;