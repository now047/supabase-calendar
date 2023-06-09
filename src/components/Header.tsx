import React, { useCallback, useContext, useState } from "react";
import dayjs from "dayjs";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DraftsIcon from "@mui/icons-material/Drafts";
import BookIcon from "@mui/icons-material/Book";
import LogoutIcon from "@mui/icons-material/Logout";
import { Stack, Tab, Tabs } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { HeaderContext } from "../App";

export type TabLabel = "Resource" | "Calendar" | "Reservation";

const Header = () => {
    const { tab, setTab, eventFromDate, setEventFromDate } =
        useContext(HeaderContext);

    const onChange = useCallback((event: any, value: TabLabel) => {
        setTab(value);
    }, []);

    const onStartDateChange = useCallback(
        (value: dayjs.Dayjs | null, event: any) => {
            setEventFromDate(value!);
        },
        []
    );

    const HeaderMemo = React.memo(
        ({ tab: tab, eventFromDate: eventFromDate }: any) => {
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
                            <Tab
                                label="Logout"
                                value="Logout"
                                icon={<LogoutIcon />}
                            />
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
                </header>
            );
        }
    );

    return <HeaderMemo tab={tab} eventFromDate={eventFromDate} />;
};

export default Header;
