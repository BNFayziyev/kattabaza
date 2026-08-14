import { useCallback, useEffect, useState } from "react";

const EMPTY = {
  loading: true,
  ipv4: "",
  ipv6: "",
  city: "",
  region: "",
  countryName: "",
  countryCode: "",
  postal: "",
  latitude: null,
  longitude: null,
  timezone: "",
  utcOffset: "",
  callingCode: "",
  currency: "",
  currencyName: "",
  languages: "",
  org: "",
  asn: "",
};

async function fetchIpWhoIs() {
  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();
    if (!data?.success) return null;
    return {
      ip: data.ip || "",
      city: data.city || "",
      region: data.region || "",
      countryName: data.country || "",
      countryCode: data.country_code || "",
      postal: data.postal || "",
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
      timezone: data.timezone?.id || "",
      utcOffset: data.timezone?.utc || "",
      callingCode: data.calling_code || "",
      currency: "",
      currencyName: "",
      languages: "",
      org: data.connection?.isp || data.connection?.org || "",
      asn: data.connection?.asn ? String(data.connection.asn) : "",
    };
  } catch {
    return null;
  }
}

async function fetchIpapiCo() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    if (data?.error) return null;
    return {
      ip: data.ip || "",
      city: data.city || "",
      region: data.region || "",
      countryName: data.country_name || "",
      countryCode: data.country_code || "",
      postal: data.postal || "",
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
      timezone: data.timezone || "",
      utcOffset: data.utc_offset || "",
      callingCode: data.country_calling_code || "",
      currency: data.currency || "",
      currencyName: data.currency_name || "",
      languages: data.languages || "",
      org: data.org || "",
      asn: data.asn || "",
    };
  } catch {
    return null;
  }
}

async function fetchSelfDetails() {
  return (await fetchIpWhoIs()) || (await fetchIpapiCo());
}

async function fetchIpVersion(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data?.ip || "";
  } catch {
    return "";
  }
}

export function useIpInfo() {
  const [ipInfo, setIpInfo] = useState(EMPTY);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIpInfo((prev) => ({ ...prev, loading: true }));

      const [details, ipv4, ipv6] = await Promise.all([
        fetchSelfDetails(),
        fetchIpVersion("https://api.ipify.org?format=json"),
        fetchIpVersion("https://api64.ipify.org?format=json"),
      ]);

      if (cancelled) return;

      const d = details || {};
      const fallbackIp = d.ip || "";

      setIpInfo({
        loading: false,
        ipv4: ipv4 || (!fallbackIp.includes(":") ? fallbackIp : ""),
        ipv6: ipv6 || (fallbackIp.includes(":") ? fallbackIp : ""),
        city: d.city || "",
        region: d.region || "",
        countryName: d.countryName || "",
        countryCode: d.countryCode || "",
        postal: d.postal || "",
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        timezone: d.timezone || "",
        utcOffset: d.utcOffset || "",
        callingCode: d.callingCode || "",
        currency: d.currency || "",
        currencyName: d.currencyName || "",
        languages: d.languages || "",
        org: d.org || "",
        asn: d.asn || "",
      });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { ...ipInfo, refresh };
}
