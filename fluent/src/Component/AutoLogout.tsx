import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const AutoLogout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Tab close detection using sessionStorage
        // If the user is logged in (via localStorage) but has no active session in this tab, log them out.
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const hasTabSession = sessionStorage.getItem('tabSessionActive') === 'true';

        const performLogout = async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
            localStorage.removeItem('hasSeenWelcome');
            localStorage.removeItem('selectedLanguage');
            localStorage.removeItem('selectedTopic');
            localStorage.removeItem('selectedTopicTitle');
            localStorage.removeItem('currentConversationId');
            sessionStorage.removeItem('tabSessionActive');
            navigate('/Login');
        };

        if (isLoggedIn && !hasTabSession) {
            // This tab was opened fresh (or revived) without a session
            // Meaning the tab was closed previously
            performLogout();
        } else if (isLoggedIn) {
            // Keep the tab session active for this window
            sessionStorage.setItem('tabSessionActive', 'true');
        }

        // Inactivity timeout (30 minutes)
        let timeoutId: ReturnType<typeof setTimeout>;
        const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

        const resetTimeout = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (localStorage.getItem('isLoggedIn') === 'true') {
                timeoutId = setTimeout(() => {
                    performLogout();
                }, TIMEOUT_DURATION);
            }
        };

        // Initialize timeout
        resetTimeout();

        // Listen for activity events
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            resetTimeout();
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [navigate]);

    return null; // This component doesn't render anything
};

export default AutoLogout;
