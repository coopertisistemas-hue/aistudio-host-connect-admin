import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as analytics from '@/lib/analytics';

export const usePageTracking = () => {
    const location = useLocation();

    useEffect(() => {
        analytics.pageview(location.pathname + location.search);
    }, [location]);
};
