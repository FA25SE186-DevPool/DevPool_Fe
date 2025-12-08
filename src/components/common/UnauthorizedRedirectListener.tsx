import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../router/routes';
import { UNAUTHORIZED_EVENT } from '../../constants/events';

export default function UnauthorizedRedirectListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const isHandlingRef = useRef(false);

  useEffect(() => {
    const handleUnauthorized = async () => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      try {
        await logout();
      } finally {
        if (location.pathname !== ROUTES.GUEST.LOGIN) {
          navigate(ROUTES.GUEST.LOGIN, { replace: true, state: { from: location.pathname } });
        }
        // Cho phép xử lý lại sau một vòng lặp event loop để tránh spam
        setTimeout(() => {
          isHandlingRef.current = false;
        }, 0);
      }
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [location.pathname, navigate, logout]);

  return null;
}

