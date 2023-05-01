import React, { Dispatch, SetStateAction, useContext, useState } from "react";
import dayjs from "dayjs";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DraftsIcon from "@mui/icons-material/Drafts";
import BookIcon from "@mui/icons-material/Book";
import LogoutIcon from "@mui/icons-material/Logout";
import { Box, IconButton, Slide, Stack, Tab, Tabs } from "@mui/material";
import Alert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";

import { HeaderContext } from "../App";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export type TabLabel = "Resource" | "Calendar" | "Reservation";

const Header = (props: {
    setEventSynced: Dispatch<SetStateAction<boolean>>;
}) => {
    const {
        tab,
        setTab,
        eventFromDate,
        setEventFromDate,
        errorText,
        setError,
    } = useContext(HeaderContext);
    const onChange = (event: any, value: TabLabel) => {
        setTab(value);
    };

    const onStartDateChange = (value: dayjs.Dayjs | null, event: any) => {
        setEventFromDate(value!);
        props.setEventSynced(false);
    };

    return (
        <header>
            <Stack direction="row" justifyContent="space-between">
                <Tabs value={tab} onChange={onChange}>
                    <Tab
                        label="Calendar"
                        value="Calendar"
                        icon={<CalendarMonthIcon />}
                    />
                    <Tab
                        label="Reservation"
                        value="Reservation"
                        icon={<BookIcon />}
                    />
                    <Tab
                        label="Resource"
                        value="Resource"
                        icon={<DraftsIcon />}
                    />
                    <Tab label="Logout" value="Logout" icon={<LogoutIcon />} />
                </Tabs>
                <div className="supabase-calendar-sidebar-section">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Display reservations from"
                            openTo="month"
                            views={["year", "month"]}
                            value={eventFromDate}
                            onChange={onStartDateChange}
                        />
                    </LocalizationProvider>
                </div>
            </Stack>
            {!!errorText && (
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
            )}
        </header>
    );
};

export default Header;
