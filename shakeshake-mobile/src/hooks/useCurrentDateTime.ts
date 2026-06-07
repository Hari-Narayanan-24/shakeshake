import { useState, useEffect } from "react";
import { format } from "date-fns";

type UseCurrentDateTimeReturn = {
  formattedDate: string;
  formattedTime: string;
};

export function useCurrentDateTime(): UseCurrentDateTimeReturn {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    formattedDate: format(now, "EEEE, MMMM d"),
    formattedTime: format(now, "h:mm a"),
  };
}
