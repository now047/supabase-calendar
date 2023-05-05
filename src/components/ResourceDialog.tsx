import * as React from "react";
import dayjs, { Dayjs } from "dayjs";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Box from "@mui/material/Box";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateField } from "@mui/x-date-pickers/DateField";
import { TimeField } from "@mui/x-date-pickers/TimeField";
import { DateTimeField } from "@mui/x-date-pickers/DateTimeField";
import { MultiInputDateRangeField } from "@mui/x-date-pickers-pro/MultiInputDateRangeField";
import { MultiInputTimeRangeField } from "@mui/x-date-pickers-pro/MultiInputTimeRangeField";
import { MultiInputDateTimeRangeField } from "@mui/x-date-pickers-pro/MultiInputDateTimeRangeField";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { StaticDateTimePicker } from "@mui/x-date-pickers/StaticDateTimePicker";
import { useTimePickerDefaultizedProps } from "@mui/x-date-pickers/TimePicker/shared";

import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import IEvent from "../lib/event-utils";
import Resource from "../lib/resource-utils";
import { EventContext } from "../App";
import { useColor } from "../contexts/ColorContext";

export interface ResourceDialogProps {
    id?: string;
    name: string;
    type: string;
    generation: string;
    note?: string;
    resources: Resource[];
    resource_id?: number;
    open: boolean;
    onClose: (resource: Resource | null) => void;
}

const ReserveDialog = (props: ResourceDialogProps) => {
    const { colors } = useColor();
    const [name, setName] = React.useState(props.name);
    const [nameError, setNameError] = React.useState(false);
    const [type, setType] = React.useState(props.type);
    const [generation, setGeneration] = React.useState(props.generation);
    const [note, setNote] = React.useState(props.note);
    const [colorList, setColorList] = React.useState(
        Array.from(colors).filter(
            (kv) => !props.resources.map((r) => r.display_color).includes(kv[0])
        )
    );
    const [color, setColor] = React.useState(colorList[0][0]);

    const resourceTypes = ["Grid", "Single", "Mini"];

    const resourceGenerations = ["3", "4", "5", "5.5", "6"];

    const handleClose = (cancel: boolean) => {
        if (!cancel) {
            if (name === undefined || name === null || name === "") {
                setNameError(true);
                return;
            }
            console.log(name, type, generation, note, color);
            setColorList((prev) => prev.filter((kv) => kv[0] !== color));
            props.onClose({
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
            <DialogTitle>New resource</DialogTitle>
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
                                label="Name of resource *"
                                variant="standard"
                                onChange={handleNameChange}
                            />
                        ) : (
                            <TextField
                                id="resource-name"
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

export default ReserveDialog;
