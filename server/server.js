const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// External API base URL
const EXTERNAL_API_BASE = 'http://ws.eighty20technologies.com/Appointment/Service1.svc';

// Log all incoming requests for debugging (must be before routes)
app.use((req, res, next) => {
  console.log('[Server] ========================================');
  console.log('[Server] Incoming request:', req.method, req.url);
  console.log('[Server] Request path:', req.path);
  console.log('[Server] Request query:', req.query);
  console.log('[Server] Request headers:', req.headers);
  console.log('[Server] Request origin:', req.headers.origin);
  console.log('[Server] ========================================');
  next();
});

// Middleware - CORS configuration to allow all origins
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', cors());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Express CORS Proxy Server',
    endpoints: {
      authenticate: '/api/authenticate',
      checkUserType: '/api/checkusertype',
      test: '/api/test',
      health: '/api/health',
      proxy: '/api/proxy/*'
    }
  });
});

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'Express CORS Proxy',
    port: PORT
  });
});

// Authentication proxy route - handles CORS by proxying through Express server
app.get('/api/authenticate', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/authenticate route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request URL:', req.url);
  console.log('[Server] Request path:', req.path);
  console.log('[Server] Request query:', req.query);
  console.log('[Server] Request headers:', req.headers);
  
  try {
    // Extract query params - handle both capitalized and lowercase versions
    const email = req.query.Email || req.query.email;
    const password = req.query.Password || req.query.password;
    console.log('[Server] Step 1: Extracted query params');
    console.log('[Server] Email:', email);
    console.log('[Server] Password:', password ? '***' : 'empty');

    // Validate required parameters
    if (!email || !password) {
      console.log('[Server] Step 2: Validation FAILED - missing email or password');
      return res.status(400).json({ 
        error: 'Email and password are required',
        success: false,
        code: 'VALIDATION_ERROR'
      });
    }
    console.log('[Server] Step 2: Validation PASSED');

    // Build the external API URL - FIXED: Added proper endpoint path
    const externalUrl = `${EXTERNAL_API_BASE}/Authenticate/?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`;
    console.log('[Server] Step 3: Building external API URL');
    console.log('[Server] EXTERNAL_API_BASE:', EXTERNAL_API_BASE);
    console.log('[Server] External URL:', externalUrl);
    
    console.log('[Server] Step 4: Making HTTP GET request to external API...');
    // Make request to external API using Node.js http module
    const options = {
      timeout: 10000 // 10 second timeout
    };
    
    http.get(externalUrl, options, (externalRes) => {
      console.log('[Server] Step 5: External API response received');
      console.log('[Server] External API status code:', externalRes.statusCode);
      console.log('[Server] External API status message:', externalRes.statusMessage);
      console.log('[Server] External API headers:', externalRes.headers);
      
      let data = '';

      // Collect response data
      externalRes.on('data', (chunk) => {
        data += chunk;
        console.log('[Server] Step 6: Received data chunk, total length:', data.length);
      });

      // Handle response completion
      externalRes.on('end', () => {
        console.log('[Server] Step 7: External API response complete');
        console.log('[Server] Raw response data:', data);
        console.log('[Server] Response data type:', typeof data);
        console.log('[Server] Response data length:', data.length);
        
        try {
          // Try to parse as JSON first
          let parsedData;
          try {
            parsedData = JSON.parse(data);
            console.log('[Server] Step 8: Parsed as JSON:', parsedData);
          } catch {
            // If not JSON, check if it's a boolean string
            const lowerData = data.toLowerCase().trim();
            console.log('[Server] Step 8: Not JSON, checking boolean string');
            console.log('[Server] Lowercase data:', lowerData);
            if (lowerData === 'true' || lowerData === 'false') {
              parsedData = lowerData === 'true';
              console.log('[Server] Parsed as boolean:', parsedData);
            } else {
              parsedData = data;
              console.log('[Server] Using raw data:', parsedData);
            }
          }

          console.log('[Server] Step 9: Sending response to frontend');
          console.log('[Server] Final parsed data:', parsedData);
          
          // Add additional info to response
          const responseData = {
            success: parsedData === true || parsedData === 'true' || parsedData === 1,
            data: parsedData,
            timestamp: new Date().toISOString(),
            source: 'external_api_proxy'
          };
          
          // Return the response to the frontend
          res.json(responseData);
          console.log('[Server] Step 10: Response sent successfully');
          console.log('[Server] Response data:', responseData);
          console.log('[Server] ========================================');
        } catch (error) {
          console.error('[Server] ERROR in response parsing:', error);
          console.error('[Server] Error stack:', error.stack);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false,
            code: 'RESPONSE_PARSE_ERROR'
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] ERROR calling external API:', error);
      console.error('[Server] Error message:', error.message);
      console.error('[Server] Error code:', error.code);
      console.error('[Server] Error stack:', error.stack);
      res.status(502).json({ 
        error: 'Unable to connect to authentication service',
        details: error.message,
        success: false,
        code: 'EXTERNAL_API_ERROR'
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in authentication route:', error);
    console.error('[Server] Error message:', error.message);
    console.error('[Server] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Also handle POST requests for authentication (for form submissions)
app.post('/api/authenticate', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] POST /api/authenticate route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request body:', req.body);
  console.log('[Server] Request headers:', req.headers);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        success: false,
        code: 'VALIDATION_ERROR'
      });
    }

    const externalUrl = `${EXTERNAL_API_BASE}/Authenticate/?Email=${encodeURIComponent(email)}&Password=${encodeURIComponent(password)}`;
    console.log('[Server] External URL:', externalUrl);
    
    http.get(externalUrl, (externalRes) => {
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            const lowerData = data.toLowerCase().trim();
            if (lowerData === 'true' || lowerData === 'false') {
              parsedData = lowerData === 'true';
            } else {
              parsedData = data;
            }
          }
          
          const responseData = {
            success: parsedData === true || parsedData === 'true' || parsedData === 1,
            data: parsedData,
            timestamp: new Date().toISOString(),
            source: 'external_api_proxy'
          };
          
          res.json(responseData);
        } catch (error) {
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false,
            code: 'RESPONSE_PARSE_ERROR'
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] ERROR calling external API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to authentication service',
        details: error.message,
        success: false,
        code: 'EXTERNAL_API_ERROR'
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in authentication route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// CheckUserType proxy route
app.get('/api/checkusertype', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/checkusertype route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const email = req.query.Email || req.query.email;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/CheckUserType/?Email=${encodeURIComponent(email)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
          
          console.log('[Server] CheckUserType raw response:', parsedData);
          
          // Handle different response formats
          let responseData = parsedData;
          
          // If response has a 'value' property (OData format), extract it
          if (parsedData && typeof parsedData === 'object' && parsedData.value) {
            console.log('[Server] Response has "value" property, extracting array');
            responseData = parsedData.value;
          }
          // If it's already an array, use it directly
          else if (Array.isArray(parsedData)) {
            console.log('[Server] Response is already an array');
            responseData = parsedData;
          }
          
          console.log('[Server] CheckUserType final response:', responseData);
          
          // Return the response
          res.json(responseData);
        } catch (error) {
          console.error('[Server] Error processing CheckUserType response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling CheckUserType API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in CheckUserType route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// ProviderDetails proxy route
app.get('/api/providerdetails', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/providerdetails route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const adminUserMasterID = req.query.AdminUserMasterID || req.query.adminUserMasterID;
    
    if (!adminUserMasterID) {
      return res.status(400).json({ 
        error: 'AdminUserMasterID is required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/ProviderDetails/?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
          
          console.log('[Server] ProviderDetails raw response:', parsedData);
          
          // Handle different response formats
          let responseData = parsedData;
          
          // If response has a 'value' property (OData format), extract it
          if (parsedData && typeof parsedData === 'object' && parsedData.value) {
            console.log('[Server] Response has "value" property, extracting array');
            responseData = parsedData.value;
          }
          // If it's already an array, use it directly
          else if (Array.isArray(parsedData)) {
            console.log('[Server] Response is already an array');
            responseData = parsedData;
          }
          
          console.log('[Server] ProviderDetails final response:', responseData);
          
          // Return the response
          res.json(responseData);
        } catch (error) {
          console.error('[Server] Error processing ProviderDetails response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling ProviderDetails API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in ProviderDetails route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// GetUserInformation proxy route
app.get('/api/getuserinformation', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/getuserinformation route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const adminUserMasterID = req.query.AdminUserMasterID || req.query.adminUserMasterID;
    
    if (!adminUserMasterID) {
      return res.status(400).json({ 
        error: 'AdminUserMasterID is required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/GetUserInformation/?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
          
          console.log('[Server] GetUserInformation raw response:', parsedData);
          
          // Handle different response formats
          let responseData = parsedData;
          
          // If response has a 'value' property (OData format), extract it
          if (parsedData && typeof parsedData === 'object' && parsedData.value) {
            console.log('[Server] Response has "value" property, extracting array');
            responseData = parsedData.value;
          }
          // If it's already an array, use it directly
          else if (Array.isArray(parsedData)) {
            console.log('[Server] Response is already an array');
            responseData = parsedData;
          }
          
          console.log('[Server] GetUserInformation final response:', responseData);
          
          // Return the response
          res.json(responseData);
        } catch (error) {
          console.error('[Server] Error processing GetUserInformation response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling GetUserInformation API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in GetUserInformation route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// GetUser proxy route - for checking user Active status
app.get('/api/getuser', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/getuser route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const adminUserMasterID = req.query.AdminUserMasterID || req.query.adminUserMasterID;
    
    if (!adminUserMasterID) {
      return res.status(400).json({ 
        error: 'AdminUserMasterID is required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/GetUser/?AdminUserMasterID=${encodeURIComponent(adminUserMasterID)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
          
          console.log('[Server] GetUser raw response:', parsedData);
          
          // Handle different response formats
          let responseData = parsedData;
          
          // If response has a 'value' property (OData format), extract it
          if (parsedData && typeof parsedData === 'object' && parsedData.value) {
            console.log('[Server] Response has "value" property, extracting array');
            responseData = parsedData.value;
          }
          // If it's already an array, use it directly
          else if (Array.isArray(parsedData)) {
            console.log('[Server] Response is already an array');
            responseData = parsedData;
          }
          
          console.log('[Server] GetUser final response:', responseData);
          
          // Return the response
          res.json(responseData);
        } catch (error) {
          console.error('[Server] Error processing GetUser response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling GetUser API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in GetUser route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// InsertLateDetails proxy route - POST request
app.post('/api/insertlatedetails', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] POST /api/insertlatedetails route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[Server] Request headers:', req.headers);
  
  try {
    const { lateDetails } = req.body;
    
    if (!lateDetails) {
      return res.status(400).json({ 
        error: 'lateDetails object is required',
        success: false,
        code: 'VALIDATION_ERROR'
      });
    }

    const { AdminUserMasterID, LateDate, LateTime } = lateDetails;
    
    if (!AdminUserMasterID || !LateDate || !LateTime) {
      return res.status(400).json({ 
        error: 'AdminUserMasterID, LateDate, and LateTime are required',
        success: false,
        code: 'VALIDATION_ERROR'
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/InsertLateDetails`;
    console.log('[Server] External URL:', externalUrl);
    console.log('[Server] Request payload:', JSON.stringify({ lateDetails }, null, 2));
    
    // Make POST request to external API using http module
    const url = require('url');
    const parsedUrl = new URL(externalUrl);
    
    const postData = JSON.stringify({ lateDetails });
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json'
      },
      timeout: 10000
    };
    
    console.log('[Server] Making POST request to external API...');
    
    const externalReq = http.request(options, (externalRes) => {
      console.log('[Server] External API response received');
      console.log('[Server] External API status code:', externalRes.statusCode);
      console.log('[Server] External API status message:', externalRes.statusMessage);
      console.log('[Server] External API headers:', externalRes.headers);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
        console.log('[Server] Received data chunk, total length:', data.length);
      });

      externalRes.on('end', () => {
        console.log('[Server] External API response complete');
        console.log('[Server] Raw response data:', data);
        console.log('[Server] Raw response data type:', typeof data);
        console.log('[Server] Raw response data length:', data.length);
        
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
            console.log('[Server] Parsed as JSON:', parsedData);
            console.log('[Server] Parsed data type:', typeof parsedData);
          } catch {
            // If not JSON, check if it's a number string like "1"
            const trimmedData = data.trim();
            console.log('[Server] Not JSON, checking if it\'s a number string');
            console.log('[Server] Trimmed data:', trimmedData);
            
            // Try to parse as number if it's a numeric string
            if (trimmedData === '1' || trimmedData === '0' || !isNaN(trimmedData)) {
              parsedData = Number(trimmedData);
              console.log('[Server] Converted to number:', parsedData);
            } else {
              parsedData = trimmedData;
              console.log('[Server] Using raw trimmed data:', parsedData);
            }
          }

          console.log('[Server] Sending response to frontend');
          console.log('[Server] Final parsed data:', parsedData);
          console.log('[Server] Final parsed data type:', typeof parsedData);
          
          // Return the response to the frontend
          res.json({
            success: true,
            data: parsedData,
            timestamp: new Date().toISOString(),
            source: 'external_api_proxy'
          });
          console.log('[Server] Response sent successfully');
          console.log('[Server] ========================================');
        } catch (error) {
          console.error('[Server] ERROR in response parsing:', error);
          console.error('[Server] Error stack:', error.stack);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false,
            code: 'RESPONSE_PARSE_ERROR'
          });
        }
      });
    });

    externalReq.on('error', (error) => {
      console.error('[Server] ERROR calling external API:', error);
      console.error('[Server] Error message:', error.message);
      console.error('[Server] Error code:', error.code);
      console.error('[Server] Error stack:', error.stack);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        details: error.message,
        success: false,
        code: 'EXTERNAL_API_ERROR'
      });
    });

    externalReq.on('timeout', () => {
      console.error('[Server] Request timeout');
      externalReq.destroy();
      res.status(504).json({ 
        error: 'Request timeout',
        success: false,
        code: 'REQUEST_TIMEOUT'
      });
    });

    // Write the request body
    externalReq.write(postData);
    externalReq.end();

  } catch (error) {
    console.error('[Server] ERROR in InsertLateDetails route:', error);
    console.error('[Server] Error message:', error.message);
    console.error('[Server] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// InsertOutOfOffice proxy route - POST request
app.post('/api/insertoutofoffice', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] POST /api/insertoutofoffice route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[Server] Request headers:', req.headers);
  
  try {
    const { adminOOO } = req.body;
    
    if (!adminOOO) {
      return res.status(400).json({ 
        error: 'adminOOO object is required',
        success: false,
        code: 'VALIDATION_ERROR'
      });
    }

    const { AdminUserMasterID, OOOFrom, OOOTo, OOOMessage } = adminOOO;
    
    if (!AdminUserMasterID || !OOOFrom || !OOOTo || !OOOMessage) {
      return res.status(400).json({ 
        error: 'AdminUserMasterID, OOOFrom, OOOTo, and OOOMessage are required',
        success: false,
        code: 'VALIDATION_ERROR'
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/InsertLateDetails`;
    console.log('[Server] External URL:', externalUrl);
    console.log('[Server] Request payload:', JSON.stringify({ adminOOO }, null, 2));
    
    // Make POST request to external API using http module
    const url = require('url');
    const parsedUrl = new URL(externalUrl);
    
    const postData = JSON.stringify({ adminOOO });
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json'
      },
      timeout: 10000
    };
    
    console.log('[Server] Making POST request to external API...');
    
    const externalReq = http.request(options, (externalRes) => {
      console.log('[Server] External API response received');
      console.log('[Server] External API status code:', externalRes.statusCode);
      console.log('[Server] External API status message:', externalRes.statusMessage);
      console.log('[Server] External API headers:', externalRes.headers);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
        console.log('[Server] Received data chunk, total length:', data.length);
      });

      externalRes.on('end', () => {
        console.log('[Server] External API response complete');
        console.log('[Server] Raw response data:', data);
        console.log('[Server] Raw response data type:', typeof data);
        console.log('[Server] Raw response data length:', data.length);
        
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
            console.log('[Server] Parsed as JSON:', parsedData);
            console.log('[Server] Parsed data type:', typeof parsedData);
          } catch {
            // If not JSON, check if it's a number string like "1"
            const trimmedData = data.trim();
            console.log('[Server] Not JSON, checking if it\'s a number string');
            console.log('[Server] Trimmed data:', trimmedData);
            
            // Try to parse as number if it's a numeric string
            if (trimmedData === '1' || trimmedData === '0' || !isNaN(trimmedData)) {
              parsedData = Number(trimmedData);
              console.log('[Server] Converted to number:', parsedData);
            } else {
              parsedData = trimmedData;
              console.log('[Server] Using raw trimmed data:', parsedData);
            }
          }

          console.log('[Server] Sending response to frontend');
          console.log('[Server] Final parsed data:', parsedData);
          console.log('[Server] Final parsed data type:', typeof parsedData);
          
          // Return the response to the frontend
          res.json({
            success: true,
            data: parsedData,
            timestamp: new Date().toISOString(),
            source: 'external_api_proxy'
          });
          console.log('[Server] Response sent successfully');
          console.log('[Server] ========================================');
        } catch (error) {
          console.error('[Server] ERROR in response parsing:', error);
          console.error('[Server] Error stack:', error.stack);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false,
            code: 'RESPONSE_PARSE_ERROR'
          });
        }
      });
    });

    externalReq.on('error', (error) => {
      console.error('[Server] ERROR calling external API:', error);
      console.error('[Server] Error message:', error.message);
      console.error('[Server] Error code:', error.code);
      console.error('[Server] Error stack:', error.stack);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        details: error.message,
        success: false,
        code: 'EXTERNAL_API_ERROR'
      });
    });

    externalReq.on('timeout', () => {
      console.error('[Server] Request timeout');
      externalReq.destroy();
      res.status(504).json({ 
        error: 'Request timeout',
        success: false,
        code: 'REQUEST_TIMEOUT'
      });
    });

    // Write the request body
    externalReq.write(postData);
    externalReq.end();

  } catch (error) {
    console.error('[Server] ERROR in InsertOutOfOffice route:', error);
    console.error('[Server] Error message:', error.message);
    console.error('[Server] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// GetAppointmentByShop proxy route
app.get('/api/getappointmentbyshop', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/getappointmentbyshop route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const apserviceID = req.query.APServiceID || req.query.apserviceID;
    const appointmentDate = req.query.AppointmentDate || req.query.appointmentDate;
    
    if (!apserviceID || !appointmentDate) {
      return res.status(400).json({ 
        error: 'APServiceID and AppointmentDate are required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/GetAppointmentByShop/?APServiceID=${encodeURIComponent(apserviceID)}&AppointmentDate=${encodeURIComponent(appointmentDate)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
          
          console.log('[Server] GetAppointmentByShop raw response:', parsedData);
          
          // Handle different response formats
          let responseData = parsedData;
          
          // If response has a 'value' property (OData format), extract it
          if (parsedData && typeof parsedData === 'object' && parsedData.value) {
            console.log('[Server] Response has "value" property, extracting array');
            responseData = parsedData.value;
          }
          // If it's already an array, use it directly
          else if (Array.isArray(parsedData)) {
            console.log('[Server] Response is already an array');
            responseData = parsedData;
          }
          
          console.log('[Server] GetAppointmentByShop final response:', responseData);
          
          // Return the response
          res.json(responseData);
        } catch (error) {
          console.error('[Server] Error processing GetAppointmentByShop response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling GetAppointmentByShop API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in GetAppointmentByShop route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// GetProviderDetailsByAppointment proxy route
app.get('/api/getproviderdetailsbyappointment', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/getproviderdetailsbyappointment route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const appointmentBookingID = req.query.AppointmentBookingID || req.query.appointmentBookingID;
    
    if (!appointmentBookingID) {
      return res.status(400).json({ 
        error: 'AppointmentBookingID is required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/GetProviderDetailsByAppointment/?AppointmentBookingID=${encodeURIComponent(appointmentBookingID)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
          
          console.log('[Server] GetProviderDetailsByAppointment raw response:', parsedData);
          
          // Handle different response formats
          let responseData = parsedData;
          
          // If response has a 'value' property (OData format), extract it
          if (parsedData && typeof parsedData === 'object' && parsedData.value) {
            console.log('[Server] Response has "value" property, extracting array');
            responseData = parsedData.value;
          }
          // If it's already an array, use it directly
          else if (Array.isArray(parsedData)) {
            console.log('[Server] Response is already an array');
            responseData = parsedData;
          }
          
          console.log('[Server] GetProviderDetailsByAppointment final response:', responseData);
          
          // Return the response
          res.json(responseData);
        } catch (error) {
          console.error('[Server] Error processing GetProviderDetailsByAppointment response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling GetProviderDetailsByAppointment API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in GetProviderDetailsByAppointment route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// GetSchedule proxy route
app.get('/api/getschedule', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/getschedule route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const apserviceID = req.query.APServiceID || req.query.apserviceID;
    const currentDate = req.query.CurrentDate || req.query.currentDate;
    const todayDate = req.query.TodayDate || req.query.todayDate;
    const todayTime = req.query.TodayTime || req.query.todayTime;
    
    if (!apserviceID || !currentDate || !todayDate || !todayTime) {
      return res.status(400).json({ 
        error: 'APServiceID, CurrentDate, TodayDate, and TodayTime are required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/GetSchedule/?APServiceID=${encodeURIComponent(apserviceID)}&CurrentDate=${encodeURIComponent(currentDate)}&TodayDate=${encodeURIComponent(todayDate)}&TodayTime=${encodeURIComponent(todayTime)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
          
          console.log('[Server] GetSchedule raw response:', parsedData);
          
          // Handle different response formats
          let responseData = parsedData;
          
          // If response has a 'value' property (OData format), extract it
          if (parsedData && typeof parsedData === 'object' && parsedData.value) {
            console.log('[Server] Response has "value" property, extracting array');
            responseData = parsedData.value;
          }
          // If it's already an array, use it directly
          else if (Array.isArray(parsedData)) {
            console.log('[Server] Response is already an array');
            responseData = parsedData;
          }
          
          console.log('[Server] GetSchedule final response:', responseData);
          
          // Return the response
          res.json(responseData);
        } catch (error) {
          console.error('[Server] Error processing GetSchedule response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling GetSchedule API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in GetSchedule route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// UpdateAppointmentStatus proxy route
app.get('/api/updateappointmentstatus', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/updateappointmentstatus route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const appointmentBookingIDs = req.query.AppointmentBookingIDs || req.query.appointmentBookingIDs;
    const userInOut = req.query.UserInOut || req.query.userInOut || '1';
    const inOutStatus = req.query.InOutStatus || req.query.inOutStatus;
    
    if (!appointmentBookingIDs || !inOutStatus) {
      return res.status(400).json({ 
        error: 'AppointmentBookingIDs and InOutStatus are required',
        success: false 
      });
    }

    // Validate InOutStatus
    if (inOutStatus !== 'In' && inOutStatus !== 'Out') {
      return res.status(400).json({ 
        error: 'InOutStatus must be "In" or "Out"',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/UpdateAppointmentStatusEx/?AppointmentBookingIDs=${encodeURIComponent(appointmentBookingIDs)}&UserInOut=${encodeURIComponent(userInOut)}&InOutStatus=${encodeURIComponent(inOutStatus)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
            console.log('[Server] Parsed as JSON:', parsedData);
          } catch {
            // If not JSON, check if it's a number string like "1"
            const trimmedData = data.trim();
            console.log('[Server] Not JSON, checking if it\'s a number string');
            console.log('[Server] Trimmed data:', trimmedData);
            
            // Try to parse as number if it's a numeric string
            if (trimmedData === '1' || trimmedData === '0' || !isNaN(trimmedData)) {
              parsedData = Number(trimmedData);
              console.log('[Server] Converted to number:', parsedData);
            } else {
              parsedData = trimmedData;
              console.log('[Server] Using raw trimmed data:', parsedData);
            }
          }
          
          console.log('[Server] UpdateAppointmentStatus final response:', parsedData);
          
          // Return the response
          res.json({
            success: true,
            data: parsedData,
            timestamp: new Date().toISOString(),
            source: 'external_api_proxy'
          });
        } catch (error) {
          console.error('[Server] Error processing UpdateAppointmentStatus response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling UpdateAppointmentStatus API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in UpdateAppointmentStatus route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// Generic proxy route for other API endpoints
app.get('/api/proxy/*', async (req, res) => {
  try {
    // Get the endpoint path after /api/proxy/
    const endpoint = req.path.replace('/api/proxy', '');
    const queryString = req.url.split('?')[1] || '';
    
    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}${endpoint}${queryString ? '?' + queryString : ''}`;
    console.log('[Server] Proxying request to:', externalUrl);

    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
          
          const responseData = {
            success: true,
            data: parsedData,
            timestamp: new Date().toISOString(),
            source: 'external_api_proxy'
          };
          
          res.json(responseData);
        } catch (error) {
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false,
            code: 'RESPONSE_PARSE_ERROR'
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling external API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        details: error.message,
        success: false,
        code: 'EXTERNAL_API_ERROR'
      });
    });

  } catch (error) {
    console.error('[Server] Proxy route error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// InsertAppointments proxy route - POST request
app.post('/api/insertappointments', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] POST /api/insertappointments route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[Server] Request headers:', req.headers);
  
  try {
    const { InsertAppointmentBookings } = req.body;
    
    if (!InsertAppointmentBookings) {
      return res.status(400).json({ 
        error: 'InsertAppointmentBookings object is required',
        success: false,
        code: 'VALIDATION_ERROR'
      });
    }

    const { AdminUserMasterID, APServiceTransID, PatientName, Remarks, BookedForDate, AlternateMobile } = InsertAppointmentBookings;
    
    if (!AdminUserMasterID || !APServiceTransID || !PatientName || !Remarks || !BookedForDate) {
      return res.status(400).json({ 
        error: 'AdminUserMasterID, APServiceTransID, PatientName, Remarks, and BookedForDate are required',
        success: false,
        code: 'VALIDATION_ERROR'
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/InsertAppointments`;
    console.log('[Server] External URL:', externalUrl);
    console.log('[Server] Request payload:', JSON.stringify({ InsertAppointmentBookings }, null, 2));
    
    // Make POST request to external API using http module
    const url = require('url');
    const parsedUrl = new URL(externalUrl);
    
    const postData = JSON.stringify({ InsertAppointmentBookings });
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json'
      },
      timeout: 10000
    };
    
    console.log('[Server] Making POST request to external API...');
    
    const externalReq = http.request(options, (externalRes) => {
      console.log('[Server] External API response received');
      console.log('[Server] External API status code:', externalRes.statusCode);
      console.log('[Server] External API status message:', externalRes.statusMessage);
      console.log('[Server] External API headers:', externalRes.headers);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
        console.log('[Server] Received data chunk, total length:', data.length);
      });

      externalRes.on('end', () => {
        console.log('[Server] External API response complete');
        console.log('[Server] Raw response data:', data);
        console.log('[Server] Raw response data type:', typeof data);
        console.log('[Server] Raw response data length:', data.length);
        
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
            console.log('[Server] Parsed as JSON:', parsedData);
            console.log('[Server] Parsed data type:', typeof parsedData);
          } catch {
            // If not JSON, check if it's a number string like "1"
            const trimmedData = data.trim();
            console.log('[Server] Not JSON, checking if it\'s a number string');
            console.log('[Server] Trimmed data:', trimmedData);
            
            // Try to parse as number if it's a numeric string
            if (trimmedData === '1' || trimmedData === '0' || !isNaN(trimmedData)) {
              parsedData = Number(trimmedData);
              console.log('[Server] Converted to number:', parsedData);
            } else {
              parsedData = trimmedData;
              console.log('[Server] Using raw trimmed data:', parsedData);
            }
          }

          console.log('[Server] Sending response to frontend');
          console.log('[Server] Final parsed data:', parsedData);
          
          // Return the response to the frontend
          res.json({
            success: true,
            data: parsedData,
            timestamp: new Date().toISOString(),
            source: 'external_api_proxy'
          });
          console.log('[Server] Response sent successfully');
          console.log('[Server] ========================================');
        } catch (error) {
          console.error('[Server] ERROR in response parsing:', error);
          console.error('[Server] Error stack:', error.stack);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false,
            code: 'RESPONSE_PARSE_ERROR'
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] ERROR calling external API:', error);
      console.error('[Server] Error message:', error.message);
      console.error('[Server] Error code:', error.code);
      console.error('[Server] Error stack:', error.stack);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        details: error.message,
        success: false,
        code: 'EXTERNAL_API_ERROR'
      });
    });

    externalReq.on('timeout', () => {
      console.error('[Server] Request timeout');
      externalReq.destroy();
      res.status(504).json({ 
        error: 'Request timeout',
        success: false,
        code: 'REQUEST_TIMEOUT'
      });
    });

    // Write the request body
    externalReq.write(postData);
    externalReq.end();

  } catch (error) {
    console.error('[Server] ERROR in InsertAppointments route:', error);
    console.error('[Server] Error message:', error.message);
    console.error('[Server] Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// DeleteAppointmentWithCustomMessage proxy route
app.post('/api/deleteappointmentwithcustommessage', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/deleteappointmentwithcustommessage route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request body:', req.body);
  
  try {
    const { AppointmentBookingID, CancelMessage } = req.body;
    
    if (!AppointmentBookingID) {
      return res.status(400).json({ 
        error: 'AppointmentBookingID is required',
        success: false 
      });
    }

    if (!CancelMessage || CancelMessage.trim() === '') {
      return res.status(400).json({ 
        error: 'CancelMessage is required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/DeleteAppointmentWithCustomMessage/?AppointmentBookingID=${encodeURIComponent(AppointmentBookingID)}&CancelMessage=${encodeURIComponent(CancelMessage)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch {
            // Try to parse as number if it's a numeric string
            const trimmedData = data.trim();
            if (trimmedData === '-1' || trimmedData === '-1') {
              parsedData = -1;
            } else if (!isNaN(trimmedData)) {
              parsedData = Number(trimmedData);
            } else {
              parsedData = data;
            }
          }
          
          console.log('[Server] DeleteAppointmentWithCustomMessage raw response:', parsedData);
          
          // Return the response
          res.json(parsedData);
        } catch (error) {
          console.error('[Server] Error processing DeleteAppointmentWithCustomMessage response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling DeleteAppointmentWithCustomMessage API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in DeleteAppointmentWithCustomMessage route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// DeleteMultipleAppointments proxy route
app.get('/api/deletemultipleappointments', async (req, res) => {
  console.log('[Server] ========================================');
  console.log('[Server] /api/deletemultipleappointments route hit!');
  console.log('[Server] Request method:', req.method);
  console.log('[Server] Request query:', req.query);
  
  try {
    const appointmentBookingIDs = req.query.AppointmentBookingIDs || req.query.appointmentBookingIDs;
    
    if (!appointmentBookingIDs) {
      return res.status(400).json({ 
        error: 'AppointmentBookingIDs is required',
        success: false 
      });
    }

    // Build the external API URL
    const externalUrl = `${EXTERNAL_API_BASE}/DeleteMultipleAppointments/?AppointmentBookingIDs=${encodeURIComponent(appointmentBookingIDs)}`;
    console.log('[Server] External URL:', externalUrl);
    
    // Make request to external API
    http.get(externalUrl, (externalRes) => {
      console.log('[Server] External API status:', externalRes.statusCode);
      
      let data = '';

      externalRes.on('data', (chunk) => {
        data += chunk;
      });

      externalRes.on('end', () => {
        try {
          let parsedData;
          try {
            parsedData = JSON.parse(data);
            console.log('[Server] Parsed as JSON:', parsedData);
          } catch {
            // If not JSON, check if it's a number string like "1"
            const trimmedData = data.trim();
            console.log('[Server] Not JSON, checking if it\'s a number string');
            console.log('[Server] Trimmed data:', trimmedData);
            
            // Try to parse as number if it's a numeric string
            if (trimmedData === '1' || trimmedData === '0' || !isNaN(trimmedData)) {
              parsedData = Number(trimmedData);
              console.log('[Server] Converted to number:', parsedData);
            } else {
              parsedData = trimmedData;
              console.log('[Server] Using raw trimmed data:', parsedData);
            }
          }
          
          console.log('[Server] DeleteMultipleAppointments final response:', parsedData);
          
          // Return the response
          res.json({
            success: true,
            data: parsedData,
            timestamp: new Date().toISOString(),
            source: 'external_api_proxy'
          });
        } catch (error) {
          console.error('[Server] Error processing DeleteMultipleAppointments response:', error);
          res.status(500).json({ 
            error: 'Error processing API response',
            success: false 
          });
        }
      });
    }).on('error', (error) => {
      console.error('[Server] Error calling DeleteMultipleAppointments API:', error);
      res.status(502).json({ 
        error: 'Unable to connect to API service',
        success: false 
      });
    });

  } catch (error) {
    console.error('[Server] ERROR in DeleteMultipleAppointments route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

app.use('/api/*', (req, res) => {
  console.log('[Server] 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    success: false,
    code: 'ROUTE_NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server] Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    success: false,
    code: 'UNHANDLED_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('[Server] ========================================');
  console.log(`[Server] Server is running on http://localhost:${PORT}`);
  console.log(`[Server] API endpoints available at http://localhost:${PORT}/api`);
  console.log(`[Server] Authentication endpoint: http://localhost:${PORT}/api/authenticate`);
  console.log(`[Server] CheckUserType endpoint: http://localhost:${PORT}/api/checkusertype`);
  console.log(`[Server] ProviderDetails endpoint: http://localhost:${PORT}/api/providerdetails`);
  console.log(`[Server] GetUserInformation endpoint: http://localhost:${PORT}/api/getuserinformation`);
  console.log(`[Server] GetUser endpoint: http://localhost:${PORT}/api/getuser`);
  console.log(`[Server] GetAppointmentByShop endpoint: http://localhost:${PORT}/api/getappointmentbyshop`);
  console.log(`[Server] GetProviderDetailsByAppointment endpoint: http://localhost:${PORT}/api/getproviderdetailsbyappointment`);
  console.log(`[Server] GetSchedule endpoint: http://localhost:${PORT}/api/getschedule`);
  console.log(`[Server] UpdateAppointmentStatus endpoint: http://localhost:${PORT}/api/updateappointmentstatus`);
  console.log(`[Server] DeleteAppointmentWithCustomMessage endpoint: http://localhost:${PORT}/api/deleteappointmentwithcustommessage`);
  console.log(`[Server] DeleteMultipleAppointments endpoint: http://localhost:${PORT}/api/deletemultipleappointments`);
  console.log(`[Server] Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[Server] Proxy endpoint: http://localhost:${PORT}/api/proxy/*`);
  console.log(`[Server] ========================================`);
  console.log(`[Server] IMPORTANT: Your React app should call:`);
  console.log(`[Server] http://localhost:${PORT}/api/authenticate?Email=EMAIL&Password=PASSWORD`);
  console.log(`[Server] NOT http://localhost:3000/api/authenticate`);
  console.log(`[Server] ========================================`);
  console.log('[Server] Waiting for requests...');
});