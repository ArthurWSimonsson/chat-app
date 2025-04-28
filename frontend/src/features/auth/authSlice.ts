// features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// Optional: import axios from 'axios';

// --- Interfaces ---

// Credentials passed from the LoginForm component
interface LoginCredentials {
    username: string; // This field holds username OR email from the form
    password: string;
}

// Matches the actual JSON structure returned by your backend API
interface JwtResponseData {
    token: string;
    id: number; // <-- Adjusted to allow null based on your response!
    username: string;
    email: string;
    roles: string[];
    type?: string;
}

// Structure for the user object stored in Redux state
export interface User { // Exporting User type might be useful elsewhere
    id: number | null; // <-- Adjusted to allow null!
    username: string;
    email: string;
    // roles?: string[]; // Optionally store roles if needed
}

// Structure of the Auth state slice
export interface AuthState { // Exporting AuthState for RootState inference elsewhere if needed
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

// --- Initial State ---
// Function to get initial token from storage, if desired
const getInitialToken = (): string | null => {
    if (typeof window !== 'undefined') { // Check if running in browser environment
        return localStorage.getItem('authToken');
    }
    return null;
};

// Consider deriving initial isAuthenticated/user state based on token presence/validity
const initialToken = getInitialToken();
// In a real app, you might decode the token here to get initial user info or check expiry
// For simplicity now, we just check if a token exists.
const initialState: AuthState = {
    isAuthenticated: !!initialToken, // Set to true if token exists initially
    user: null, // Should be fetched based on token or on first authenticated request
    token: initialToken,
    isLoading: false,
    error: null,
};


// --- Async Thunk for Login Action ---
export const loginUser = createAsyncThunk<
    { user: User; token: string }, // Type of the return value on success (fulfilled payload)
    LoginCredentials, // Type of the argument passed to the thunk
    { rejectValue: string } // Type of the value returned on failure (rejected payload)
>(
    'auth/loginUser',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        console.log('Dispatching loginUser thunk with:', credentials);
        try {
            // Using the URL you provided
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: credentials.username, // Sending the identifier as 'username'
                    password: credentials.password,
                }),
            });

            const data: JwtResponseData | any = await response.json(); // Parse JSON response

            if (!response.ok) {
                console.error('Login API Error Response:', data);
                const errorMessage = data?.message || data?.error || `Login failed (${response.status})`;
                return rejectWithValue(errorMessage); // Reject with error message
            }

            console.log('Login API Success Response:', data);

            // --- Map response data to payload, handling the potentially null ID ---
            const userPayload: User = {
                id: data.id, // data.id is null based on your example, which is now allowed
                username: data.username,
                email: data.email,
            };

            // Store token in localStorage for persistence
            if (data.token) {
                 localStorage.setItem('authToken', data.token);
            } else {
                 console.warn("No token received in login response!"); // Should not happen on success
            }

            // Return the structured payload for the 'fulfilled' action
            return { user: userPayload, token: data.token };

        } catch (error: any) {
            console.error('Login Thunk Network/Processing Error:', error);
            return rejectWithValue(error.message || 'Login failed due to an unexpected error');
        }
    }
);

// --- Auth Slice Definition ---
const authSlice = createSlice({
    name: 'auth',
    initialState,
    // Synchronous reducers
    reducers: {
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.isLoading = false;
            state.error = null;
            if (typeof window !== 'undefined') {
                 localStorage.removeItem('authToken');
            }
            console.log("User logged out, state reset.");
        },
        clearAuthError: (state) => {
             state.error = null;
        },
        // Optional: Action to manually set token if read from storage on load
        // setToken: (state, action: PayloadAction<string>) => {
        //      state.token = action.payload;
        //      state.isAuthenticated = true;
        //      // You might want to fetch user data here based on the token
        // }
    },
    // Handle the async thunk lifecycle
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user; // User data (id can be null)
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = null;
                state.token = null; // Clear token on login failure
                state.error = action.payload ?? 'Login failed. Unknown error.'; // Use error from rejectWithValue
                if (typeof window !== 'undefined') {
                     localStorage.removeItem('authToken'); // Also clear storage on failure
                }
            });
    },
});

export const { logout, clearAuthError /*, setToken */ } = authSlice.actions;
export default authSlice.reducer;