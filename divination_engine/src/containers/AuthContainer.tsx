import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { readingAPI } from "../services/api";

const PENDING_SPREAD_KEY = 'pendingSpread';

const AuthContainer: React.FC = () => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn, signUp, isAuthenticated } = useAuth();

    const hasPendingSpread = useCallback(() => {
        try {
            return sessionStorage.getItem(PENDING_SPREAD_KEY) !== null;
        } catch {
            return false;
        }
    }, []);

    // Abandon guard: warn when navigating away with pending spread
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasPendingSpread()) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasPendingSpread]);

    // If already authenticated, redirect
    useEffect(() => {
        if (isAuthenticated && !hasPendingSpread()) {
            navigate('/');
        }
    }, [isAuthenticated, navigate, hasPendingSpread]);

    const handleAuth = async () => {
        setError('');
        setLoading(true);
        try {
            if (mode === 'signin') {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }

            // After successful auth, check for pending spread
            const pendingRaw = sessionStorage.getItem(PENDING_SPREAD_KEY);
            if (pendingRaw) {
                try {
                    const pendingSpread = JSON.parse(pendingRaw);
                    await readingAPI.createReading(pendingSpread);
                    sessionStorage.removeItem(PENDING_SPREAD_KEY);
                    navigate('/archive');
                } catch {
                    setError('Your spread could not be saved. Please try again.');
                    setLoading(false);
                    return;
                }
            } else {
                navigate('/');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Authentication failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = () => {
        sessionStorage.removeItem(PENDING_SPREAD_KEY);
        navigate('/');
    };

    return (
        <div className="auth-container">
            <h2>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>

            {hasPendingSpread() && (
                <div className="auth-pending-notice">
                    You have an unsaved spread. Sign in to save it, or{' '}
                    <span className="auth-discard-link" onClick={handleDiscard}>
                        discard it
                    </span>.
                </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
                <label htmlFor="auth-email">Email</label>
                <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                />
            </div>

            <div className="auth-field">
                <label htmlFor="auth-password">Password</label>
                <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min 8 characters' : 'Password'}
                    disabled={loading}
                />
            </div>

            <input
                type="button"
                className="save-button"
                value={loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                onClick={handleAuth}
                disabled={loading || !email || !password}
            />

            <div className="auth-toggle">
                {mode === 'signin' ? (
                    <span>
                        Don't have an account?{' '}
                        <span className="auth-toggle-link" onClick={() => { setMode('signup'); setError(''); }}>
                            Create one
                        </span>
                    </span>
                ) : (
                    <span>
                        Already have an account?{' '}
                        <span className="auth-toggle-link" onClick={() => { setMode('signin'); setError(''); }}>
                            Sign in
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
};

export default AuthContainer;
