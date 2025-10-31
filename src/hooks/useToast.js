// frontend/src/hooks/useToast.js
import { useState, useCallback } from 'react';

/**
 * Toast мэдэгдэл харуулах hook
 *
 * @returns {Object} - { toast, showToast, hideToast }
 */
const useToast = () => {
    const [toast, setToast] = useState({
        show: false,
        message: '',
        variant: 'info' // 'success', 'danger', 'warning', 'info', 'light'
    });

    /**
     * Toast харуулах
     * @param {string} message - Харуулах мессеж
     * @param {string} variant - Bootstrap variant ('success', 'danger', 'warning', 'info', etc.)
     */
    const showToast = useCallback((message, variant = 'info') => {
        setToast({
            show: true,
            message,
            variant
        });
    }, []);

    /**
     * Toast нуух
     */
    const hideToast = useCallback(() => {
        setToast(prev => ({
            ...prev,
            show: false
        }));
    }, []);

    return {
        toast,
        showToast,
        hideToast
    };
};

export default useToast;