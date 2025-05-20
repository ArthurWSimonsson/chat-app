// src/pages/LoginPage.tsx (or your preferred location)

import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import LoginForm from '../components/LoginForm'; // Import the LoginForm component

// Optional: Import any specific styling or layout components
// import './LoginPage.css';
// import Container from '../components/layout/Container'; // Example layout component

const LoginPage: React.FC = () => {
    // This component mainly structures the page and renders the form.
    // The actual login state logic (fetching, loading, error) is handled
    // within LoginForm via Redux hooks (useSelector, useDispatch).

    return (
        // Example: A simple div wrapper for basic structure or styling
        <div className="login-page">
            {/*
             Optional: You might have a more complex layout structure here
             <Container>
                 ... content ...
             </Container>
            */}

            <header>
                <h1>Login</h1>
                <p>Welcome back! Please log in using your username/email and password.</p>
            </header>

            <main>
                <LoginForm />
            </main>

            <footer>
                 <p style={{ marginTop: '20px', textAlign: 'center' }}>
                    Don't have an account?{' '}
                    <Link to="/register">Sign up here</Link> {/* Link to your registration route */}
                 </p>
                 {/* You could add a "Forgot Password?" link here too */}
                 {/*
                 <p style={{ textAlign: 'center' }}>
                    <Link to="/forgot-password">Forgot Password?</Link>
                 </p>
                 */}
            </footer>

        </div>
    );
};

export default LoginPage;