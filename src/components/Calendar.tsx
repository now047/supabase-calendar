import React, { useContext, useMemo, useState } from "react";

import { Button, Fade, Snackbar } from "@mui/material";
import { Backdrop } from "@mui/material";
import { CircularProgress } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, {
    DateClickArg,
    EventDragStopArg,
    EventDragStartArg,
} from "@fullcalendar/interaction"; // needed for dayClick
import {
    EventClickArg,
    EventApi,
    DateSelectArg,
    EventContentArg,
    EventHoveringArg,
} from "@fullcalendar/core";
import jaLocale from "@fullcalendar/core/locales/ja";
import dayjs from "dayjs";

import { supabase } from "../lib/api";
import IEvent, {
    dateToTimestamp,
    toDateString,
    strToTimestamp,
    toLocalDateString,
} from "../lib/event-utils";
import { getResourceName } from "../lib/resource-utils";
import { ReserveDialogProps } from "./ReserveDialog";
import { EventContext, HeaderContext } from "../App";
import { useColor } from "../contexts/ColorContext";
import { useResource } from "../contexts/ResourceContext";

const Calendar = (props: {
    eventSynced: boolean;
    setReservationInfo: (info: ReserveDialogProps | null) => void;
    setEventSynced: (b: boolean) => void;
}) => {
    const { user, tab, setTab, errorText, setError } =
        useContext(HeaderContext);
    const { events, eventUpdateCount } = useContext(EventContext);
    const { resources, selectedResources } = useResource();
    const { colors } = useColor();
    const [hoverEvent, setHoverEvent] = useState<
        [IEvent | null, NodeJS.Timeout]
    >([null, setTimeout(() => {}, 0)]);

    const businessHours = {
        daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
        startTime: "08:30",
        endTime: "17:15",
    };

    const handleDateClick = (arg: DateClickArg) => {
        console.log("date click: ", arg);
    };

    const getResouceColor = (id: number) =>
        colors.get(
            resources!.current.filter((r) => r.id === id)[0].display_color
        );

    const getResourceId = (color: string) => {
        colors.forEach((col) => {
            if (col[1] === color) {
                return col[0];
            }
        });
        return 1;
    };

    const DBEventToIEvent = (db_event: any) => {
        return {
            ...db_event,
            purpose_of_use: db_event.title,
            start: strToTimestamp(db_event.start),
            end: strToTimestamp(db_event.end),
            resource_name: getResourceName(
                db_event.resource_id,
                resources!.current
            ),
        } as IEvent;
    };

    const syncEvent = async (e: IEvent) => {
        console.log("syncing DB:", e);
        if (e.id) {
            let { data: event, error } = await supabase
                .from("events")
                .update({
                    id: e.id,
                    title: e.purpose_of_use,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: getResouceColor(e.resource_id),
                    resource_id: e.resource_id,
                })
                .single();
            if (error) setError(error.message);
            else {
                props.setEventSynced(false);
                console.log("synced event:", DBEventToIEvent(event));
                setError(null);
            }
        } else {
            console.log("syncing DB new entry");
            let { data: event, error } = await supabase
                .from("events")
                .insert({
                    title: e.purpose_of_use,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: getResouceColor(e.resource_id),
                    user_id: user!.id,
                    resource_id: e.resource_id,
                })
                .single();
            if (error) setError(error.message);
            else {
                props.setEventSynced(false);
                events!.current = [...events!.current, DBEventToIEvent(event)];
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

    const deleteEvent = async (
        id: string | undefined,
        title: string | undefined
    ) => {
        console.log("deleteEvent:", title);
        props.setReservationInfo(null);
        if (title && id) {
            if (
                window.confirm(
                    `Are you sure you want to delete the event '${title}'`
                )
            ) {
                let res = await supabase.from("events").delete().eq("id", id);
                props.setEventSynced(false);
                setError(null);
            }
        }
    };

    const handleEventClick = (event: EventClickArg) => {
        console.log("event click:", event);
        let info: ReserveDialogProps = {
            id: event.event.id,
            open: true,
            user: "dummyUser",
            start:
                event.event.start?.getTime() ??
                dayjs("today").toDate().getTime(),
            end:
                event.event.end?.getTime() ?? dayjs("today").toDate().getTime(),
            purpose_of_use: event.event.extendedProps.purpose_of_use,
            resource_name: event.event.title,
            resources: selectedResources,
            resource_id: events!.current.filter((e) => {
                return e.id! === Number(event.event.id);
            })[0].resource_id,
            onClose: modifyEvent,
            onDelete: deleteEvent,
        };
        props.setReservationInfo(info);
    };

    const handleDragStart = (event: EventDragStartArg) => {
        console.log("event drag start: ", event);
    };

    const handleDragStop = (event: EventDragStopArg) => {
        console.log("event drag end: ", event);
    };

    const handleDubleClickOnTable = () => {
        console.log("handleDubleClickOnTable");
    };

    const eventDiffers = (e: IEvent, ie: EventApi) => {
        return (
            ie.start === null ||
            e.start !== dateToTimestamp(ie.start) ||
            ie.end === null ||
            e.end !== dateToTimestamp(ie.end) ||
            e.purpose_of_use !== ie.extendedProps.purpose_of_use
        );
    };

    const handleUpdatedEvents = (updated_events: EventApi[]) => {
        let is_changed = false;
        events!.current.map((e) => {
            let ie = updated_events.find((ie, i, api) => {
                return Number(ie.id) == e.id;
            });
            if (ie !== undefined && eventDiffers(e, ie)) {
                e = {
                    start: dateToTimestamp(ie.start!),
                    end: dateToTimestamp(ie.end!),
                    purpose_of_use: ie.extendedProps.purpose_of_use,
                    color: e.color,
                    id: e.id,
                    //allDay: e.allDay,
                    resource_id: e.resource_id,
                };
                console.log("Update event:", e);
                is_changed = true;
                syncEvent(e);
            }
            return e;
        });
        if (!is_changed) {
            console.log("Update notified. nothing changed");
        }
    };

    const handleDateSelect = (arg: DateSelectArg) => {
        let calendarApi = arg.view.calendar;

        calendarApi.unselect(); // clear date selection
        /* if (title) {
        calendarApi.addEvent({
            id: createEventId(),
            title,
            start: arg.startStr,
            end: arg.endStr,
            allDay: arg.allDay
        })
    } */
        console.log("date selected: ", arg);
        const info: ReserveDialogProps = {
            open: true,
            user: "dummyUser",
            start: arg.start.getTime(),
            end: arg.end.getTime(),
            purpose_of_use: "",
            resource_name: "",
            resources: selectedResources,
            onClose: modifyEvent,
            onDelete: deleteEvent,
        };
        props.setReservationInfo(info);
    };

    // Mouse over can't cowork with date selection ?
    const handleMouseEnter = (eventInfo: EventHoveringArg) => {
        setHoverEvent([
            {
                id: Number(eventInfo.event.id),
                purpose_of_use: eventInfo.event.extendedProps.purpose_of_use,
                color: eventInfo.event.backgroundColor,
                start: eventInfo.event.start!.getTime(),
                end: eventInfo.event.end!.getTime(),
                resource_id: getResourceId(eventInfo.event.backgroundColor),
            },
            setTimeout(handleMouseLeave.bind(null, null), 3000),
        ]);
    };

    const handleMouseLeave = (eventInfo: EventHoveringArg | null) => {
        console.log("mouse leave");
        if (hoverEvent[0] !== null) {
            setHoverEvent([null, setTimeout(() => {}, 0)]);
        }
    };

    const hoverEventStr = () => {
        if (hoverEvent[0] === null) return "none";
        let ret = hoverEvent[0].purpose_of_use + ": ";
        if (hoverEvent[0].start !== undefined) {
            ret += `start at ${toLocalDateString(hoverEvent[0].start)} `;
        }
        if (hoverEvent[0].end !== undefined) {
            ret += `end at ${toLocalDateString(hoverEvent[0].end)}!`;
        }
        return ret;
    };

    const action = (
        <React.Fragment>
            <Button
                color="secondary"
                size="small"
                onClick={handleMouseLeave.bind(null, null)}
            >
                got it
            </Button>
        </React.Fragment>
    );

    const renderEventContent = (eventInfo: EventContentArg) => {
        return (
            <a
                className="fc-event fc-event-draggable
                            fc-event-resizable fc-event-start fc-event-end
                            fc-event-future fc-daygrid-event fc-daygrid-dot-event"
            >
                <div className="fc-daygrid-event-dot"></div>
                <div className="fc-event-time">{eventInfo.timeText}</div>
                <div className="fc-event-title">{eventInfo.event.title}</div>
            </a>
        );
    };

    const selectedEventsMemo = useMemo(
        () =>
            events!.current
                .filter(
                    (e) =>
                        selectedResources
                            .map((r) => r.name)
                            .indexOf(e.resource_name!) !== -1
                )
                .map((e) => {
                    return {
                        start: e.start,
                        end: e.end,
                        color: e.color,
                        id: e.id!.toString(),
                        title: e.resource_name!, // displays resource name
                        extendedProps: { purpose_of_use: e.purpose_of_use },
                        //allDay: true,
                    };
                }),
        [events, selectedResources, eventUpdateCount, colors]
    );

    return (
        <div className={"flex m-4 justify-center"}>
            <h1>Calendar</h1>
            <Backdrop
                sx={{
                    color: "#fff",
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
                open={!props.eventSynced}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locales={[jaLocale]}
                locale="ja"
                businessHours={businessHours}
                nowIndicator={true}
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                timeZone="local"
                editable={true}
                navLinks={true}
                //dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventsSet={handleUpdatedEvents}
                //eventMouseEnter={handleMouseEnter}
                //eventMouseLeave={handleMouseLeave}
                eventDurationEditable={true}
                eventResizableFromStart={false}
                selectable={true}
                select={handleDateSelect}
                //eventContent={renderEventContent}
                events={selectedEventsMemo}
            />
            <Snackbar
                anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
                open={hoverEvent[0] !== null}
                TransitionComponent={Fade}
                onClose={handleMouseLeave.bind(null, null)}
                message={hoverEventStr()}
                key={"mouse-over-event-snackbar"}
                action={action}
            />
        </div>
    );
};
export default Calendar;
