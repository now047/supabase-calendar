import React, {useContext} from "react";

import { Box, LinearProgress  } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { 
    DateClickArg,
    EventDragStopArg,
    EventDragStartArg
} from "@fullcalendar/interaction" // needed for dayClick
import jaLocale from '@fullcalendar/core/locales/ja';
import dayjs from "dayjs";
import { EventClickArg, EventApi, DateSelectArg } from "@fullcalendar/core";

import { supabase } from "../lib/api";
import IEvent, { dateToTimestamp, toDateString, strToTimestamp } from "../lib/event-utils";
import { colorMap, getResourceName } from "../lib/resource-utils";
import { ReserveDialogProps } from "./ReserveDialog";
import { CurrentEventContext } from "./Home";
import { EventContentArg } from "@fullcalendar/core";
import { EventSourceInput } from "@fullcalendar/core";

const Calendar = () => {
    const {
        user,
        events,
        resources,
        eventSynced,
        setEvents,
        setReservationInfo,
        setEventSynced,
        setError} = useContext(CurrentEventContext);

    const businessHours =  {
        daysOfWeek: [ 1, 2, 3, 4, 5 ], // Monday - Friday 
        startTime: '08:30',
        endTime: '17:15',
    };

    const handleDateClick = (arg: DateClickArg) => {
        console.log("date click: ", arg)
    };

    const getResouceColor = (id: number) => colorMap.get(resources.filter(r => r.id === id)[0].display_color);

    const DBEventToIEvent = (db_event: any) => {
        return {...db_event,
            purpose_of_use: db_event.title,
            start: strToTimestamp(db_event.start),
            end: strToTimestamp(db_event.end),
            resource_name: getResourceName(db_event.resource_id, resources)
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
                setEventSynced(false);
                console.log('Synced event:', DBEventToIEvent(event))
                setError(null);
            }
        } else {
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
                setEventSynced(false);
                setEvents([...events, DBEventToIEvent(event)])
                setError(null);
            }
        }
    };

    const modifyEvent = (event: IEvent|null) => {
        setReservationInfo(null);
        if (event !== null){
            syncEvent(event);
        }
    };

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
    };

    const handleEventClick = (event: EventClickArg) => {
        console.log("event click:", event)
        let info: ReserveDialogProps =
        {
            id: event.event.id,
            open: true,
            user: 'dummyUser',
            start: event.event.start?.getTime()?? dayjs('today').toDate().getTime(),
            end: event.event.end?.getTime()?? dayjs('today').toDate().getTime(),
            purpose_of_use: event.event.extendedProps.purpose_of_use,
            resource_name: event.event.title,
            resources: resources,
            resource_id: events.filter((e) => { return e.id! === Number(event.event.id)})[0].resource_id,
            onClose: modifyEvent,
            onDelete: deleteEvent
        }
        setReservationInfo(info);
    };

    const handleDragStart = (event:EventDragStartArg) => {
        console.log("event drag start: ", event)
    };

    const handleDragStop = (event:EventDragStopArg) => {
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
        events.map(e => {
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
        if (!is_changed){
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
            resources: resources,
            onClose: modifyEvent,
            onDelete: deleteEvent
        }
        setReservationInfo(info);
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
            <Box sx={{ display: 'flex', justifyContent: 'center', height: 10 }}>
                {(!eventSynced) ? (<LinearProgress sx={{ width: '50%' }} />) :
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
                eventDurationEditable={true}
                eventResizableFromStart={false}
                selectable={true}
                select={handleDateSelect}
                //eventContent={renderEventContent}
                /*events={events as []}*/
                events={events.map((e) => {
                        return {
                                start: e.start,
                                end: e.end,
                                color: e.color,
                                id: e.id,
                                title: e.resource_name!,
                                extendedProps: {purpose_of_use: e.purpose_of_use},
                                //startEditable: true,
                                //durationEditable: true
                        }}) as EventSourceInput}
            />
        </div>
    );
};
export default Calendar;

