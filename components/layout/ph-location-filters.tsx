"use client";

import { useCallback, useEffect, useState } from "react";
import { NCR_REGION_CODE } from "@/lib/ph-geo/ncr";
import { cn } from "@/lib/cn";

type PsgcRow = { code: string; name: string; isRegion?: boolean };

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

const selectClass =
  "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

export type PhGeoNames = {
  province: string;
  city: string;
  brgy: string;
};

type Props = {
  initial: PhGeoNames;
  onNamesChange: (g: PhGeoNames) => void;
  className?: string;
};

function schedule(cb: () => void) {
  void Promise.resolve().then(cb);
}

export function PhLocationFilters({
  initial,
  onNamesChange,
  className,
}: Props) {
  const [provinces, setProvinces] = useState<PsgcRow[]>([]);
  const [provCode, setProvCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [brgyCode, setBrgyCode] = useState("");
  const [cities, setCities] = useState<PsgcRow[]>([]);
  const [brgys, setBrgys] = useState<PsgcRow[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingC, setLoadingC] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    fetch("/api/ph/provinces")
      .then((r) => {
        if (!r.ok) throw new Error("Provinces failed");
        return r.json() as Promise<PsgcRow[]>;
      })
      .then((data) => {
        if (cancel) return;
        setProvinces(data);
      })
      .catch(() => {
        if (!cancel) {
          setGeoError("Could not load provinces. Try again later.");
        }
      })
      .finally(() => {
        if (!cancel) setLoadingP(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!provinces.length || !initial.province) return;
    const row = provinces.find((p) => norm(p.name) === norm(initial.province));
    if (row) schedule(() => setProvCode(row.code));
  }, [provinces, initial.province]);

  useEffect(() => {
    if (!provCode) return;

    let cancel = false;
    schedule(() => setLoadingC(true));
    schedule(() => setGeoError(null));

    const isNcr = provCode === NCR_REGION_CODE;
    const url = isNcr
      ? `/api/ph/cities?region=${NCR_REGION_CODE}`
      : `/api/ph/cities?province=${encodeURIComponent(provCode)}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Cities failed");
        return r.json() as Promise<PsgcRow[]>;
      })
      .then((data) => {
        if (cancel) return;
        setCities(data);

        const prov = provinces.find((p) => p.code === provCode);
        const provNameMatch =
          !!prov &&
          !!initial.province &&
          norm(prov.name) === norm(initial.province);

        let nextCity = "";
        if (provNameMatch && initial.city) {
          const c = data.find((x) => norm(x.name) === norm(initial.city));
          if (c) nextCity = c.code;
        }
        setCityCode(nextCity);
        if (!nextCity) {
          setBrgys([]);
          setBrgyCode("");
        }
      })
      .catch(() => {
        if (!cancel) setGeoError("Could not load cities.");
      })
      .finally(() => {
        if (!cancel) setLoadingC(false);
      });

    return () => {
      cancel = true;
    };
  }, [provCode, provinces, initial.province, initial.city]);

  useEffect(() => {
    if (!cityCode) return;

    let cancel = false;
    schedule(() => setLoadingB(true));

    fetch(`/api/ph/barangays?city=${encodeURIComponent(cityCode)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Barangays failed");
        return r.json() as Promise<PsgcRow[]>;
      })
      .then((data) => {
        if (cancel) return;
        setBrgys(data);

        const prov = provinces.find((p) => p.code === provCode);
        const city = cities.find((c) => c.code === cityCode);
        const alignWithUrl =
          !!prov &&
          !!city &&
          !!initial.province &&
          !!initial.city &&
          norm(prov.name) === norm(initial.province) &&
          norm(city.name) === norm(initial.city);

        let nextBrgy = "";
        if (alignWithUrl && initial.brgy) {
          const b = data.find((x) => norm(x.name) === norm(initial.brgy));
          if (b) nextBrgy = b.code;
        }
        setBrgyCode(nextBrgy);
      })
      .catch(() => {
        if (!cancel) setGeoError("Could not load barangays.");
      })
      .finally(() => {
        if (!cancel) setLoadingB(false);
      });

    return () => {
      cancel = true;
    };
  }, [
    cityCode,
    cities,
    initial.brgy,
    initial.city,
    initial.province,
    provCode,
    provinces,
  ]);

  useEffect(() => {
    const province = provinces.find((x) => x.code === provCode)?.name ?? "";
    const city = cities.find((x) => x.code === cityCode)?.name ?? "";
    const brgy = brgys.find((x) => x.code === brgyCode)?.name ?? "";
    schedule(() => onNamesChange({ province, city, brgy }));
  }, [
    brgyCode,
    brgys,
    cityCode,
    cities,
    onNamesChange,
    provCode,
    provinces,
  ]);

  const onProvinceChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      setProvCode(v);
      setCityCode("");
      setBrgyCode("");
      setCities([]);
      setBrgys([]);
    },
    []
  );

  const onCityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      setCityCode(v);
      setBrgyCode("");
      setBrgys([]);
    },
    []
  );

  return (
    <div className={cn("space-y-4", className)}>
      {geoError && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {geoError}
        </p>
      )}

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Province
        </h3>
        <select
          value={provCode}
          disabled={loadingP}
          onChange={onProvinceChange}
          className={selectClass}
          aria-label="Province"
        >
          <option value="">
            {loadingP ? "Loading provinces…" : "All provinces"}
          </option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          City / municipality
        </h3>
        <select
          value={cityCode}
          disabled={!provCode || loadingC}
          onChange={onCityChange}
          className={selectClass}
          aria-label="City or municipality"
        >
          <option value="">
            {!provCode
              ? "Select province first"
              : loadingC
                ? "Loading…"
                : "All cities"}
          </option>
          {cities.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Barangay
        </h3>
        <select
          value={brgyCode}
          disabled={!cityCode || loadingB}
          onChange={(e) => setBrgyCode(e.target.value)}
          className={selectClass}
          aria-label="Barangay"
        >
          <option value="">
            {!cityCode
              ? "Select city first"
              : loadingB
                ? "Loading…"
                : "All barangays"}
          </option>
          {brgys.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}
