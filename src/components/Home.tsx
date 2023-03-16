import type { User } from "@supabase/supabase-js";
import React from "react";
import { useEffect, useState, useRef } from "react";
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
    formatDate,
    EventContentArg,
    EventClickArg,
    DateSelectArg,
    EventApi,
} from '@fullcalendar/core'

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import jaLocale from '@fullcalendar/core/locales/ja';
import Box from '@mui/material/Box';
import {
    DataGrid,
    GridColDef,
    GridValueGetterParams,
    GridRowId,
    GridCellModesModel } from '@mui/x-data-grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import {createEventId, IEvent, toDateString} from "../lib/event-utils"
import ReserveDialog, {ReserveDialogProps} from "./ReserveDialog";

interface SelectedCellParams {
    id: GridRowId;
    title: string;
    start: number;
    end: number;
}

const Home = ({ user }: { user: User }) => {
    const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
    const [initialized, setInitialized] = useState<boolean>(false);
    const [events, setEvents] = useState<IEvent[]>([]);
    const newTaskTextRef = useRef<HTMLInputElement>(null);
    const [errorText, setError] = useState<string | null>("");
    const [reservationInfo, setReservationInfo] = useState<ReserveDialogProps|null> (null);
    const [selectedCellParams, setSelectedCellParams] = React.useState<SelectedCellParams | null>(null);
    interface IResults {
        access_token: string;
        refresh_token: string;
        expires_in: string;
        token_type: string;
        type: string;
    }

    useEffect(() => {
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

        console.log('calling fetch events')
        fetchEvents().catch(console.error);
    }, []);

    const fetchEvents = async () => {
        let { data: events, error } = await supabase
            .from("events")
            .select("*")
            .order("id", { ascending: false });
        if (error) console.log("error", error);
        else {
            console.log("Events: ", events);
            setEvents(events as IEvent[]);
        }
    };

   const addEvent = async (e: IEvent) => {
        console.log("addEvent:", e);
        if (e.id) {
            let { data: event, error } = await supabase
                .from("events")
                .update({
                    id: e.id,
                    title: e.title,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: 'red'
                })
                .single();
            if (error) setError(error.message);
            else {
                setEvents([event, ...events.filter((evt => evt.id != e.id))]);
                console.log('Updated event:', events)
                setError(null);
            }
        } else {
            let { data: event, error } = await supabase
                .from("events")
                .insert({
                    title: e.title,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: 'blue',
                    user_id: user.id
                })
                .single();
            if (error) setError(error.message);
            else {
                setEvents([event, ...events]);
                setError(null);
            }
        }
    }

    const convertToIEvent = (e: EventApi) => {
        return {
            id: e.id ? Number(e.id): undefined,
            start: e.start!.getTime()/1000,
            end: e.end === null ? e.start!.getTime()/1000 + 1: e.end.getTime()/1000,
            color: 'blue',
            title: e.title
        } as IEvent
    }

    const handleUpdatedEvents = (updated_events: EventApi[]) => {
        // Ugly...
        const modified = updated_events.filter((ie) => {
            let e = events.find((v, i, l) => {return v.id == Number(ie?.id) })
            return (dayjs(e?.start).toDate().getTime() != ie.start?.getTime() || 
                    dayjs(e?.end).toDate().getTime() != ie.end?.getTime() ||
                    e?.title != ie.title)
        })
        console.log ("Events modified: ", modified)
        modified.map((e) => {
            addEvent(convertToIEvent(e))
        })
    }

    const handleDateSelect = (arg: DateSelectArg) => {
        //let title = prompt('Please enter a new title for your event')
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
        let info: ReserveDialogProps =
        {
            open: true,
            user: 'dummyUser',
            start: arg.start.getTime(),
            end: arg.end.getTime(),
            onClose: modifyEvent,
            onDelete: deleteEvent
        }
        setReservationInfo(info);
    }

    const handleDateClick = (arg: DateClickArg) => {
        console.log("date click: ", arg)
/*         let info: ReserveDialogProps =
        {
            open: true,
            user: 'dummyUser',
            start: arg.date.getTime(),
            onClose: modifyEvent,
            onDelete: deleteEvent
        }
        setReservationInfo(info); */
    }

    const modifyEvent = (event: IEvent|null) => {
        setReservationInfo(null);
        if (event !== null){
            addEvent(event);
        }
    }

    const deleteEvent = async (id: string|undefined) => {
        console.log("deleteEvent:", id);
        setReservationInfo(null);
        if (id) {
            let res = await supabase
                .from("events")
                .delete()
                .eq('id', id)
            setEvents(events.filter((event => event.id?.toString() != id)));
            setError(null);
        } 
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

    const handleLogout = async () => {
        supabase.auth.signOut().catch(console.error);
    };

    const handleDubleClickOnTable = () => {
        console.log('handleDubleClickOnTable')

    }

    const columns: GridColDef[] = [
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
        },
        {
            field: 'end',
            headerName: 'End date',
            type: 'string',
            width: 180,
            editable: false,
        }
    ];

    const businessHours =  {
        daysOfWeek: [ 1, 2, 3, 4, 5 ], // Monday - Friday 
        startTime: '08:30',
        endTime: '17:15',
    }

    return recoveryToken ? (
        <RecoverPassword
            token={recoveryToken}
            setRecoveryToken={setRecoveryToken}
        />
    ) : reservationInfo ? (
        <div className={"supabase-calendar-main"}>
            <ReserveDialog {...reservationInfo} />
        </div>
    ) : (
        <div className={"supabase-calendar-main"}>
            <header>
                <Stack paddingBottom={8} spacing={2} direction="row">
                    <Button onClick={handleLogout} variant="text">Logout</Button>
                    <Button variant="contained">Contained</Button>
                    <Button variant="outlined">Outlined</Button>
                </Stack>
            </header>
            <div>
                <h2>Calendar</h2>
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
                    eventDragStart={handleDragStart}
                    eventDragStop={handleDragStop}
                    selectable={true}
                    select={handleDateSelect}
                    events={events as []}
                />
                <div className={"flex m-4 justify-center"}>
                    <Box mt={4} sx={{height: 400, width: '100%'}}>
                        <h2> Reservation List </h2>
                        <DataGrid
                            rows={events}
                            columns={columns}
                            pageSize={5}
                            rowsPerPageOptions={[5]}
                            checkboxSelection
                            disableSelectionOnClick
                            experimentalFeatures={{ newEditingApi: true }}
                            onCellDoubleClick={handleDubleClickOnTable}
                        />
                    </Box>
                </div>
            </div>
            <div className={"flex flex-col flex-grow p-4"} style={{ height: "calc(100vh - 11.5rem)" }} >
                {!!errorText && (
                    <div className={ "border max-w-sm self-center px-4 py-2 mt-4 text-center text-sm bg-red-100 border-red-300 text-red-400" } >
                        {errorText}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
