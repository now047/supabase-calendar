import React, { createContext, useContext, useEffect, useState } from "react";
import IEvent, { strToTimestamp, toDateString } from "../lib/event-utils";
import { supabase } from "../lib/api";
import { getResourceName } from "../lib/resource-utils";
import { useResource } from "./ResourceContext";
import { useHeader } from "./HeaderContext";
import { useAnnotation } from "./AnnotationContext";
import { useColor } from "./ColorContext";

type EventContextType = {
    events: IEvent[];
    eventSynced: boolean;
    checkConflictEvents: (e: IEvent) => IEvent | null;
    syncEvent: (e: IEvent) => Promise<void>;
    deleteEvent: (id: string) => void;
};
const defaultEventContext: EventContextType = {
    events: [],
    eventSynced: false,
    checkConflictEvents: (_e: IEvent) => null,
    syncEvent: (_e: IEvent) => new Promise<void>(() => {}),
    deleteEvent: async (_id: string) => {},
};
export const EventContext = createContext(defaultEventContext);

const EventContextProvider = ({ children }: any) => {
    const [events, setEvents] = useState<IEvent[]>([]);
    const [eventSynced, setEventSynced] = useState<boolean>(false);
    const { resources, resourceTypes } = useResource();
    const { user, eventFromDate } = useHeader();
    const { setError } = useAnnotation();
    const { colors } = useColor();

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

    const getResouceColor = (id: number) =>
        colors.get(
            resources!.current.filter((r) => r.id === id)[0].display_color
        );

    const checkConflictEvents = (target: IEvent) => {
        let conflictEvent: IEvent | null = null;
        events.every((e: IEvent, _i: number, _evs) => {
            if (target.id == e.id) return true;
            if (target.resource_id !== e.resource_id) return true;
            if (target.start <= e.start && e.start < target.end) {
                conflictEvent = e;
                return false;
            }
            if (e.start <= target.start && target.start < e.end) {
                conflictEvent = e;
                return false;
            }
            return true;
        });
        return conflictEvent;
    };

    const syncEvent = async (e: IEvent) => {
        if (e.id) {
            console.log("syncing DB:", e);
            let { data, error } = await supabase
                .from("events")
                .update({
                    title: e.purpose_of_use,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: getResouceColor(e.resource_id),
                    resource_id: e.resource_id,
                })
                .eq("id", e.id)
                .select();
            if (error) setError(error.message);
            else {
                if (data) {
                    console.log("synced event:", DBEventToIEvent(data[0]));
                }
                setError(null);
                fetchEvents();
            }
        } else {
            console.log("syncing DB new entry", e, user);
            let { data, error } = await supabase
                .from("events")
                .insert({
                    title: e.purpose_of_use,
                    start: toDateString(e.start),
                    end: toDateString(e.end),
                    color: getResouceColor(e.resource_id),
                    user_id: user!.id,
                    resource_id: e.resource_id,
                })
                .select();
            if (error) setError(error.message);
            else {
                if (data) {
                    setEvents([...events, DBEventToIEvent(data[0])]);
                }
                setError(null);
                fetchEvents();
            }
        }
    };

    const deleteEvent = async (id: string) => {
        let { error } = await supabase.from("events").delete().eq("id", id);
        if (error) setError(error.message);
        else {
            setError(null);
            fetchEvents();
        }
    };

    const currentEventContext = {
        events: events,
        eventSynced: eventSynced,
        checkConflictEvents: checkConflictEvents,
        syncEvent: syncEvent,
        deleteEvent: deleteEvent,
    };

    const fetchEvents = async () => {
        setEventSynced(false);
        new Promise(async (resolve: (e: IEvent[]) => void, reject) => {
            let { data: events, error } = await supabase
                .from("events")
                .select("*")
                .gte("end", eventFromDate.toISOString())
                .order("id", { ascending: false });
            if (error) {
                reject(error.message);
            } else {
                resolve(events?.map((e) => DBEventToIEvent(e)) as IEvent[]);
            }
        })
            .then((new_events: IEvent[]) => {
                setEvents(new_events);
                setEventSynced(true);
            })
            .catch(setError);
    };

    useEffect(() => {
        console.log("useEffect changed resourceTypes");
        fetchEvents();
    }, [resourceTypes, eventFromDate]);

    return (
        <EventContext.Provider value={currentEventContext}>
            {children}
        </EventContext.Provider>
    );
};

const useEvent = () => useContext(EventContext);

export { EventContextProvider, useEvent };
