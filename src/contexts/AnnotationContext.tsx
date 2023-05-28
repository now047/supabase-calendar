import React, { useState, createContext, useContext } from "react";

type AnnotationContextType = {
    errorText: string | null;
    setError: (e: string | null) => void;
};

const defaultAnnotationContext: AnnotationContextType = {
    errorText: "",
    setError: (s: string | null) => {},
};

const AnnotationContext = createContext(defaultAnnotationContext);

const AnnotationContextProvider = ({ children }: any) => {
    const [errorText, setError] = useState<string | null>("");
    const currentAnnotationContext = {
        errorText,
        setError,
    };

    return (
        <AnnotationContext.Provider value={currentAnnotationContext}>
            {children}
        </AnnotationContext.Provider>
    );
};

const useAnnotation = () => useContext(AnnotationContext);

export { useAnnotation, AnnotationContextProvider };
