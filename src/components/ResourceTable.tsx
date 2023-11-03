import React, { useState } from "react";
import {
    Stack,
    Container,
    Box,
    Button,
    Avatar,
    Typography,
    Badge,
} from "@mui/material";
import {
    GridColDef,
    GridRenderCellParams,
    DataGrid,
    useGridApiContext,
    GridRowId,
    GridRowModel,
    GridToolbarContainer,
} from "@mui/x-data-grid";

import Resource from "../lib/resource-utils";
import { useColor } from "../contexts/ColorContext";
import { useResource } from "../contexts/ResourceContext";
import { useEvent } from "../contexts/EventContext";
import { ResourceDialogPrams } from "./ResourceDialog";

const ResourceTable = (props: {
    setResourcePrams: (p: ResourceDialogPrams) => void;
}) => {
    const [resourceTablePageSize, setResourceTablePageSize] =
        useState<number>(10);
    const { events } = useEvent();
    const { selectedResources, deleteResource } = useResource();
    const { colors } = useColor();

    const numEventsForSpecificResource = (id: number) => {
        let count = 0;
        events.forEach((e) => {
            if (e.resource_id === id) count++;
        });
        return count;
    };

    const resourceAvatar = (params: GridRenderCellParams<Resource>) => {
        return (
            <>
                <Badge
                    badgeContent={numEventsForSpecificResource(
                        params.value?.id!
                    )}
                    color="secondary"
                    variant="dot"
                    overlap="circular"
                >
                    <Avatar
                        variant="rounded"
                        sx={{
                            bgcolor: colors!.get(params.value!.display_color),
                            fontSize: 12,
                            width: 24,
                            height: 24,
                        }}
                    >
                        {params.value!.name[0] + params.value!.type[0]}
                    </Avatar>
                </Badge>
                <Typography sx={{ marginLeft: 1 }}>
                    {params.value!.name}
                </Typography>
            </>
        );
    };

    const resourceTableColumns: GridColDef[] = [
        {
            field: "this",
            headerName: "Name",
            width: 200,
            editable: false,
            renderCell: resourceAvatar,
        },
        {
            field: "type",
            headerName: "Type",
            width: 100,
            editable: false,
        },
        {
            field: "generation",
            headerName: "Generation",
            width: 100,
            editable: false,
        },
        {
            field: "note",
            headerName: "Note",
            width: 300,
            editable: false,
        },
    ];

    const handleResourceAdd = () => {
        props.setResourcePrams({
            name: "",
            generation: "",
            type: "",
            note: "",
        } as ResourceDialogPrams);
    };

    function ResourceTableToolBar() {
        const apiRef = useGridApiContext();

        const deleteResourceSelected = () => {
            //apiRef.current.setPage(1);
            const selectedRows: Map<GridRowId, GridRowModel> =
                apiRef.current.getSelectedRows();
            const iter = selectedRows.entries();
            for (const values of iter) {
                const resource = values[1];
                console.log(resource);
                if (numEventsForSpecificResource(resource.id) > 0) {
                    window.alert(
                        `'${resource.name}' has valid reservation so deletion is prohibited`
                    );
                } else if (
                    window.confirm(`Are you sure to delete '${resource.name}'`)
                ) {
                    deleteResource(resource.id);
                }
            }
        };
        return (
            <GridToolbarContainer
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                }}
            >
                <Button size="small" onClick={deleteResourceSelected}>
                    Delete
                </Button>
                <Button size="small" onClick={handleResourceAdd}>
                    Add
                </Button>
            </GridToolbarContainer>
        );
    }

    const handleDubleClickOnTable = (params: any) => {
        console.log("handleDubleClickOnTable", params);
        props.setResourcePrams(params.row as ResourceDialogPrams);
    };

    return (
        <Stack spacing={5}>
            <h1> Resorce </h1>
            <Container
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                }}
            >
                <DataGrid
                    rows={selectedResources.map((r) => {
                        return { ...r, this: r };
                    })}
                    columns={resourceTableColumns}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    pageSize={resourceTablePageSize}
                    onPageSizeChange={(newPageSize) =>
                        setResourceTablePageSize(newPageSize)
                    }
                    pagination
                    autoHeight
                    checkboxSelection
                    components={{ Toolbar: ResourceTableToolBar }}
                    disableSelectionOnClick
                    // experimentalFeatures={{ newEditingApi: true }}
                    onCellDoubleClick={handleDubleClickOnTable}
                />
            </Container>
        </Stack>
    );
};

export default ResourceTable;
