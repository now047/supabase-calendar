import React, { useState, createContext, useContext } from "react";
import dayjs from "dayjs";
import { User } from "@supabase/supabase-js";

type TabLabel = "Resource" | "Calendar" | "Reservation";

type HeaderContextType = {
    user: User | undefined;
    tab: TabLabel;
    setTab: (t: TabLabel) => void;
    eventFromDate: dayjs.Dayjs;
    setEventFromDate: (d: dayjs.Dayjs) => void;
};

const defaultHeaderContext: HeaderContextType = {
    user: undefined,
    tab: "Calendar",
    setTab: (t: TabLabel) => {},
    eventFromDate: dayjs(),
    setEventFromDate: (d: dayjs.Dayjs) => {},
};

const HeaderContext = createContext(defaultHeaderContext);

const HeaderContextProvider = ({ user, children }: any) => {
    const [tab, setTab] = useState<TabLabel>("Calendar");
    const [eventFromDate, setEventFromDate] = useState(
        dayjs().subtract(1, "month")
    );
    const currentHeaderContext = {
        user,
        tab,
        setTab,
        eventFromDate,
        setEventFromDate,
    };

    return (
        <HeaderContext.Provider value={currentHeaderContext}>
            {children}
        </HeaderContext.Provider>
    );
};

const useHeader = () => useContext(HeaderContext);

export { type TabLabel, useHeader, HeaderContextProvider };
