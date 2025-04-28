import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate, // Used for redirection
} from 'react-router-dom';
import { useSelector } from 'react-redux'; // Hook to read Redux state

// Import your page components (assuming you create these later)
import LoginPage from './pages/LoginPage';
//import RegisterPage from './pages/RegisterPage';
//import ChatPage from './pages/ChatPage';
// import NotFoundPage from './pages/NotFoundPage'; // Optional 404 page

// Import Redux state selector and RootState type
// Make sure you have selectIsLoggedIn defined in your authSlice or authSelectors file
import { selectIsLoggedIn } from './features/auth/authSelectors';
import { RootState } from './app/store';

// Import any global CSS
import './App.css';

// --- Helper Component for Protected Routes ---
// This component checks if the user is logged in.
// If yes, it renders the children (the protected page).
// If no, it redirects the user to the login page.
// children: JSX.Element
const ProtectedRoute: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Get the login status from the Redux store
  const isLoggedIn = useSelector((state: RootState) => selectIsLoggedIn(state));

  if (!isLoggedIn) {
    // User not logged in, redirect them to login page
    // 'replace' prevents the protected route from being added to history when not logged in
    return <Navigate to="/login" replace />;
  }

  // User is logged in, render the component they were trying to access
  return children;
};
// --- ---

function App() {
  // Optional: You might dispatch an action here on initial load
  // to check for an existing token in local storage, but often
  // this logic lives elsewhere (e.g., in main.tsx or a dedicated init component)
  // const dispatch = useDispatch();
  // React.useEffect(() => {
  //   dispatch(checkUserSession()); // Example action
  // }, [dispatch]);

  return (
    // BrowserRouter provides routing capabilities to its descendants
    <BrowserRouter>
      {/* You might add a persistent Layout component here later */}
      {/* <MainLayout> */}
      <Routes> {/* Container for all your routes */}

        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes - Wrapped with ProtectedRoute component */}
        <Route
          path="/chat" // Example route for the main chat interface
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

         {/* Example: Make root path redirect */}
         <Route
            path="/"
            element={
                <ProtectedRoute>
                    {/* If logged in, go to chat */}
                    <Navigate to="/chat" replace />
                </ProtectedRoute>
                // If ProtectedRoute redirects, user goes to /login
            }
          />

        {/* Add other routes here (e.g., profile, settings - likely protected) */}


        {/* Catch-all 404 Not Found Route */}
        {/* Replace div with a dedicated NotFoundPage component later */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />

      </Routes>
      {/* </MainLayout> */}
    </BrowserRouter>
  );
}

export default App;