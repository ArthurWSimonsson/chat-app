// src/pages/RegisterPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm'; // Adjust path as needed

// Optional: Import layout components
// import Container from '../components/layout/Container';
// import './RegisterPage.css'; // Optional: page-specific styles

const RegisterPage: React.FC = () => {
    return (
        // <Container>
        <div className="register-page">
            <header>
                <h1>Sign Up</h1>
                <p>Create your account to join the chat.</p>
            </header>

            <main>
                <RegisterForm />
            </main>

            <footer style={{ marginTop: '20px', textAlign: 'center' }}>
                <p>
                    Already have an account?{' '}
                    <Link to="/login">Log in here</Link>
                </p>
            </footer>
        </div>
        // </Container>
    );
};

export default RegisterPage;