import type { User } from "@supabase/supabase-js";
import React from "react";
import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "../lib/api";
import RecoverPassword from "./RecoverPassword";

import IEvent from "../lib/event-utils"
import ReserveDialog, {ReserveDialogProps} from "./ReserveDialog";
import ResourceDialog from "./ResourceDialog";
import Resource from "../lib/resource-utils"
import Header from "./Header"
import ResourceTable from "./ResourceTable";
import Calendar from "./Calendar";
import ReservationTable from "./ReservationTable";
import { getResourceName } from "../lib/resource-utils";
import { strToTimestamp } from "../lib/event-utils";
import { EventContext, HeaderContext, ResourceContext } from "../App";

const Home = ({ user }: { user: User }) => {
    const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
    const [eventSynced, setEventSynced] = useState<boolean>(false);
    const [resourceSynced, setResourceSynced] = useState<boolean>(false);
    const [reservationInfo, setReservationInfo] = useState<ReserveDialogProps|null> (null);
    const [resourceAdding, setResourceAdding] = useState(false);
    const {tab, setTab, errorText, setError} = useContext(HeaderContext);
    const {events, setEvents} = useContext(EventContext);
    const {resources, setResources} = useContext(ResourceContext);;

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
            fetchEvents().then((events: IEvent[]) => {
                setEvents(events);
                setEventSynced(true);
            }).catch(setError)
        }
        if (!resourceSynced) {
            console.log('calling fetch resources')
            fetchResources().catch(setError);
        }
    }, [resourceSynced, eventSynced, errorText, reservationInfo]);

    const DBEventToIEvent = (db_event: any) => {
        return {...db_event,
            purpose_of_use: db_event.title,
            start: strToTimestamp(db_event.start),
            end: strToTimestamp(db_event.end),
            resource_name: getResourceName(db_event.resource_id, resources)
        } as IEvent;
    };

    // Menue
    const handleLogout = async () => {
        supabase.auth.signOut().catch(setError);
    };

    // Events
    const fetchEvents = async () => {
        return new Promise(async (resolve: (e:IEvent[])=>void, reject) => {
            let { data: events, error } = await supabase
                .from("events")
                .select("*")
                .order("id", { ascending: false });
            if (error) {
                reject(error.message);
            } else {
                resolve(events?.map((e) => DBEventToIEvent(e)) as IEvent[]);
            }
        });
    };

    // Resources
    const fetchResources = async () => {
        let { data: resources, error } = await supabase
            .from("resources")
            .select("*")
            .order("id", { ascending: false });
        if (error) setError(error.message);
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
            <Header/>
            <ResourceTable
                setResourceAdding={setResourceAdding}
                setResourceSynced={setResourceSynced}/>
        </div>
        ): tab === 'Calendar' ?(
        <div className={"supabase-calendar-main"}>
            <Header/>
            <Calendar
                eventSynced={eventSynced}
                setReservationInfo={setReservationInfo}
                setEventSynced={setEventSynced}/>
        </div>
        ): tab === 'Reservation' ?(
        <div className={"supabase-calendar-main"}>
            <Header/>
            <ReservationTable events={events.map((e) => {
                return {...e, resource_name: getResourceName(e.resource_id, resources)}})} />
        </div>
    ): (
        <>{handleLogout()}</>
    )
};

export default Home;
