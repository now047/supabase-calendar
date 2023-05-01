import React, {
    createContext,
    useState,
    useEffect,
    useRef,
    useMemo,
} from "react";
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
import Resource from "./lib/resource-utils";
import { EventSourceInput } from "@fullcalendar/core";
import { colorMap } from "./lib/resource-utils";

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
    resources: React.MutableRefObject<Resource[]> | null;
    resourceTypes:
        | {
              types: Map<string, boolean>;
              generations: Map<string, boolean>;
          }
        | undefined;
    eventUpdateCount: number;
    selectedResources: Resource[] | null;
    colors: Map<any, string> | null;
};
const defaultEventContext: EventContextType = {
    events: null,
    resources: null,
    resourceTypes: {
        types: new Map<string, boolean>(),
        generations: new Map<string, boolean>(),
    },
    eventUpdateCount: 0,
    selectedResources: null,
    colors: null,
};
export const EventContext = createContext(defaultEventContext);

function App() {
    const today = new Date();
    const [user, setUser] = useState<User | null>(new DummyUser());
    const [errorText, setError] = useState<string | null>("");
    const [tab, setTab] = useState<TabLabel>("Calendar");
    const [hue, setHue] = useState<number>(5);
    const events = useRef<IEvent[]>([]);
    const resources = useRef<Resource[]>([]);
    const [eventFromDate, setEventFromDate] = useState(
        dayjs().subtract(1, "month")
    );

    const colors = useMemo(() => colorMap(hue), [hue]);

    const currentHeaderContext = {
        user,
        tab,
        setTab,
        eventFromDate,
        setEventFromDate,
        errorText,
        setError,
    };

    const [resourceTypes, setResourceTypes] = useState<{
        types: Map<string, boolean>;
        generations: Map<string, boolean>;
    }>({
        types: new Map<string, boolean>(),
        generations: new Map<string, boolean>(),
    });

    const handleSelectChange = (
        kind: string,
        name: string,
        checked: boolean
    ) => {
        setResourceTypes((prev) => {
            if (kind === "types") {
                prev?.types.set(name, checked);
            } else if (kind === "generations") {
                prev?.generations.set(name, checked);
            }
            return prev;
        });
        onUpdateResources();
    };

    const [selectedResources, setSelectedResources] = useState(
        resources!.current
    );
    const [eventUpdateCount, setEventUpdateCount] = useState(0);

    const onUpdateResources = () => {
        console.log("onUpdateResources");
        const types = resources!.current
            .map((r) => r.type)
            .filter((v, i, a) => a.indexOf(v) === i);
        const generations = resources!.current
            .map((r) => r.generation)
            .filter((v, i, a) => a.indexOf(v) === i);

        setResourceTypes((prev) => {
            if (prev !== undefined) {
                // add types
                types.map((name) => {
                    if (prev.types.get(name) === undefined) {
                        prev.types.set(name, true);
                    }
                });
                // remove types
                for (const type of prev.types.keys()) {
                    if (types.indexOf(type) === -1) {
                        prev.types.delete(type);
                    }
                }

                // add generations
                generations.map((gen) => {
                    if (prev.generations.get(gen) === undefined) {
                        prev.generations.set(gen, true);
                    }
                });
                // remove generations
                for (const gen of prev.generations.keys()) {
                    if (generations.indexOf(gen) === -1) {
                        prev.generations.delete(gen);
                    }
                }
                return prev;
            } else {
                return {
                    types: new Map(types.map((name) => [name, true])),
                    generations: new Map(generations.map((gen) => [gen, true])),
                };
            }
        });

        const newSelectedResources = resources!.current.filter(
            (r) =>
                resourceTypes.types.get(r.type) &&
                resourceTypes.generations.get(r.generation)
        );
        setSelectedResources(newSelectedResources);

        setEventUpdateCount((prev) => prev + 1);
    };

    const onUpdateEvents = () => {
        console.log("onUpdateEvents");
        setEventUpdateCount((prev) => prev + 1);
    };

    const currentEventContext = {
        events: events,
        resources: resources,
        resourceTypes: resourceTypes,
        eventUpdateCount: eventUpdateCount,
        selectedResources: selectedResources,
        colors: colors,
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
                        <div className="demo-app">
                            <Sidebar
                                handleSelectChange={handleSelectChange}
                                handleColorChange={setHue}
                            />
                            <Home
                                user={new DummyUser()}
                                onUpdateResources={onUpdateResources}
                                onUpdateEvents={onUpdateEvents}
                            />
                        </div>
                    </EventContext.Provider>
                </HeaderContext.Provider>
            }
        </div>
    );
}

export default App;
