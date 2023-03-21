import React from 'react'
import {
  EventApi,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  formatDate,
} from '@fullcalendar/core'
import { useEffect, useState, useRef, useContext } from "react";

type SupabaseCalendarConfig = {
  weekEndVisible: boolean,
  listView: boolean,
}

const defaultConfig: SupabaseCalendarConfig = {
  weekEndVisible: true,
  listView: false,
}

const SupaCalendarContext = React.createContext(defaultConfig)
const Sidebar = () => {
    const [weekendsVisible, setWeekendVisible] = useState<boolean>(false);
    const handleWeekendsToggle = () => {
        setWeekendVisible(!weekendsVisible);
    }

    const handleEventClick = (clickInfo: EventClickArg) => {
        if (window.confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
            clickInfo.event.remove()
        }
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
        </div>
      </div>
    )
}

export default Sidebar;