import React, { useState, useContext } from 'react'
import {
  EventApi,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  formatDate,
} from '@fullcalendar/core'
import { Badge, Container, Box } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Avatar } from '@mui/material';
import { Typography } from '@mui/material';

import { colorMap } from '../lib/resource-utils';
import Resource from '../lib/resource-utils';
import { EventContext } from '../App';

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
  const eventContext = useContext(EventContext);
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
        <b>{formatDate(event.start!, { year: 'numeric', month: 'short', day: 'numeric' })}</b>
        <i>{event.title}</i>
      </li>
    )
  }

  const numEventsForSpecificResource = (id: number) => {
    let count = 0;
    eventContext.events!.current.forEach((e) => {
      if (e.resource_id === id) count++;
    })
    return count;
  }

  const resourceAvatar = (params: GridRenderCellParams<Resource>) => {
    return <>
      <Badge badgeContent={numEventsForSpecificResource(params.value?.id!)}
        color="secondary"
        variant="dot"
        overlap="circular">
        <Avatar sx={{
          bgcolor: colorMap.get(params.value!.display_color),
          width: 18, height: 18
        }}>
          {params.value!.name[0]}
        </Avatar>
      </Badge>
      <Typography sx={{ padding: 1 }}>
        {params.value!.name}
        #
        {params.value!.type}
      </Typography>
    </>
  };
  const resourceTableColumns: GridColDef[] = [
    {
      field: 'this',
      headerName: 'Resource',
      width: 200,
      editable: false,
      renderCell: resourceAvatar
    }
  ];

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
      <div className='supabase-calendar-sidebar-table'>
        <Container sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={eventContext.resources!.current.map((r) => { return { ...r, "this": r } })}
              columns={resourceTableColumns}
              rowsPerPageOptions={[25]}
              pagination
              autoHeight
              disableSelectionOnClick
            />
          </Box>
        </Container>
      </div>
    </div>
  )
}

export default Sidebar;