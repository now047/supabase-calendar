import * as React from "react";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Box from "@mui/material/Box";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import Stack from "@mui/material/Stack";

import Resource from "../lib/resource-utils";
import { useColor } from "../contexts/ColorContext";

export interface ResourceDialogPrams {
    id?: string;
    name: string;
    type: string;
    generation: string;
    note?: string;
    display_color?: number;
}

export interface ResourceDialogProps extends ResourceDialogPrams {
    open: boolean;
    resources: Resource[];
    onClose: (resource: Resource | null) => void;
}

const ResourceDialog = (props: ResourceDialogProps) => {
    const { colors } = useColor();
    const [name, setName] = React.useState(props.name);
    const [nameError, setNameError] = React.useState(false);
    const [type, setType] = React.useState(props.type);
    const [generation, setGeneration] = React.useState(props.generation);
    const [note, setNote] = React.useState(props.note);
    const colorList = Array.from(colors).filter(
        (kv) =>
            !props.resources.map((r) => r.display_color).includes(kv[0]) ||
            (props.display_color && kv[0] == props.display_color)
    );
    const initialCorrorIndex = props.display_color
        ? colorList.findIndex((kv) => {
              return kv[0] == props.display_color;
          })
        : 0;
    const [color, setColor] = React.useState(colorList[initialCorrorIndex][0]);

    const resourceTypes = ["Grid", "Single", "Mini"];

    const resourceGenerations = ["3", "4", "5", "5.5", "6"];

    const handleClose = (cancel: boolean) => {
        if (!cancel) {
            if (name === undefined || name === null || name === "") {
                setNameError(true);
                return;
            }
            console.log(name, type, generation, note, color);
            props.onClose({
                id: props.id ? Number(props.id) : null,
                name: name,
                type: type ?? "",
                generation: generation ?? "",
                note: note ?? "",
                display_color: color,
            } as Resource);
        } else {
            props.onClose(null);
        }
    };

    const handleNameChange = (event: any) => {
        setNameError(false);
        setName(event.target.value);
    };

    const handleTypeChange = (event: SelectChangeEvent) => {
        console.log("type change:", event.target);
        setType(event.target.value);
    };

    const handleGenerationChange = (event: SelectChangeEvent) => {
        console.log("generation change:", event.target.value);
        setGeneration(event.target.value);
    };

    const handleColorChange = (event: SelectChangeEvent) => {
        console.log("color change:", event.target.value);
        setColor(Number(event.target.value));
    };

    const handleNoteChange = (event: any) => {
        setNote(event.target.value);
    };

    return (
        <Dialog onClose={handleClose.bind(null, true)} open={props.open}>
            {props.id ? (
                <DialogTitle>Modify resource</DialogTitle>
            ) : (
                <DialogTitle>New resource</DialogTitle>
            )}
            <Box sx={{ "& > :not(style)": { m: 2 } }}>
                <DemoContainer
                    components={[
                        "Resource",
                        "Start",
                        "End",
                        "Purpose",
                        "Delete",
                    ]}
                >
                    <DemoItem component="Name">
                        {nameError ? (
                            <TextField
                                error
                                id="resource-name"
                                value={name}
                                label="Name of resource *"
                                variant="standard"
                                onChange={handleNameChange}
                            />
                        ) : (
                            <TextField
                                id="resource-name"
                                value={name}
                                label="Name of resource *"
                                variant="standard"
                                onChange={handleNameChange}
                            />
                        )}
                    </DemoItem>
                    <DemoItem component="Type">
                        <FormControl fullWidth>
                            <InputLabel id="resource-type-select-label">
                                Type
                            </InputLabel>
                            <Select
                                labelId="resource-type-select-label"
                                id="resource-type-select"
                                value={type}
                                label="resource type"
                                onChange={handleTypeChange}
                            >
                                {resourceTypes.map((r) => (
                                    <MenuItem key={r} value={r}>
                                        {" "}
                                        {r}{" "}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DemoItem>
                    <DemoItem component="Generation">
                        <FormControl fullWidth>
                            <InputLabel id="resource-generation-select-label">
                                Generation
                            </InputLabel>
                            <Select
                                labelId="resource-generation-select-label"
                                id="resource-generation-select"
                                value={generation}
                                label="resource generation"
                                onChange={handleGenerationChange}
                            >
                                {resourceGenerations.map((g) => (
                                    <MenuItem key={g} value={g}>
                                        {" "}
                                        {g}{" "}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DemoItem>
                    <DemoItem component="Note">
                        <TextField
                            id="resource-note"
                            label="Note for resource"
                            value={note}
                            multiline
                            rows={4}
                            helperText="Describe some important note for the resource such as IP address, etc."
                            variant="standard"
                            onChange={handleNoteChange}
                        />
                    </DemoItem>
                    <DemoItem component="Color">
                        <FormControl>
                            <InputLabel id="resource-color-select-label">
                                Display color
                            </InputLabel>
                            <Select
                                labelId="resource-color-select-label"
                                id="resource-color-select"
                                value={color.toString()}
                                label="resource display color"
                                onChange={handleColorChange}
                            >
                                {colorList.map((kv) => (
                                    <MenuItem
                                        key={"color-" + kv[0]}
                                        value={kv[0]}
                                    >
                                        <Stack direction="row">
                                            <Avatar
                                                variant="rounded"
                                                sx={{
                                                    bgcolor: kv[1],
                                                    fontSize: 12,
                                                    width: 24,
                                                    height: 24,
                                                }}
                                            >
                                                {(name[0] ?? "R") +
                                                    (type[0] ?? "T")}
                                            </Avatar>
                                            <Typography sx={{ marginLeft: 1 }}>
                                                {name}
                                            </Typography>
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DemoItem>

                    <DemoItem component="Delete">
                        <Stack
                            paddingBottom={2}
                            justifyContent={"space-between"}
                            direction="row"
                        >
                            <Button
                                onClick={handleClose.bind(null, true)}
                                variant="text"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleClose.bind(null, false)}
                                variant="text"
                            >
                                Save
                            </Button>
                        </Stack>
                    </DemoItem>
                </DemoContainer>
            </Box>
        </Dialog>
    );
};

export default ResourceDialog;
