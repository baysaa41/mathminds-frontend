// Одоогийн цаг — тогтмол хугацаанд шинэчлэгдэнэ. Countdown («дуусахад 5 цаг үлдлээ») нь зөвхөн
// render үед тооцоологддог тул хуудас нээлттэй зогссон үед хуучирдаг — энэ hook түүнийг засна.
import { useEffect, useState } from 'react';

const TICK_MS = 30000;

export default function useNow(intervalMs = TICK_MS) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
