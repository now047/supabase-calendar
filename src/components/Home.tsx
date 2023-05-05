import type { User } from "@supabase/supabase-js";
import React from "react";
import { useEffect, useState, useContext } from "react";
import { supabase } from "../lib/api";
import RecoverPassword from "./RecoverPassword";

import IEvent from "../lib/event-utils";
import ReserveDialog, { ReserveDialogProps } from "./ReserveDialog";
import ResourceDialog from "./ResourceDialog";
import Resource from "../lib/resource-utils";
import Header from "./Header";
import ResourceTable from "./ResourceTable";
import Calendar from "./Calendar";
import ReservationTable from "./ReservationTable";
import { getResourceName } from "../lib/resource-utils";
import { strToTimestamp } from "../lib/event-utils";
import { EventContext, HeaderContext } from "../App";
import { useResource } from "../contexts/ResourceContext";

interface HomeProps {
    user: User;
    onUpdateEvents: () => void;
}

const Home = ({ user, onUpdateEvents }: HomeProps) => {
    const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
    const [eventSynced, setEventSynced] = useState<boolean>(false);
    const [reservationInfo, setReservationInfo] =
        useState<ReserveDialogProps | null>(null);
    const [resourceAdding, setResourceAdding] = useState(false);
    const { tab, setTab, eventFromDate, errorText, setError } =
        useContext(HeaderContext);
    const { events } = useContext(EventContext);
    const { resources, resourceTypes, addResource } = useResource();

    interface IResults {
        access_token: string;
        refresh_token: string;
        expires_in: string;
        token_type: string;
        type: string;
    }

    useEffect(() => {
        console.log("useEffect");
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
            console.log("calling fetch events");
            fetchEvents()
                .then((new_events: IEvent[]) => {
                    events!.current = new_events;
                    setEventSynced(true);
                    onUpdateEvents();
                })
                .catch(setError);
        }
    }, [eventSynced]);

    useEffect(() => {
        console.log("useEffect changed resourceTypes");
        fetchEvents()
            .then((new_events: IEvent[]) => {
                events!.current = new_events;
                setEventSynced(true);
                onUpdateEvents();
            })
            .catch(setError);
    }, [resourceTypes]);

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

    // Menue
    const handleLogout = async () => {
        supabase.auth.signOut().catch(setError);
    };

    // Events
    const fetchEvents = async () => {
        return new Promise(async (resolve: (e: IEvent[]) => void, reject) => {
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
        });
    };

    const handleResourceDialogClose = (resource: Resource | null) => {
        console.log("add resource");
        setResourceAdding(false);
        if (resource !== null) addResource(resource);
    };

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
            <ResourceDialog
                {...{
                    name: "",
                    generation: "",
                    type: "",
                    open: true,
                    resources: resources!.current,
                    onClose: handleResourceDialogClose,
                }}
            />
        </div>
    ) : tab === "Resource" ? (
        <div className={"supabase-calendar-main"}>
            <Header setEventSynced={setEventSynced} />
            <ResourceTable setResourceAdding={setResourceAdding} />
        </div>
    ) : tab === "Calendar" ? (
        <div className={"supabase-calendar-main"}>
            <Header setEventSynced={setEventSynced} />
            <Calendar
                eventSynced={eventSynced}
                setReservationInfo={setReservationInfo}
                setEventSynced={setEventSynced}
            />
        </div>
    ) : tab === "Reservation" ? (
        <div className={"supabase-calendar-main"}>
            <Header setEventSynced={setEventSynced} />
            <ReservationTable
                setReservationInfo={setReservationInfo}
                setEventSynced={setEventSynced}
            />
        </div>
    ) : (
        <>{handleLogout()}</>
    );
};

export default Home;
