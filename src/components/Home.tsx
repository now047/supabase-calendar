import type { User } from "@supabase/supabase-js";
import React from "react";
import { useEffect, useState, useRef, createContext } from "react";
import { supabase } from "../lib/api";
import RecoverPassword from "./RecoverPassword";
import FullCalendar from '@fullcalendar/react';
import interactionPlugin, { 
    DateClickArg,
    EventDragStopArg,
    EventDragStartArg
} from "@fullcalendar/interaction" // needed for dayClick
import dayjs from 'dayjs';
import {
    EventContentArg,
    EventSourceInput,
    EventClickArg,
    DateSelectArg,
    EventApi,
} from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import jaLocale from '@fullcalendar/core/locales/ja';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import LinearProgress from '@mui/material/LinearProgress';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams } from '@mui/x-data-grid';

import IEvent, {
    toDateString,
    strToTimestamp,
    dateToTimestamp,
    toLocalDateString } from "../lib/event-utils"
import ReserveDialog, {ReserveDialogProps} from "./ReserveDialog";
import ResourceDialog from "./ResourceDialog";

import Resource, { colorMap } from "../lib/resource-utils"

import Header, {TabLabel} from "./Header"
import ResourceTable from "./ResourceTable";
import Calendar, { DBEventToIEvent } from "./Calendar";


// Context
type TabContextType = {
    tab: TabLabel;
    setTab: (t: TabLabel) => void;
};

const defaultTabContext: TabContextType = {
    tab: "Calendar",
    setTab: (t: TabLabel) => {}
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
    const newTaskTextRef = useRef<HTMLInputElement>(null);
    const [errorText, setError] = useState<string | null>("");
    const [reservationInfo, setReservationInfo] = useState<ReserveDialogProps|null> (null);
    const [resourceAdding, setResourceAdding] = useState(false);
    const [tab, setTab] = useState<TabLabel>("Calendar");
    const currentTabContext = {tab, setTab};
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

    // ResourceTable
    const handleDubleClickOnTable = () => {
        console.log('handleDubleClickOnTable')

    }

    const handleResourceDialogClose = (resource: Resource | null) => {
        console.log("add resource")
        setResourceAdding(false);
        if (resource !== null)
            addResource(resource)
    }

    // EventTable
    const renderDateString = (params: GridRenderCellParams<number>) => {
        if (params.value === undefined) 
            return '-'
        else
            return toLocalDateString(params.value)
    }

    const eventTableColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 90 },
        {
            field: 'title',
            headerName: 'Title',
            width: 300,
            editable: false,
        },
        {
            field: 'start',
            headerName: 'Start date',
            type: 'string',
            width: 200,
            editable: false,
            renderCell: renderDateString
        },
        {
            field: 'end',
            headerName: 'End date',
            type: 'string',
            width: 180,
            editable: false,
            renderCell: renderDateString
        }
    ];

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
            <div className={"flex m-4 justify-center"}>
                <h1> Reservation </h1>
                <Container sx={{display: 'flex', justifyContent: 'center', width: '90%'}}>
                <Box sx={{height: 400, width: '100%'}}>
                    <DataGrid
                        rows={events}
                        columns={eventTableColumns}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                        checkboxSelection
                        disableSelectionOnClick
                        experimentalFeatures={{ newEditingApi: true }}
                        onCellDoubleClick={handleDubleClickOnTable}
                    />
                </Box>
                </Container>
            </div>
            <div className={"flex flex-col flex-grow p-4"} style={{ height: "calc(100vh - 11.5rem)" }} >
                {!!errorText && (
                    <div className={ "border max-w-sm self-center px-4 py-2 mt-4 text-center text-sm bg-red-100 border-red-300 text-red-400" } >
                        {errorText}
                    </div>
                )}
            </div>
        </div>
    ): (
        <>{handleLogout()}</>
    )
};

export default Home;
