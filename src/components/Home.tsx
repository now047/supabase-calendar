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
import jaLocale from '@fullcalendar/core/locales/ja';
import Box from '@mui/material/Box';
import {
    DataGrid,
    GridColDef,
    GridValueGetterParams,
    GridRowId,
    GridRowModel,
    GridToolbarContainer,
    useGridApiContext,
    GridValueFormatterParams,
    GridRenderCellParams,
    GridCellModesModel } from '@mui/x-data-grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import IEvent, {
    toDateString,
    strToTimestamp,
    dateToTimestamp,
    toLocalDateString } from "../lib/event-utils"
import ReserveDialog, {ReserveDialogProps} from "./ReserveDialog";
import ResourceDialog, {ResourceDialogProps} from "./ResourceDialog";

import Resource, { colorMap } from "../lib/resource-utils"

//export const ResourceContext = createContext([]);

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
            setEvents(events?.map((e) => {return {...e, start: strToTimestamp(e.start), end: strToTimestamp(e.end)}}) as IEvent[]);
            setEventSynced(true)
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
                    color: getResouceColor(e.resource_id),
                    resource_id: e.resource_id 
                })
                .single();
            if (error) setError(error.message);
            else {
                setEventSynced(false);
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
                    color: getResouceColor(e.resource_id),
                    user_id: user.id,
                    resource_id: e.resource_id 
                })
                .single();
            if (error) setError(error.message);
            else {
                setEventSynced(false);
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
        console.log("Update notified.")
        events.map(e => {
            let ie = updated_events.find((ie, i, l) => { return Number(ie.id) == e.id })
            if (ie !== undefined && eventDiffers(e, ie)) {
                const updated: IEvent = {
                    start: dateToTimestamp(ie.start!),
                    end: dateToTimestamp(ie.end!),
                    title: ie.title,
                    color: e.color,
                    id: e.id,
                    resource_id: e.resource_id
                }
                console.log('event changed:', updated)
                addEvent(updated)
            }
            return e;
        })
    }

    const modifyEvent = (event: IEvent|null) => {
        setReservationInfo(null);
        if (event !== null){
            addEvent(event);
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
            console.log("Resources: ", events);
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
            let { data: event, error } = await supabase
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
    function ResourceTableToolBar() {
        const apiRef = useGridApiContext();
      
        const deleteResourceSelected = () => {
            //apiRef.current.setPage(1);
            const selectedRows: Map<GridRowId, GridRowModel> = apiRef.current.getSelectedRows();
            const iter = selectedRows.entries()
            let ent = iter.next();
            while (!ent.done) {
                const resource = ent.value[1];
                if (window.confirm(`Are you sure to delete '${resource.name}'`)){
                    deleteResource(resource.id)
                }
                ent = iter.next();
            }
        }
      
        return (
          <GridToolbarContainer 
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                }}>
            <Button size='small' onClick={deleteResourceSelected}>Delete</Button>
            <Button size='small' onClick={handleResourceAdd}>Add</Button>
          </GridToolbarContainer>
        );
    }

    const handleResourceAdd = () => {
        setResourceAdding(true);
    }

    const deleteResource = async (id: string|undefined) => {
        if (id) {
            let res = await supabase
                .from("resources")
                .delete()
                .eq('id', id)
            setResourceSynced(false);
            setError(null);
        } 
    }

    const handleResourceDialogClose = (resource: Resource | null) => {
        console.log("add resource")
        setResourceAdding(false);
        if (resource !== null)
            addResource(resource)
    }

    const resourceAvatar = (params: GridRenderCellParams<Resource>) => {
        return <>
                <Avatar sx={{
                        bgcolor: colorMap.get(params.value!.display_color),
                        width: 24, height: 24
                    }}>
                    {params.value!.name[0]}
                </Avatar>
                <Typography sx={{padding: 1}}>
                    {params.value!.name}
                </Typography>
            </>
    }
    const resourceTableColumns: GridColDef[] = [
        {
            field: 'this',
            headerName: 'Name',
            width: 200,
            editable: false,
            renderCell: resourceAvatar
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 100,
            editable: false,
        },
        {
            field: 'generation',
            headerName: 'Generation',
            width: 100,
            editable: false,
        },
        {
            field: 'note',
            headerName: 'Note',
            width: 300,
            editable: false,
        },
    ]

    const renderDateString = (params: GridRenderCellParams<number>) => {
        if (params.value === undefined) 
            return '-'
        else
            return toLocalDateString(params.value)
    }

    // EventTable
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
    ) : (
        <div className={"supabase-calendar-main"}>
            <header>
                <Stack paddingBottom={8} spacing={2} direction="row">
                    <Button onClick={handleLogout} variant="text">Logout</Button>
                    <Button variant="contained">Contained</Button>
                    <Button variant="outlined">Outlined</Button>
                </Stack>
            </header>
            <Stack spacing={10}>
                <div className={"flex m-4 justify-center"}>
                    <Box sx={{height: 300, width: '100%'}}>
                        <h2> Ressorces </h2>
                        <DataGrid
                            rows={resources.map((r) => {return {...r, "this": r}})}
                            columns={resourceTableColumns}
                            rowsPerPageOptions={[5]}
                            checkboxSelection
                            components={{Toolbar: ResourceTableToolBar}}
                            disableSelectionOnClick
                            // experimentalFeatures={{ newEditingApi: true }}
                            onCellDoubleClick={handleDubleClickOnTable}
                        />
                    </Box>
                </div>
                <div className={"flex m-4 justify-center"}>
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
                        //eventDragStart={handleDragStart}
                        //eventDragStop={handleDragStop}
                        eventDurationEditable={true}
                        eventResizableFromStart={false}
                        selectable={true}
                        select={handleDateSelect}
                        //events={events as []}
                        events={events.map((e) => {
                            return {
                                'start': e.start,
                                'end': e.end,
                                'color': e.color,
                                'id': e.id,
                                'title': e.title,
                                'startEditable':true,
                                'durationEditable': true}
                        }) as []}
                    />
                </div>
                <div className={"flex m-4 justify-center"}>
                    <Box sx={{height: 400, width: '100%'}}>
                        <h2> Reservations </h2>
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
                </div>
            </Stack>
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
