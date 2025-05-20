import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { AppDispatch, RootState } from '../app/store'; 
import { loginUser, clearAuthError } from '../features/auth/authSlice';

// Interface for local form state (inputs only)
interface LoginFormData {
    loginIdentifier: string; // Holds username OR email entered by user
    password: string;
}

const LoginForm: React.FC = () => {
    // --- Local Component State ---
    // Only manages the current values typed into the input fields
    const [formData, setFormData] = useState<LoginFormData>({
        loginIdentifier: '',
        password: '',
    });

    // --- Redux Integration ---
    const dispatch = useDispatch<AppDispatch>(); // Hook to dispatch actions
    // Select relevant state pieces from the Redux store (auth slice)
    const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth); // Adjust 'state.auth' if your slice name differs

    // --- Navigation ---
    const navigate = useNavigate(); // Hook for programmatic navigation

    // --- Effect for Handling Post-Login ---
    // Redirects the user if login becomes successful (isAuthenticated changes to true)
    useEffect(() => {
        if (isAuthenticated) {
            console.log("Login successful via Redux state, redirecting...");
            navigate('/dashboard'); // Redirect to dashboard or your desired protected route
        }
        // Optional: Clear error when component unmounts (or identifier changes, etc.)
        // Return a cleanup function from useEffect
        return () => {
             // Dispatch clearAuthError only if you want errors to disappear when leaving the login page
             // dispatch(clearAuthError()); // Uncomment if desired
        };
    }, [isAuthenticated, navigate, dispatch]); // Dependencies for the effect

    // --- Event Handlers ---

    // Handles changes in input fields (updates local state)
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        // Clear error when user starts typing again (optional UX improvement)
        if (error) {
             dispatch(clearAuthError());
        }
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    // Handles form submission - Dispatches the Redux action
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Dispatch the async thunk action with credentials
        // The thunk needs to be designed to accept an object like this
        dispatch(loginUser({
            // Ensure the keys here match what your loginUser thunk expects
            username: formData.loginIdentifier, // Map identifier -> username if thunk/API expects 'username'
            password: formData.password
        }));
    };

    // --- JSX Rendering ---
    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            {/* Display error message obtained from Redux state */}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
                <label htmlFor="loginIdentifier">Username or Email:</label>
                <input
                    type="text" // Allows either username or email format
                    id="loginIdentifier"
                    name="loginIdentifier" // Links to the state key via handleChange
                    value={formData.loginIdentifier} // Controlled component using local state
                    onChange={handleChange}
                    required
                    disabled={isLoading} // Disable input based on Redux loading state
                    autoComplete="username" // Hint for browser autofill
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    name="password" // Links to the state key via handleChange
                    value={formData.password} // Controlled component using local state
                    onChange={handleChange}
                    required
                    disabled={isLoading} // Disable input based on Redux loading state
                    autoComplete="current-password" // Hint for browser autofill
                />
            </div>
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};

export default LoginForm;