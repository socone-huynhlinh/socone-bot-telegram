import { DateTime } from 'luxon';

export const calculateOffDay = (offDate: string, startTime: string): string => {
    const dateTimeString = `${offDate} ${startTime}`;
    const formatString = "dd/MM/yyyy HH:mm";
  
    const offDay = DateTime.fromFormat(dateTimeString, formatString, {
      zone: "Asia/Ho_Chi_Minh",
    });
  
    return offDay.toFormat("yyyy-MM-dd HH:mm:ss.SSSZZ");
};