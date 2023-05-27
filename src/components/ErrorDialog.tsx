import React, { useContext } from "react";
import { Alert, Box, IconButton, Slide } from "@mui/material";
import { HeaderContext } from "../App";
import CloseIcon from "@mui/icons-material/Close";

const ErrorDialog = () => {
    const { errorText, setError } = useContext(HeaderContext);

    return errorText ? (
        <Box sx={{ width: "100%" }}>
            <Slide
                direction="down"
                in={errorText !== ""}
                mountOnEnter
                unmountOnExit
            >
                <Alert
                    severity="error"
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => {
                                setError("");
                            }}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                    sx={{ mb: 2 }}
                >
                    {errorText}
                </Alert>
            </Slide>
        </Box>
    ) : (
        <></>
    );
};

export default ErrorDialog;
