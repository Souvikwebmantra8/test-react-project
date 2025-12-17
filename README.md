# Doctor Appointment React App

A full-stack React application with Express.js API backend for managing doctor appointments.

## Project Structure

```
doctor_appoinment_react/
├── client/          # React frontend (Vite)
├── server/          # Express.js API backend
└── README.md
```

## Setup Instructions

### Backend (Express.js)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

   The API server will run on `http://localhost:5000`

### Frontend (React)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The React app will run on `http://localhost:3000`

## API Endpoints

- `GET /api/test` - Test endpoint to verify API is working
- `GET /api/health` - Health check endpoint

## Technologies Used

### Frontend
- React 18
- Vite
- Axios (for API calls)

### Backend
- Express.js
- CORS
- dotenv

## Next Steps

1. Add design/styling to the frontend
2. Implement API endpoints for doctor appointments
3. Connect frontend to backend APIs
4. Add data fetching and display components

