import type { User } from "@supabase/supabase-js";
import React from "react";
import { useEffect, useState, createContext } from "react";
import { supabase } from "../lib/api";
import RecoverPassword from "./RecoverPassword";

import IEvent from "../lib/event-utils"
import ReserveDialog, {ReserveDialogProps} from "./ReserveDialog";
import ResourceDialog from "./ResourceDialog";
import Resource from "../lib/resource-utils"
import Header, {TabLabel} from "./Header"
import ResourceTable from "./ResourceTable";
import Calendar, { DBEventToIEvent } from "./Calendar";
import ReservationTable from "./ReservationTable";


// Context
type TabContextType = {
    tab: TabLabel;
    setTab: (t: TabLabel) => void;
    errorText: string|null;
    setError: (e: string|null) => void;
};

const defaultTabContext: TabContextType = {
    tab: "Calendar",
    setTab: (t: TabLabel) => {},
    errorText: "",
    setError: (s: string|null) => {}
};

export const CurrentTabContext = createContext(defaultTabContext);

type ResourceContextType = {
    events: IEvent[];
    resources: Resource[];
    setResourceAdding: (s: boolean) => void;
    setResourceSynced: (s: boolean) => void;
    setError: (s: string|null) => void;
}

const defaultResourceContext: ResourceContextType = {
    events: [],
    resources: [],
    setResourceAdding: (s: boolean) => {},
    setResourceSynced: (s: boolean) => {},
    setError: (s: string|null) => {}
}

type EventContextType = {
        user: User | null;
        events: IEvent[];
        resources: Resource[];
        eventSynced: boolean;
        setEvents: (s: IEvent[]) => void;
        setReservationInfo: (s: ReserveDialogProps|null) => void;
        setEventSynced: (s: boolean) => void;
        setError: (s: string|null) => void;
};
export const CurrentResourceContext = createContext(defaultResourceContext);

const defaultEventContext: EventContextType = {
    user: null,
    events: [],
    resources: [],
    eventSynced: false,
    setEvents: (s: IEvent[]) => {},
    setReservationInfo: (s: ReserveDialogProps|null) => {},
    setEventSynced: (s: boolean) => {},
    setError: (s: string|null) => {}
}
export const CurrentEventContext = createContext(defaultEventContext);

const Home = ({ user }: { user: User }) => {
    const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
    const [events, setEvents] = useState<IEvent[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [eventSynced, setEventSynced] = useState<boolean>(false);
    const [resourceSynced, setResourceSynced] = useState<boolean>(false);
    const [errorText, setError] = useState<string | null>("");
    const [reservationInfo, setReservationInfo] = useState<ReserveDialogProps|null> (null);
    const [resourceAdding, setResourceAdding] = useState(false);
    const [tab, setTab] = useState<TabLabel>("Calendar");
    const currentTabContext = {
        tab,
        setTab,
        errorText,
        setError
    };
    const currentResourceContext = {
        events,
        resources,
        setResourceAdding,
        setResourceSynced,
        setError
    };
    const currentEventContext = {
        user,
        events,
        resources,
        eventSynced,
        setEvents,
        setReservationInfo,
        setEventSynced,
        setError
    };

    interface IResults {
        access_token: string;
        refresh_token: string;
        expires_in: string;
        token_type: string;
        type: string;
    }

    useEffect(() => {
        console.log("useEffect")
        /* Recovery url is of the form
         * <SITE_URL>#access_token=x&refresh_token=y&expires_in=z&token_type=bearer&type=recovery
         * Read more on https://supabase.com/docs/reference/javascript/reset-password-email#notes
         */
        let url = window.location.hash;
        let query = url.slice(1);
        let result: IResults = {
            access_token: "",
            refresh_token: "",
            expires_in: "",
            token_type: "",
            type: "",
        };

        query.split("&").forEach((part) => {
            const item = part.split("=");
            result[item[0] as keyof IResults] = decodeURIComponent(item[1]);
        });

        if (result.type === "recovery") {
            setRecoveryToken(result.access_token);
        }

        if (!eventSynced) {
            console.log('calling fetch events')
            fetchEvents().catch(console.error);
        }
        if (!resourceSynced) {
            console.log('calling fetch resources')
            fetchResources().catch(console.error);
        }
    }, [resourceSynced, eventSynced, errorText, reservationInfo]);

    // Menue
    const handleLogout = async () => {
        supabase.auth.signOut().catch(console.error);
    };

    // Events
    const fetchEvents = async () => {
        let { data: events, error } = await supabase
            .from("events")
            .select("*")
            .order("id", { ascending: false });
        if (error) console.log("error", error);
        else {
            console.log("Events: ", events);
            setEvents(events?.map((e) => DBEventToIEvent(e)) as IEvent[]);
            setEventSynced(true)
        }
    };

    // Resources
    const fetchResources = async () => {
        let { data: resources, error } = await supabase
            .from("resources")
            .select("*")
            .order("id", { ascending: false });
        if (error) console.log("error", error);
        else {
            console.log("Resources: ", resources);
            setResources(resources as Resource[]);
            setResourceSynced(true);
        }
    };

    const addResource = async (r: Resource) => {
        console.log("addResource:", r);
        if (r.id) {
            let { data: resource, error } = await supabase
                .from("resources")
                .update({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    generation: r.generation,
                    display_color: r.display_color,
                    note: r.note
                })
                .single();
            if (error) setError(error.message);
            else {
                setResourceSynced(false);
                console.log('Updated resources', resources)
                setError(null);
            }
        } else {
            let { data: resource, error } = await supabase
                .from("resources")
                .insert({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    generation: r.generation,
                    display_color: r.display_color,
                    note: r.note
                })
                .single();
            if (error) setError(error.message);
            else {
                setResourceSynced(false);
                setError(null);
            }
        }
    }

    const handleResourceDialogClose = (resource: Resource | null) => {
        console.log("add resource")
        setResourceAdding(false);
        if (resource !== null)
            addResource(resource)
    }

    // render
    return recoveryToken ? (
        <RecoverPassword
            token={recoveryToken}
            setRecoveryToken={setRecoveryToken}
        />
    ) : reservationInfo ? (
        <div className={"supabase-calendar-main"}>
            <ReserveDialog {...reservationInfo} />
        </div>
    ) : resourceAdding ? (
        <div className={"supabase-calendar-main"}>
            <ResourceDialog {
                ...{ 
                    name: "",
                    generation: "",
                    type: "",
                    open: true,
                    resources: resources,
                    onClose: handleResourceDialogClose
                }} />
        </div>
    ) : tab === 'Resource' ?(
        <div className={"supabase-calendar-main"}>
            <CurrentTabContext.Provider value={currentTabContext}>
                <Header/>
            </CurrentTabContext.Provider>
            <CurrentResourceContext.Provider value={currentResourceContext}>
                <ResourceTable/>
            </CurrentResourceContext.Provider>
        </div>
        ): tab === 'Calendar' ?(
        <div className={"supabase-calendar-main"}>
            <CurrentTabContext.Provider value={currentTabContext}>
                <Header/>
            </CurrentTabContext.Provider>
            <CurrentEventContext.Provider value={currentEventContext}>
                <Calendar/>
            </CurrentEventContext.Provider>
        </div>
        ): tab === 'Reservation' ?(
        <div className={"supabase-calendar-main"}>
            <CurrentTabContext.Provider value={currentTabContext}>
                <Header/>
            </CurrentTabContext.Provider>
            <ReservationTable events={events} />
        </div>
    ): (
        <>{handleLogout()}</>
    )
};

export default Home;
