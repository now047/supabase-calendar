import React from "react";
import { Dayjs } from "dayjs";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DraftsIcon from "@mui/icons-material/Drafts";
import BookIcon from "@mui/icons-material/Book";
import LogoutIcon from "@mui/icons-material/Logout";
import { Stack, Tab, Tabs } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { useHeader, TabLabel } from "../contexts/HeaderContext";

const Header = () => {
    const { tab, setTab, eventFromDate, setEventFromDate } = useHeader();

    const onChange = (event: any, value: TabLabel) => {
        setTab(value);
    };

    const onStartDateChange = (value: Dayjs | null, event: any) => {
        setEventFromDate(value!);
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
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label="Display reservations from"
                        openTo="month"
                        views={["year", "month"]}
                        value={eventFromDate}
                        onChange={onStartDateChange}
                    />
                </LocalizationProvider>
            </Stack>
        </header>
    );
};

export default Header;
