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

export const CurrentResourceContext = createContext(defaultResourceContext);

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
    const DBEventToIEvent = (db_event: any) => {
            return {...db_event,
                start: strToTimestamp(db_event.start),
                end: strToTimestamp(db_event.end)
            } as IEvent;
    }

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

    const syncEvent = async (e: IEvent) => {
        console.log("syncEvent:", e);
        if (e.id) {
            let { data: event, error } = await supabase
                .from("events")
                .update({
                    id: e.id,
                    title: e.title,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: getResouceColor(e.resource_id),
                    resource_id: e.resource_id 
                })
                .single();
            if (error) setError(error.message);
            else {
                setEventSynced(false);
                console.log('Synced event:', DBEventToIEvent(event))
                setError(null);
            }
        } else {
            let { data: event, error } = await supabase
                .from("events")
                .insert({
                    title: e.title,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: getResouceColor(e.resource_id),
                    user_id: user.id,
                    resource_id: e.resource_id 
                })
                .single();
            if (error) setError(error.message);
            else {
                setEventSynced(false);
                setEvents([...events, DBEventToIEvent(event)])
                setError(null);
            }
        }
    }

    const eventDiffers = (e: IEvent, ie: EventApi) => {
        return ie.start === null ||
               e.start !== dateToTimestamp(ie.start) ||
               ie.end === null ||
               e.end !== dateToTimestamp(ie.end) ||
               e.title !== ie.title
    }

    const handleUpdatedEvents = (updated_events: EventApi[]) => {
        let is_changed = false;
        events.map(e => {
            let ie = updated_events.find((ie, i, api) => { return Number(ie.id) == e.id })
            if (ie !== undefined && eventDiffers(e, ie)) {
                e = {
                    start: dateToTimestamp(ie.start!),
                    end: dateToTimestamp(ie.end!),
                    title: ie.title,
                    color: e.color,
                    id: e.id,
                    resource_id: e.resource_id
                }
                console.log('Update event:', e)
                is_changed = true;
                syncEvent(e);
            }
            return e;
        })
        if (!is_changed){
            console.log("Update notified. nothing changed")
        }
    }

    const modifyEvent = (event: IEvent|null) => {
        setReservationInfo(null);
        if (event !== null){
            syncEvent(event);
        }
    }

    const deleteEvent = async (id: string|undefined, title: string|undefined) => {
        console.log("deleteEvent:", title);
        setReservationInfo(null);
        if (title && id) {
            if (window.confirm(`Are you sure you want to delete the event '${title}'`)) {
                let res = await supabase
                    .from("events")
                    .delete()
                    .eq('id', id)
                setEventSynced(false);
                setError(null);
            }
        } 
    }

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

    const getResouceColor = (id: number) => colorMap.get(resources.filter(r => r.id === id)[0].display_color)
    
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


    // Calendar
    const handleDateSelect = (arg: DateSelectArg) => {
        let calendarApi = arg.view.calendar
    
        calendarApi.unselect() // clear date selection
        /* if (title) {
            calendarApi.addEvent({
                id: createEventId(),
                title,
                start: arg.startStr,
                end: arg.endStr,
                allDay: arg.allDay
            })
        } */
        console.log("date selected: ", arg)
        const info: ReserveDialogProps =
        {
            open: true,
            user: 'dummyUser',
            start: arg.start.getTime(),
            end: arg.end.getTime(),
            resources: resources,
            onClose: modifyEvent,
            onDelete: deleteEvent
        }
        setReservationInfo(info);
    }

    const handleDateClick = (arg: DateClickArg) => {
        console.log("date click: ", arg)
    }

    const handleEventClick = (event: EventClickArg) => {
        console.log("event click:", event)
        let info: ReserveDialogProps =
        {
            id: event.event.id,
            open: true,
            user: 'dummyUser',
            start: event.event.start?.getTime()?? dayjs('today').toDate().getTime(),
            end: event.event.end?.getTime()?? dayjs('today').toDate().getTime(),
            title: event.event.title,
            resources: resources,
            resource_id: events.filter((e) => { return e.id! === Number(event.event.id)})[0].resource_id,
            onClose: modifyEvent,
            onDelete: deleteEvent
        }
        setReservationInfo(info);
    }

    const handleDragStart = (event:EventDragStartArg) => {
        console.log("event drag start: ", event)
    }

    const handleDragStop = (event:EventDragStopArg) => {
        console.log("event drag end: ", event)
    }

    const handleDubleClickOnTable = () => {
        console.log('handleDubleClickOnTable')

    }

    // ResourceTable
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

    const businessHours =  {
        daysOfWeek: [ 1, 2, 3, 4, 5 ], // Monday - Friday 
        startTime: '08:30',
        endTime: '17:15',
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
            <div className={"flex m-4 justify-center"}>
                <h1>Calendar</h1>
                <Box sx={{display: 'flex', justifyContent: 'center', height: 10}}>
                    { (!eventSynced) ? ( <LinearProgress sx={{ width: '50%'}}/>):
                    <></>}
                </Box>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locales={[jaLocale]}
                    locale='ja'
                    businessHours={businessHours}
                    nowIndicator={true}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    timeZone='local'
                    editable={true}
                    navLinks={true}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    eventsSet={handleUpdatedEvents} 
                    //eventDragStart={handleDragStart}
                    //eventDragStop={handleDragStop}
                    eventDurationEditable={true}
                    eventResizableFromStart={false}
                    selectable={true}
                    select={handleDateSelect}
                    events={events as []}
                    /*  events={events.map((e) => {
                        return {
                            'start': e.start,
                            'end': e.end,
                            'color': e.color,
                            'id': e.id,
                            'title': e.title,
                            'startEditable':true,
                            'durationEditable': true}
                    }) as []} */
                />
            </div>
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
        <></>
    )
};

export default Home;
