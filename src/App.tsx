import React, { createContext, useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { supabase } from "./lib/api";
import Auth from "./components/Auth";
import Home from "./components/Home";
import Sidebar from "./components/Sidebar";
import type {
    User,
    UserAppMetadata,
    UserMetadata,
} from "@supabase/supabase-js";

import Header, { TabLabel } from "./components/Header";
import { ColorContextProvider } from "./contexts/ColorContext";
import { ResourceContextProvider } from "./contexts/ResourceContext";
import { EventContextProvider } from "./contexts/EventContext";
import ErrorDialog from "./components/ErrorDialog";

class DummyUAM implements UserAppMetadata {
    provider?: string;
    [key: string]: any;
}

class DummyUM implements UserMetadata {
    [key: string]: any;
}

class DummyUser implements User {
    constructor() {
        this.id = "6adac62d-f70a-4da8-b741-1afb09c8500e";
        this.app_metadata = new DummyUAM();
        this.user_metadata = new DummyUM();
        this.aud = "aud";
        this.created_at = "now";
    }
    id: string;
    app_metadata: UserAppMetadata;
    user_metadata: UserMetadata;
    aud: string;
    created_at: string;
}

type HeaderContextType = {
    user: User | null;
    tab: TabLabel;
    setTab: (t: TabLabel) => void;
    eventFromDate: dayjs.Dayjs;
    setEventFromDate: (d: dayjs.Dayjs) => void;
    errorText: string | null;
    setError: (e: string | null) => void;
};

const defaultHeaderContext: HeaderContextType = {
    user: new DummyUser(),
    tab: "Calendar",
    setTab: (t: TabLabel) => {},
    eventFromDate: dayjs(),
    setEventFromDate: (d: dayjs.Dayjs) => {},
    errorText: "",
    setError: (s: string | null) => {},
};
export const HeaderContext = createContext(defaultHeaderContext);

function App() {
    const [user, setUser] = useState<User | null>(new DummyUser());
    const [errorText, setError] = useState<string | null>("");
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
        errorText,
        setError,
    };

    useEffect(() => {
        console.log("useEffect of App.");
        const session = supabase.auth.session();
        //setUser(session?.user ?? null);

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const currentUser = session?.user;
                setUser(currentUser ?? null);
            }
        );

        return () => {
            authListener?.unsubscribe();
        };
    }, [user]);

    return (
        <div className="min-w-full min-h-screen flex items-center justify-center bg-gray-200">
            {/*
        {!user ? <Auth /> : <Home user={user} />}
      */}
            {
                <HeaderContext.Provider value={currentHeaderContext}>
                    <ColorContextProvider>
                        <ResourceContextProvider>
                            {/* needs to be in HeaderContext */}
                            <EventContextProvider>
                                {/* needs to be in Color,Header,ResourceContext */}
                                <div className="demo-app">
                                    <div className="supabase-calendar-sidebar">
                                        <Sidebar />
                                    </div>
                                    <div className={"supabase-calendar-main"}>
                                        <Header />
                                        <ErrorDialog />
                                        <Home user={user!} />
                                    </div>
                                </div>
                            </EventContextProvider>
                        </ResourceContextProvider>
                    </ColorContextProvider>
                </HeaderContext.Provider>
            }
        </div>
    );
}

export default App;
