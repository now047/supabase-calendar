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

import IEvent from "./lib/event-utils";
import { TabLabel } from "./components/Header";
import { ColorContextProvider } from "./contexts/ColorContext";
import { ResourceContextProvider } from "./contexts/ResourceContext";

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

type EventContextType = {
    events: React.MutableRefObject<IEvent[]> | null;
    eventUpdateCount: number;
};
const defaultEventContext: EventContextType = {
    events: null,
    eventUpdateCount: 0,
};
export const EventContext = createContext(defaultEventContext);

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

    const events = useRef<IEvent[]>([]);
    const [eventUpdateCount, setEventUpdateCount] = useState(0);

    const onUpdateEvents = () => {
        console.log("onUpdateEvents");
        setEventUpdateCount((prev) => prev + 1);
    };

    const currentEventContext = {
        events: events,
        eventUpdateCount: eventUpdateCount,
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
                    <EventContext.Provider value={currentEventContext}>
                        <ColorContextProvider>
                            <ResourceContextProvider>
                                {/* needs to be in HeaderContext */}
                                <div className="demo-app">
                                    <Sidebar />
                                    <Home
                                        user={new DummyUser()}
                                        onUpdateEvents={onUpdateEvents}
                                    />
                                </div>
                            </ResourceContextProvider>
                        </ColorContextProvider>
                    </EventContext.Provider>
                </HeaderContext.Provider>
            }
        </div>
    );
}

export default App;
