// src/components/RegisterForm.tsx
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../app/store';
import { registerUser, clearAuthError } from '../features/auth/authSlice'; 

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    // confirmPassword?: string; // Optional: Add if you implement confirm password
}

const RegisterForm: React.FC = () => {
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        email: '',
        password: '',
        // confirmPassword: '',
    });

    const dispatch = useDispatch<AppDispatch>();
    const { isLoading, error /*, registrationSuccess */ } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    // Clear error when component mounts and on unmount
    useEffect(() => {
        dispatch(clearAuthError()); // Clear any existing errors from other auth actions
        return () => {
            dispatch(clearAuthError()); // Clear errors when leaving the page
        };
    }, [dispatch]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (error) { // Clear error message when user starts typing
            dispatch(clearAuthError());
        }
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Optional: Password confirmation check
        // if (formData.password !== formData.confirmPassword) {
        //     dispatch(someActionToSetError("Passwords do not match!")); // Or handle locally
        //     return;
        // }

        dispatch(registerUser({
            username: formData.username,
            email: formData.email,
            password: formData.password,
        }))
        .unwrap() // Redux Toolkit utility to get the promise result or throw error
        .then((fulfilledValue) => {
            console.log('Registration successful from component:', fulfilledValue);
            // On successful registration, navigate to the login page (or show a success message)
            // You can pass a query parameter to show a success message on the login page
            navigate('/login?registered=true');
        })
        .catch((rejectedValue) => {
            // Error is already set in Redux state by the thunk's rejected case,
            // but you can log or do additional things here if needed.
            console.error('Registration failed from component:', rejectedValue);
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create Account</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
                <label htmlFor="username">Username:</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                />
            </div>
            <div>
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                />
            </div>
            {/*
            <div>
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
            </div>
            */}
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register'}
            </button>
        </form>
    );
};

export default RegisterForm;