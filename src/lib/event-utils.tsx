import { EventInput } from '@fullcalendar/core'

let eventGuid = 0
let todayStr = new Date().toISOString().replace(/T.*$/, '') // YYYY-MM-DD of today

const simpleDateString = (d: Date, utc: boolean) => {
  const year = d.getUTCFullYear();
  if (utc) {
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

export const toSimpleDateString = (strDate: string) => {
  const datum = Date.parse(strDate);
  return simpleDateString(new Date(datum), false)
}

export const toDateString = (timestamp: number) => {
  const d = new Date(timestamp * 1000)
  return simpleDateString(d, true)
}

export const strToTimestamp = (strDate: string) => {
  const datum = Date.parse(strDate);
  return datum / 1000;
}

export const dateToTimestamp = (date: Date) => {
  return date.getTime()/1000 
}

// TODO: use EventInput instead?
export default interface IEvent {
  id?: number;
  created_at?: number;
  title: string;
  start: number;
  end: number;
  color: string;
  resource_id: number;
}

// TODO: create unique id
export function createEventId() {
  return String(eventGuid++)
}