import { EventInput } from '@fullcalendar/core'

const simpleDateString = (d: Date, utc: boolean) => {
  if (utc) {
    const year = d.getUTCFullYear();
    let month: string | number = d.getUTCMonth() + 1;
    month = (month < 10 ? '0' + month : month)
    const day = (d.getUTCDate() < 10) ? '0' + d.getUTCDate() : d.getUTCDate();
    const hour = (d.getUTCHours() < 10) ? '0' + d.getUTCHours() : d.getUTCHours();
    const min = (d.getUTCMinutes() < 10) ? '0' + d.getUTCMinutes() : d.getUTCMinutes();
    const sec = (d.getUTCSeconds() < 10) ? '0' + d.getUTCSeconds() : d.getUTCSeconds();
    const str_date = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    return str_date;
  }
  else {
    const year = d.getFullYear();
    let month: string | number = d.getUTCMonth() + 1;
    month = (month < 10 ? '0' + month : month)
    const day = (d.getDate() < 10) ? '0' + d.getDate() : d.getDate();
    const hour = (d.getHours() < 10) ? '0' + d.getHours() : d.getHours();
    const min = (d.getMinutes() < 10) ? '0' + d.getMinutes() : d.getMinutes();
    const sec = (d.getSeconds() < 10) ? '0' + d.getSeconds() : d.getSeconds();
    const str_date = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
    return str_date;
  }

}

export const toLocalDateString = (timestamp: number) => {
  const d = new Date(timestamp)
  return simpleDateString(d, false)
}

export const toDateString = (timestamp: number) => {
  const d = new Date(timestamp)
  return simpleDateString(d, true)
}

export const strToTimestamp = (strDate: string) => {
  const isNumber = Number(strDate);
  if (!Number.isNaN(isNumber)){
    console.log('strToTimestamp', isNumber)
    return isNumber;
  }
  return Date.parse(strDate);
}

export const dateToTimestamp = (date: Date) => {
  if (date === null)
    return date;
  return date.getTime() 
}

// TODO: use EventInput instead?
export default interface IEvent {
  id?: number;
  created_at?: number;
  title: string;
  start: number; // miliseconds
  end: number;   // miliseconds
  color: string;
  resource_id: number;
}
