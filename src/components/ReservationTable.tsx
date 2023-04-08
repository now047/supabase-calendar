import React, { useContext, useMemo, useState } from "react";
import Container from "@mui/material/Container"
import { DataGrid, GridColDef, GridRenderCellParams, GridRowId, GridRowModel, GridToolbarContainer, useGridApiContext } from "@mui/x-data-grid";
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Radio, RadioGroup, Stack } from "@mui/material";

import { supabase } from "../lib/api";
import { toLocalDateString } from "../lib/event-utils";
import { ReserveDialogProps } from "./ReserveDialog";
import { HeaderContext, EventContext } from "../App";

import { Calendar as BigCalendar, Views, dayjsLocalizer, Navigate, NavigateAction } from "react-big-calendar";
// @ts-ignore
import * as TimeGrid from 'react-big-calendar/lib/TimeGrid'
import "react-big-calendar/lib/css/react-big-calendar.css";
import * as dates from 'date-arithmetic'
import dayjs from "dayjs";
import timezone from 'dayjs/plugin/timezone'

function MyDay(
  {
    date,
    localizer,
    max = localizer.endOf(localizer.add(new Date(), 7, 'day'), 'day'),
    min = localizer.startOf(new Date(), 'day'),
    scrollToTime = localizer.startOf(new Date(), 'day'),
    ...props
  }: {
    date: Date,
    localizer: any,
    max: Date,
    min: Date,
    scrollToTime: Date,
    props: any
  }) {

  const currRange = useMemo(
    () => MyDay.range(date, localizer),
    [date, localizer]
  )
  const ret =
    <TimeGrid
      eventOffset={15}
      max={max}
      min={min}
      localizer={localizer}
      range={currRange}
      scrollToTime={scrollToTime}
      {...props} />
  console.log(ret);
  return (ret);
}

MyDay.range = (date: Date, localizer: any) => {
  const start = date
  const end = dates.add(start, 7, 'day')

  let current = start
  const range = []

  while (localizer.lte(current, end, 'day')) {
    range.push(current)
    current = localizer.add(current, 1, 'day')
  }

  return range
}

MyDay.navigate = (date: Date, action: NavigateAction, props: { localizer: any }) => {
  switch (action) {
    case Navigate.PREVIOUS:
      return props.localizer.add(date, -7, 'day')

    case Navigate.NEXT:
      return props.localizer.add(date, 7, 'day')

    default:
      return date
  }
};

MyDay.title = (date: Date) => {
  return `My awesome week: ${date.toLocaleDateString()}`
};

const ReservationTable = (props: {
  setReservationInfo: (info: ReserveDialogProps) => void,
  setEventSynced: (b: boolean) => void,
}) => {
  const [pageSize, setPageSize] = useState<number>(20);
  const renderDateString = (params: GridRenderCellParams<number>) => {
    if (params.value === undefined)
      return '-'
    else
      return toLocalDateString(params.value)
  };

  const { user, setError } = useContext(HeaderContext);
  const { events, resources, selectedResources } = useContext(EventContext);

  function ReserveTableToolBar() {
    const apiRef = useGridApiContext();

    const deleteEventSelected = () => {
      //apiRef.current.setPage(1);
      const selectedRows: Map<GridRowId, GridRowModel> = apiRef.current.getSelectedRows();
      const iter = selectedRows.entries()
      let ent = iter.next();
      while (!ent.done) {
        const event = ent.value[1];
        if (window.confirm(`Are you sure to cancel resarvation ? : '${event.purpose_of_use}'`)) {
          deleteEvent(event.id)
        }
        ent = iter.next();
      }
    }

    return (
      <GridToolbarContainer
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'left',
        }}>
        <Button size='small' onClick={deleteEventSelected}>Delete</Button>
      </GridToolbarContainer>
    );
  };

  const deleteEvent = async (id: string | undefined) => {
    if (id) {
      let res = await supabase
        .from("events")
        .delete()
        .eq('id', id)
      props.setEventSynced(false);
      setError(null);
    }
  };

  const eventTableColumns: GridColDef[] = [
    //{ field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'resource_name',
      headerName: 'Resource',
      width: 200,
      editable: false,
    },
    {
      field: 'start',
      headerName: 'Start date',
      type: 'string',
      width: 200,
      editable: false,
      renderCell: renderDateString
    },
    {
      field: 'end',
      headerName: 'End date',
      type: 'string',
      width: 180,
      editable: false,
      renderCell: renderDateString
    },
    {
      field: 'purpose_of_use',
      headerName: 'Pose of use',
      width: 400,
      editable: false,
    },
  ];

  const handleDubleClickOnTable = () => {
    console.log('handleDubleClickOnTable')

  };

  const ColoredEventWrapper = ({ children }: any) => {
    return React.cloneElement(React.Children.only(children), {
      style: {
        ...children.props.style,
        backgroundColor: children._owner.pendingProps.event.color,
        color: 'white',
        border: 0,
        alignItems: 'center',
        left: '4%',
      },
    }
    )
  }

  const ColoredDateCellWrapper = ({ children }: any) =>
    React.cloneElement(React.Children.only(children), {
      style: {
        backgroundColor: "#eaf9ff",
      },
    }
    )

  dayjs.extend(timezone);
  const djLocalizer = dayjsLocalizer(dayjs);

  const { components, defaultDate, max, views } = useMemo(
    () => ({
      components: {
        timeSlotWrapper: ColoredDateCellWrapper,
        eventWrapper: ColoredEventWrapper,
      },
      defaultDate: new Date(),
      max: djLocalizer.endOf(djLocalizer.add(new Date(), 7, 'day'), 'day'),

      //max: dayjs().endOf('day').subtract(1, 'hours').toDate(),
      //views: [Views.DAY, Views.AGENDA],
      //views: Object.keys(Views).map((k) => Views[k] as Views),
      views: { day: true, agenda: true }
    }),
    []
  )

  const { types, generations } = useMemo(
    () => ({
      types: resources!.current.map(r => r.type).filter((v, i, a) => a.indexOf(v) === i),
      generations: resources!.current.map(r => r.generation).filter((v, i, a) => a.indexOf(v) === i)
    }), [resources]
  )

  const [typeCheckedState, setTypeCheckedState] = useState(
    types.map(t => true)
  );

  const handleSelectTypeChange = (i: number, event: React.ChangeEvent<HTMLInputElement>) => {
    setTypeCheckedState(typeCheckedState.map((c, j)  => (i===j) ? event.target.checked : c));
  }

  const [genCheckedState, setGenCheckedState] = useState(
    generations.map(g => true)
  );

  const handleSelectGenChange = (i: number, event: React.ChangeEvent<HTMLInputElement>) => {
    setGenCheckedState(genCheckedState.map((c, j)  => (i===j) ? event.target.checked : c));
  }

  const selectedEvents = useMemo(
    () =>
    events!.current.filter(e => 
      selectedResources!.map(r => r.name).indexOf(e.resource_name!) !== -1)
  , [events, selectedResources])

  return (
    <Stack spacing={5}>
      <h1> Reservation </h1>
      <div hidden={false} className={"flex m-4 justify-center"} >
        <BigCalendar
          components={components}
          defaultDate={defaultDate}
          views={views}
          max={max}
          defaultView={Views.DAY}
          events={selectedEvents.map(e => {
            return {
              ...e,
              title: e.purpose_of_use,
              start: new Date(e.start),
              end: new Date(e.end),
            }
          }) as []}
          step={60}
          resourceAccessor={"resource_id"}
          resources={selectedResources!}
          resourceTitleAccessor={"name"}
          localizer={djLocalizer}
        />
      </div>
      <div className={"flex m-4 justify-center"}>
        <Container sx={{ display: 'flex', justifyContent: 'center', width: '90%' }}>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={selectedEvents}
              columns={eventTableColumns}
              pageSize={pageSize}
              autoHeight
              rowsPerPageOptions={[10, 20, 50]}
              onPageSizeChange={(size) => setPageSize(size)}
              checkboxSelection
              disableSelectionOnClick
              components={{ Toolbar: ReserveTableToolBar }}
              experimentalFeatures={{ newEditingApi: true }}
              onCellDoubleClick={handleDubleClickOnTable}
            />
          </Box>
        </Container>
      </div>
    </Stack>
  )
}

export default ReservationTable;