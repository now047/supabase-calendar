import React, { useState, useContext } from "react";
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
import { supabase } from "../lib/api";

import { EventContext, HeaderContext } from "../App";
import Resource from "../lib/resource-utils";
import { useColor } from "../contexts/ColorContext";

const ResourceTable = (props: {
    setResourceAdding: (b: boolean) => void;
    setResourceSynced: (b: boolean) => void;
}) => {
    const [resourceTablePageSize, setResourceTablePageSize] =
        useState<number>(10);
    const { tab, setTab, errorText, setError } = useContext(HeaderContext);
    const { events, resources, selectedResources } = useContext(EventContext);

    const { colors } = useColor();

    const numEventsForSpecificResource = (id: number) => {
        let count = 0;
        events!.current.forEach((e) => {
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
        props.setResourceAdding(true);
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

    const deleteResource = async (id: string | undefined) => {
        if (id) {
            let res = await supabase.from("resources").delete().eq("id", id);
            if (res.error !== null) {
                setError(res.error.details);
            } else {
                props.setResourceSynced(false);
                setError(null);
            }
        }
    };

    const handleDubleClickOnTable = () => {
        console.log("handleDubleClickOnTable");
    };

    return (
        <>
            <Stack spacing={5}>
                <h1> Resorce </h1>
                <div className={"flex m-4 justify-center"}>
                    <Container
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            width: "90%",
                        }}
                    >
                        <Box sx={{ width: "100%" }}>
                            <DataGrid
                                rows={selectedResources!.map((r) => {
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
                        </Box>
                    </Container>
                </div>
            </Stack>
        </>
    );
};

export default ResourceTable;
