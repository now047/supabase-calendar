import React, { useContext } from "react";

import { Box, LinearProgress } from "@mui/material";
import { Backdrop } from "@mui/material";
import { CircularProgress } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, {
    DateClickArg,
    EventDragStopArg,
    EventDragStartArg
} from "@fullcalendar/interaction" // needed for dayClick
import {
    EventClickArg, EventApi, DateSelectArg,
    EventContentArg, EventSourceInput
} from "@fullcalendar/core";
import jaLocale from '@fullcalendar/core/locales/ja';
import dayjs from "dayjs";

import { supabase } from "../lib/api";
import IEvent, { dateToTimestamp, toDateString, strToTimestamp } from "../lib/event-utils";
import { colorMap, getResourceName } from "../lib/resource-utils";
import { ReserveDialogProps } from "./ReserveDialog";
import { EventContext, HeaderContext } from "../App";
const Calendar = (props: {
    eventSynced: boolean,
    setReservationInfo: (info: ReserveDialogProps | null) => void,
    setEventSynced: (b: boolean) => void
}) => {
    const { user, tab, setTab, errorText, setError } = useContext(HeaderContext)
    const { events, resources } = useContext(EventContext);

    const businessHours = {
        daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday 
        startTime: '08:30',
        endTime: '17:15',
    };

    const handleDateClick = (arg: DateClickArg) => {
        console.log("date click: ", arg)
    };

    const getResouceColor = (id: number) => colorMap.get(resources!.current.filter(r => r.id === id)[0].display_color);

    const DBEventToIEvent = (db_event: any) => {
        return {
            ...db_event,
            purpose_of_use: db_event.title,
            start: strToTimestamp(db_event.start),
            end: strToTimestamp(db_event.end),
            resource_name: getResourceName(db_event.resource_id, resources!.current)
        } as IEvent;
    };

    const syncEvent = async (e: IEvent) => {
        console.log("syncEvent:", e);
        if (e.id) {
            let { data: event, error } = await supabase
                .from("events")
                .update({
                    id: e.id,
                    title: e.purpose_of_use,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: getResouceColor(e.resource_id),
                    resource_id: e.resource_id
                })
                .single();
            if (error) setError(error.message);
            else {
                props.setEventSynced(false);
                console.log('Synced event:', DBEventToIEvent(event))
                setError(null);
            }
        } else {
            console.log("syncEvent user", user)
            let { data: event, error } = await supabase
                .from("events")
                .insert({
                    title: e.purpose_of_use,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: getResouceColor(e.resource_id),
                    user_id: user!.id,
                    resource_id: e.resource_id
                })
                .single();
            if (error) setError(error.message);
            else {
                props.setEventSynced(false);
                events!.current = ([...events!.current, DBEventToIEvent(event)])
                setError(null);
            }
        }
    };

    const modifyEvent = (event: IEvent | null) => {
        props.setReservationInfo(null);
        if (event !== null) {
            syncEvent(event);
        }
    };

    const deleteEvent = async (id: string | undefined, title: string | undefined) => {
        console.log("deleteEvent:", title);
        props.setReservationInfo(null);
        if (title && id) {
            if (window.confirm(`Are you sure you want to delete the event '${title}'`)) {
                let res = await supabase
                    .from("events")
                    .delete()
                    .eq('id', id)
                props.setEventSynced(false);
                setError(null);
            }
        }
    };

    const handleEventClick = (event: EventClickArg) => {
        console.log("event click:", event)
        let info: ReserveDialogProps =
        {
            id: event.event.id,
            open: true,
            user: 'dummyUser',
            start: event.event.start?.getTime() ?? dayjs('today').toDate().getTime(),
            end: event.event.end?.getTime() ?? dayjs('today').toDate().getTime(),
            purpose_of_use: event.event.extendedProps.purpose_of_use,
            resource_name: event.event.title,
            resources: resources!.current,
            resource_id: events!.current.filter((e) => { return e.id! === Number(event.event.id) })[0].resource_id,
            onClose: modifyEvent,
            onDelete: deleteEvent
        }
        props.setReservationInfo(info);
    };

    const handleDragStart = (event: EventDragStartArg) => {
        console.log("event drag start: ", event)
    };

    const handleDragStop = (event: EventDragStopArg) => {
        console.log("event drag end: ", event)
    };

    const handleDubleClickOnTable = () => {
        console.log('handleDubleClickOnTable')

    };

    const eventDiffers = (e: IEvent, ie: EventApi) => {
        return ie.start === null ||
            e.start !== dateToTimestamp(ie.start) ||
            ie.end === null ||
            e.end !== dateToTimestamp(ie.end) ||
            e.purpose_of_use !== ie.extendedProps.purpose_of_use
    };

    const handleUpdatedEvents = (updated_events: EventApi[]) => {
        let is_changed = false;
        events!.current.map(e => {
            let ie = updated_events.find((ie, i, api) => { return Number(ie.id) == e.id })
            if (ie !== undefined && eventDiffers(e, ie)) {
                e = {
                    start: dateToTimestamp(ie.start!),
                    end: dateToTimestamp(ie.end!),
                    purpose_of_use: ie.extendedProps.purpose_of_use,
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
        if (!is_changed) {
            console.log("Update notified. nothing changed")
        }
    };

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
            purpose_of_use: "",
            resource_name: "",
            resources: resources!.current,
            onClose: modifyEvent,
            onDelete: deleteEvent
        }
        props.setReservationInfo(info);
    };

    const renderEventContent = (eventInfo: EventContentArg) => {
        return (
            <a className="fc-event fc-event-draggable
                            fc-event-resizable fc-event-start fc-event-end
                            fc-event-future fc-daygrid-event fc-daygrid-dot-event">
                <div className="fc-daygrid-event-dot"></div>
                <div className="fc-event-time">{eventInfo.timeText}</div>
                <div className="fc-event-title">{eventInfo.event.title}</div>
            </a>
        )
    };

    return (
        <div className={"flex m-4 justify-center"}>
            <h1>Calendar</h1>
            {/* <Box sx={{ display: 'flex', justifyContent: 'center', height: 10 }}>
                {(!props.eventSynced) ? (<LinearProgress sx={{ width: '50%' }} />) :
                    <></>}
            </Box> */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={!props.eventSynced}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
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
                eventDurationEditable={true}
                eventResizableFromStart={false}
                selectable={true}
                select={handleDateSelect}
                //eventContent={renderEventContent}
                /*events={events as []}*/
                events={events!.current.map((e) => {
                    return {
                        start: e.start,
                        end: e.end,
                        color: e.color,
                        id: e.id,
                        title: e.resource_name!,
                        extendedProps: { purpose_of_use: e.purpose_of_use },
                        //startEditable: true,
                        //durationEditable: true
                    }
                }) as EventSourceInput}
            />
        </div>
    );
};
export default Calendar;

