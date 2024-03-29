import React from "react";
import { render, screen, renderHook, waitFor } from "@testing-library/react";
//import { act } from "@testing-library/react-hooks";

import ErrorDialog from "./ErrorDialog";
import {
    AnnotationContextProvider,
    useAnnotation,
} from "../contexts/AnnotationContext";

const InitTest = ({ children, message }) => {
    const { errorText, setError } = useAnnotation();
    console.log(errorText);
    if (message != null) {
        setError(message);
        //act(() => setError(message));
    }
    return <>{children}</>;
};

describe("ErrorDialog", () => {
    test("No error displayed", async () => {
        const { result } = renderHook(() => (
            /* To use context the provider is needed */
            <AnnotationContextProvider>
                <InitTest message={null}>
                    <ErrorDialog />
                </InitTest>
            </AnnotationContextProvider>
        ));
        await waitFor(() => {
            const errorElement = screen.queryAllByText("");
            errorElement.every((v, i, l) => expect(v).not.toHaveValue());
        });
    });

    test("Error message is displayed", () => {
        render(
            <AnnotationContextProvider>
                <InitTest message={"test error message"}>
                    <ErrorDialog />
                </InitTest>
            </AnnotationContextProvider>
        );
        const errorElement = screen.getByText("test error message");
        expect(errorElement).toBeInTheDocument();
    });
});
