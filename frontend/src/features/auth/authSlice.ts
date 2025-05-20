// features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// Optional: import axios from 'axios';

// --- Interfaces ---

// Credentials passed from the LoginForm component
interface LoginCredentials {
    username: string; // This field holds username OR email from the form
    password: string;
}

interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
}

// Matches the actual JSON structure returned by your backend API
interface JwtResponseData {
    token: string;
    id: number; 
    username: string;
    email: string;
    roles: string[];
    type?: string;
}

// Structure for the user object stored in Redux state
export interface User { 
    id: number | null; 
    username: string;
    email: string;
    roles?: string[]; // Optionally store roles if needed
}

// Structure of the Auth state slice
export interface AuthState {
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

interface RegistrationSuccessResponse {
    message: string;
    // userId?: number | null; // If backend returns user ID
    // username?: string; // If backend returns username
}

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

            const userPayload: User = {
                id: data.id, 
                username: data.username,
                email: data.email,
                roles: data.roles
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

export const registerUser = createAsyncThunk<
    RegistrationSuccessResponse, // Type of the return value on success
    RegisterCredentials,        // Type of the argument passed to the thunk
    { rejectValue: string }     // Type of the value returned on failure
>(
    'auth/registerUser',
    async (credentials: RegisterCredentials, { rejectWithValue }) => {
        console.log('Dispatching registerUser thunk with:', credentials);
        try {
            // Adjust URL if your registration endpoint is different (e.g., /api/auth/signup)
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials), // Send username, email, password
            });

            const data: RegistrationSuccessResponse | any = await response.json();

            if (!response.ok) {
                console.error('Registration API Error Response:', data);
                // Use backend error message if available (e.g., from ApiResponse DTO)
                const errorMessage = data?.message || data?.error || `Registration failed (${response.status})`;
                return rejectWithValue(errorMessage);
            }

            console.log('Registration API Success Response:', data);
            // Return the success response (e.g., { message: "User registered successfully!" })
            return data as RegistrationSuccessResponse;

        } catch (error: any) {
            console.error('Registration Thunk Network/Processing Error:', error);
            return rejectWithValue(error.message || 'Registration failed due to an unexpected error');
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
                state.user = action.payload.user; 
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
            })
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                // state.registrationSuccess = false; // Reset on new attempt
            })
            .addCase(registerUser.fulfilled, (state, action) => { // No PayloadAction type needed if thunk doesn't return specific payload structure for state
                state.isLoading = false;
                state.error = null; // Clear any previous errors
                // state.registrationSuccess = true; // Set success flag
                // Note: We are NOT setting isAuthenticated or user/token here.
                // Registration usually leads to the login page.
                console.log("Registration fulfilled:", action.payload);
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string || 'Registration failed';
                // state.registrationSuccess = false;
            });
    },
});

export const { logout, clearAuthError /*, setToken */ } = authSlice.actions;
export default authSlice.reducer;