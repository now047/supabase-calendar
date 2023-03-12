import * as React from 'react';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import { blue } from '@mui/material/colors';
import TextField from '@mui/material/TextField';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import dayjs, {Dayjs} from 'dayjs';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateField } from '@mui/x-date-pickers/DateField';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import { DateTimeField } from '@mui/x-date-pickers/DateTimeField';
import { MultiInputDateRangeField } from '@mui/x-date-pickers-pro/MultiInputDateRangeField';
import { MultiInputTimeRangeField } from '@mui/x-date-pickers-pro/MultiInputTimeRangeField';
import { MultiInputDateTimeRangeField } from '@mui/x-date-pickers-pro/MultiInputDateTimeRangeField';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useTimePickerDefaultizedProps } from '@mui/x-date-pickers/TimePicker/shared';

import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction"
import {
    EventApi,
    DateSelectArg,
    EventClickArg,
    EventContentArg,
    formatDate,
  } from '@fullcalendar/core'

import {IEvent} from '../lib/event-utils'

export interface ReserveDialogProps {
    id?: string;
    open: boolean;
    user: string;
    start: number;
    end?: number;
    title?: string;
    onClose: (event: IEvent) => void;
    onDelete: (id: string|undefined) => void;
}

const ReserveDialog = (props: ReserveDialogProps) => {
    const [user, setUser] = React.useState(props.user);
    const [start, setStart] = React.useState(dayjs(props.start));
    const [end, setEnd] = React.useState(props.end? dayjs(props.end) : dayjs(props.start));
    const [title, setTitle] = React.useState(props.title? props.title: "");
    const titleTextRef = React.useRef('');
    const startRef = React.useRef();

    const handleClose = () => {
        props.onClose({
            id: props.id,
            start: start.unix(),
            end: end.unix(),
            title: title,
            color: 'green',
        } as IEvent);
    };

    const handleStartChange = (s: Dayjs|null) => {
        console.log("start utc offset: ", s?.utcOffset());
        console.log(s?.toISOString())
        if (s !== null) {
            setStart(s)
        }
    }
 
    const handleEndChange = (e: Dayjs|null) => {
        console.log(e?.toDate())
        if (e !== null) {
            setEnd(e)
        }
    }

    const handleTitleChange = (t: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setTitle(t.currentTarget.value);
    }

    const handleDelete = () => {
        props.onDelete(props.id)
    }
    
    function ProLabel({ children }: { children: React.ReactNode }) {
        return (
            <Stack direction="row" spacing={0.5} component="span">
            <Tooltip title="Included in Pro package">
                <a href="/x/introduction/licensing/#pro-plan">
                <span className="plan-pro" />
                </a>
            </Tooltip>
            <span>{children}</span>
            </Stack>
        );
    }

    return (
        <Dialog onClose={handleClose} open={props.open}>
            <Box sx={{ '& > :not(style)': { m: 2 } }}>
                <DialogTitle>Make Reservation !</DialogTitle>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer
                        components={[
                        'Start',
                        'End',
                        'Purpose',
                        'Delete',
                        ]}
                    >
                        <DemoItem label={<ProLabel>Start Date & Time</ProLabel>} component="Start" >
                            <DateTimePicker value={start} onChange={handleStartChange}/>
                        </DemoItem>
                        <DemoItem label={<ProLabel>End Date & Time</ProLabel>} component="End" >
                            <DateTimePicker value={end} onChange={handleEndChange}/>
                        </DemoItem>
                        <DemoItem label={<ProLabel>Purpose of Use</ProLabel>} component="Purpose" >
                            <TextField required id="title-input" label="Input purpose of use" variant="outlined"
                                        value={title} onChange={handleTitleChange}/>
                        </DemoItem>
                        <DemoItem label={<ProLabel>Delete Reservation</ProLabel>} component='Delete'>
                        {props.id ?
                            (<Button onClick={handleDelete} variant="text">Delete</Button>) :
                            (<Button onClick={handleDelete} variant="text">Cancel</Button>)
                        }
                        </DemoItem>
                    </DemoContainer>
                </LocalizationProvider>
            </Box>
        </Dialog>
    );
}

export default ReserveDialog;