import React, { createContext, useContext, useEffect, useState } from "react";
import IEvent, { strToTimestamp, toDateString } from "../lib/event-utils";
import { supabase } from "../lib/api";
import { getResourceName } from "../lib/resource-utils";
import { useResource } from "./ResourceContext";
import { HeaderContext } from "../App";
import { useColor } from "./ColorContext";

type EventContextType = {
    events: IEvent[];
    eventSynced: boolean;
    syncEvent: (e: IEvent) => Promise<void>;
    deleteEvent: (id: string) => void;
};
const defaultEventContext: EventContextType = {
    events: [],
    eventSynced: false,
    syncEvent: (e: IEvent) => new Promise<void>(() => {}),
    deleteEvent: async (id: string) => {},
};
export const EventContext = createContext(defaultEventContext);

const EventContextProvider = ({ children }: any) => {
    const [events, setEvents] = useState<IEvent[]>([]);
    const [eventSynced, setEventSynced] = useState<boolean>(false);
    const { resources, resourceTypes } = useResource();
    const { user, setError, eventFromDate } = useContext(HeaderContext);
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
                console.log("synced event:", DBEventToIEvent(event));
                setError(null);
                fetchEvents();
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
                setEvents([...events, DBEventToIEvent(event)]);
                setError(null);
                fetchEvents();
            }
        }
    };

    const deleteEvent = async (id: string) => {
        let { data: event, error } = await supabase
            .from("events")
            .delete()
            .eq("id", id);
        if (error) setError(error.message);
        else {
            setError(null);
            fetchEvents();
        }
    };

    const currentEventContext = {
        events: events,
        eventSynced: eventSynced,
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
