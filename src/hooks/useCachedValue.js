// src/hooks/useCachedValue.js
import { useEffect, useRef, useState } from 'react';
import apiCache from '../api/apiCache';

/**
 * Кэшлэгдсэн хүсэлтийн үр дүнг хянаж, фон дээрх шинэчлэлтийг компонентод
 * хүргэнэ. Хүсэлт ӨӨРӨӨ явуулахгүй — дуудсан газар нь аль хэдийн татдаг;
 * энэ hook зөвхөн "аль хэдийн mount болсон компонентод шинэ өгөгдөл
 * хүргэх" үүрэгтэй (SWR-ийн subscription хэсэг).
 *
 * @param {string} url      - apiClient.get-ийн URL
 * @param {object} [params] - тухайн хүсэлтийн params (кэш түлхүүрийг бүрдүүлнэ)
 * @param {function} [select] - түүхий хариуг компонентын хэлбэрт хөрвүүлэх
 * @returns {*} хамгийн сүүлд мэдэгдэж буй утга, эсвэл null
 */
const useCachedValue = (url, params, select) => {
  // params нь ихэвчлэн render бүрд шинэ объект байдаг тул эффектийг
  // тогтвортой байлгахын тулд serialize хийж харьцуулна.
  const paramsKey = JSON.stringify(params ?? null);

  // select-ийг ref-ээр дамжуулна — inline функц эффектийг дахин
  // ажиллуулахгүйн тулд.
  const selectRef = useRef(select);
  selectRef.current = select;

  const [value, setValue] = useState(null);

  useEffect(() => {
    const key = apiCache.cacheKey(url, { params: JSON.parse(paramsKey) });
    const run = (raw) => (selectRef.current ? selectRef.current(raw) : raw);

    const entry = apiCache.peek(key);
    setValue(entry ? run(entry.data) : null);

    return apiCache.subscribe(key, (data) => setValue(run(data)));
  }, [url, paramsKey]);

  return value;
};

export default useCachedValue;
