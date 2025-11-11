import React, { createContext, useState, useContext } from 'react';

// 1. Context-г үүсгэх
const PrefillContext = createContext(null);

// 2. Provider (Хайрцгийг "зөөгч")
export const PrefillProvider = ({ children }) => {
    const [prefillData, setPrefillData] = useState(null);

    return (
        <PrefillContext.Provider value={{ prefillData, setPrefillData }}>
            {children}
        </PrefillContext.Provider>
    );
};

// 3. Custom Hook (Хайрцгаас "бэлэг" авах/хийх хялбар арга)
export const usePrefill = () => {
    const context = useContext(PrefillContext);
    if (!context) {
        throw new Error('usePrefill must be used within a PrefillProvider');
    }
    return context;
};