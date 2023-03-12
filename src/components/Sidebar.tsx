import React from 'react'
import {
  EventApi,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  formatDate,
} from '@fullcalendar/core'
import { useEffect, useState, useRef } from "react";

import {createEventId } from "../lib/event-utils";

const Sidebar = () => {
    const [weekendsVisible, setWeekendVisible] = useState<boolean>(false);
    const [events, setEvents] = useState<EventApi[]>([]);

    const handleWeekendsToggle = () => {
        setWeekendVisible(!weekendsVisible);
    }

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        let title = prompt('Please enter a new title for your event')
        let calendarApi = selectInfo.view.calendar
        calendarApi.unselect() // clear date selection

        if (title) {
            calendarApi.addEvent({
                id: createEventId(),
                title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                allDay: selectInfo.allDay
            })
        }
    }

    const handleEventClick = (clickInfo: EventClickArg) => {
        if (window.confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
            clickInfo.event.remove()
        }
    }

    const handleEvents = (events: EventApi[]) => {
        setEvents(events);
    }

    const renderEventContent = (eventContent: EventContentArg) => {
        return (
            <>
            <b>{eventContent.timeText}</b>
            <i>{eventContent.event.title}</i>
            </>
        )
    }

    const renderSidebarEvent = (event: EventApi) => {
        return (
          <li key={event.id}>
            <b>{formatDate(event.start!, {year: 'numeric', month: 'short', day: 'numeric'})}</b>
            <i>{event.title}</i>
          </li>
        )
    }

    return (
      <div className='supabase-calendar-sidebar'>
        <div className='supabase-calendar-sidebar-section'>
          <h2>Instructions</h2>
          <ul>
            <li>Select dates and you will be prompted to create a new event</li>
            <li>Drag, drop, and resize events</li>
            <li>Click an event to delete it</li>
          </ul>
        </div>
        <div className='supabase-calendar-sidebar-section'>
          <label>
            <input
              type='checkbox'
              checked={weekendsVisible}
              onChange={handleWeekendsToggle}
            ></input>
            toggle weekends
          </label>
        </div>
        <div className='supabase-calendar-sidebar-section'>
          <h2>All Events ({events.length})</h2>
          <ul>
            {events.map(renderSidebarEvent)}
          </ul>
        </div>
      </div>
    )
}

export default Sidebar;