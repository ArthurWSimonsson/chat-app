// pages/LoginPage.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice';
import { selectAuthLoading, selectAuthError } from '../features/auth/authSelectors';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginStart());
    // Simulating an async login call - replace with your actual API call
    setTimeout(() => {
      if (username === 'test' && password === 'test') {
        dispatch(loginSuccess({ user: { id: '1', username: 'test', email: 'test@example.com' }, token: 'fakeToken' }));
      } else {
        dispatch(loginFailure('Invalid credentials'));
      }
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... Input fields for username and password ... */}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default LoginPage;