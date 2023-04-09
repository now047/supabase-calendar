import React, { useState, useContext } from 'react'
import { Badge, Container, Box, Stack, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Avatar } from '@mui/material';
import { Typography } from '@mui/material';

import { colorMap } from '../lib/resource-utils';
import Resource from '../lib/resource-utils';
import { EventContext } from '../App';


const Sidebar = (props: {
    handleSelectChange: (k: string, n: string, v: boolean)=>void
  }) => {
  const ctx = useContext(EventContext);

  const numEventsForSpecificResource = (id: number) => {
    let count = 0;
    ctx.events!.current.forEach((e) => {
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

  const handleSelectChangeEvent = (kind: string, name: string, event: React.ChangeEvent<HTMLInputElement>) => {
    props.handleSelectChange(kind, name, event.target.checked);
  }

  const formControlCheckbox = (kind: string) => {
    if (ctx.resourceTypes === undefined) return <></>
    const type_iter = (kind === 'type') ?
              ctx.resourceTypes!.types.entries() :
              ctx.resourceTypes!.generations.entries();
    const keyValuePairs = Array.from(type_iter);

    return <>
      {
        keyValuePairs.map(([k, v]) => <FormControlLabel control={
                  <Checkbox checked={v} 
                            onChange={handleSelectChangeEvent.bind(null, kind, k)}
                            size='small' />
                  }
                label={k} key={`checkbox-type-select-${k}`} />
        )
      }
      </>
  }

  return (
    <div className='supabase-calendar-sidebar'>
      <div className='supabase-calendar-sidebar-section'>
        <Stack spacing={5} direction="column" >
          <FormControl variant="standard">
            <FormLabel component="legend">Select by Type</FormLabel>
            <FormGroup aria-label="position" >
              { formControlCheckbox("type")}
            </FormGroup>
          </FormControl>
          <FormControl>
            <FormLabel component="legend">Select by Generation</FormLabel>
            <FormGroup aria-label="position" >
              { formControlCheckbox("generation")}
            </FormGroup>
          </FormControl>
        </Stack>
      </div>
      <div className='supabase-calendar-sidebar-table'>
        <Container sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={ctx.selectedResources!.map((r) => { return { ...r, "this": r } })}
              columns={resourceTableColumns}
              rowsPerPageOptions={[25]}
              pageSize={25}
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