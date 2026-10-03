/**
 * MikroTik (RouterOS) sozlamalar generatori.
 *
 * Formadagi qiymatlardan terminal skriptini (.rsc) va Winbox'dagi qadamlarni tuzadi.
 * Hammasi brauzerda hisoblanadi — hech narsa serverga yuborilmaydi.
 * Matnlar `mikrotikI18n.js` da; bu fayl faqat buyruqlar va mantiq.
 */

// Model tanlansa — portlar soni, SFP nomi va Wi-Fi drayveri o'zi qo'yiladi
export const MODELS = [
  { id: "hap-ax", name: "hAP ax2 / ax3", ports: 5, sfp: "", wifi: "wifi", v7: true },
  { id: "hap-ax-lite", name: "hAP ax lite", ports: 4, sfp: "", wifi: "wifi", v7: true },
  { id: "hap-ac", name: "hAP ac2 / ac lite", ports: 5, sfp: "", wifi: "wireless" },
  { id: "hap-lite", name: "hAP lite", ports: 4, sfp: "", wifi: "wireless" },
  { id: "hex", name: "hEX (RB750Gr3)", ports: 5, sfp: "", wifi: "" },
  { id: "hex-s", name: "hEX S", ports: 5, sfp: "sfp1", wifi: "" },
  { id: "l009", name: "L009UiGS", ports: 8, sfp: "sfp1", wifi: "", v7: true },
  { id: "rb5009", name: "RB5009", ports: 8, sfp: "sfp-sfpplus1", wifi: "", v7: true },
  { id: "rb4011", name: "RB4011", ports: 10, sfp: "sfp-sfpplus1", wifi: "" },
  { id: "rb3011", name: "RB3011", ports: 10, sfp: "sfp1", wifi: "" },
  { id: "custom", name: "", ports: 5, sfp: "", wifi: "" },
];

export const PORT_COUNTS = [1, 2, 3, 4, 5, 8, 10, 13, 24];
export const SFP_NAMES = ["", "sfp1", "sfp-sfpplus1", "combo1"];
export const TIMEZONES = [
  "Asia/Tashkent",
  "Asia/Samarkand",
  "Asia/Almaty",
  "Asia/Bishkek",
  "Asia/Dushanbe",
  "Asia/Ashgabat",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Asia/Dubai",
  "UTC",
];
export const COUNTRIES = ["", "uzbekistan", "kazakhstan", "kyrgyzstan", "tajikistan"];
export const LEASE_TIMES = ["30m", "1h", "8h", "1d", "3d", "7d"];

export const DEFAULT_FORM = {
  model: "hap-ac",
  ports: 5,
  sfp: "",
  version: "v7",
  identity: "KattaBaza",
  timezone: "Asia/Tashkent",

  wanPort: "ether1",
  wanType: "dhcp", // dhcp | static | pppoe
  wanVlan: "",
  wanMac: "",
  staticIp: "",
  staticMask: "24",
  staticGw: "",
  pppoeUser: "",
  pppoePass: "",
  pppoeService: "",
  pppoeMtu: "",
  dnsMode: "custom", // isp | custom
  dnsServers: "1.1.1.1, 8.8.8.8",

  lanExclude: [],
  lanIp: "192.168.88.1",
  lanPrefix: 24,
  dhcpServer: true,
  poolStart: "",
  poolEnd: "",
  leaseTime: "1d",

  wifi: true,
  wifiDriver: "wireless", // wireless (eski) | wifi (v7, ax)
  ssid: "KattaBaza",
  wifiPass: "",
  country: "uzbekistan",

  firewall: true,
  harden: true,
  adminUser: "admin",
  adminPass: "",
  wanWinbox: false,
  wanWinboxFrom: "",

  forwards: [],
  queue: false,
  queueDown: "50",
  queueUp: "20",
  ddns: false,
  ntp: true,
  backup: true,
};

// Brauzerda saqlanmaydigan maydonlar (parollar)
export const SECRET_FIELDS = ["pppoePass", "wifiPass", "adminPass"];

export const FILE_NAME = "kattabaza.rsc";
const WAN_LABEL = { dhcp: "DHCP", static: "Static IP", pppoe: "PPPoE" };

// ------------------------------------------------------------------ portlar

export function portsOf(f) {
  const list = Array.from({ length: Number(f.ports) || 1 }, (_, i) => `ether${i + 1}`);
  if (f.sfp) list.push(f.sfp);
  return list;
}

export function lanPortsOf(f) {
  return portsOf(f).filter((p) => p !== f.wanPort && !f.lanExclude.includes(p));
}

// ------------------------------------------------------------------ IPv4

const OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IP_RE = new RegExp(`^${OCTET}(\\.${OCTET}){3}$`);

export const isIp = (s) => IP_RE.test(String(s || "").trim());
// Bitli amallar 32-bitda ishorani buzadi — oddiy arifmetika
const toInt = (ip) => ip.trim().split(".").reduce((a, o) => a * 256 + Number(o), 0);
const toIp = (n) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");

/** "24", "/24" yoki "255.255.255.0" -> 24 */
export function parsePrefix(mask) {
  const s = String(mask || "").trim().replace(/^\//, "");
  if (/^\d{1,2}$/.test(s)) {
    const n = Number(s);
    return n >= 1 && n <= 32 ? n : null;
  }
  if (!isIp(s)) return null;
  const bits = toInt(s).toString(2).padStart(32, "0");
  if (!/^1+0*$/.test(bits)) return null;
  return bits.indexOf("0") === -1 ? 32 : bits.indexOf("0");
}

export function prefixToMask(prefix) {
  return toIp(2 ** 32 - 2 ** (32 - prefix));
}

function subnet(ip, prefix) {
  const size = 2 ** (32 - prefix);
  const net = Math.floor(toInt(ip) / size) * size;
  return { net, bcast: net + size - 1, size };
}

const inSubnet = (ip, s) => isIp(ip) && toInt(ip) >= s.net && toInt(ip) <= s.bcast;

function ipList(text) {
  const items = String(text || "").split(/[\s,;]+/).filter(Boolean);
  return { items, ok: items.length > 0 && items.every(isIp) };
}

/** Bo'sh qoldirilgan pul chegaralari uchun avtomatik qiymat (formada placeholder) */
export function autoPool(ipText, prefix) {
  if (!isIp(ipText) || prefix < 8 || prefix > 30) return { start: "", end: "" };
  const s = subnet(ipText, prefix);
  return { start: toIp(s.net + (s.size - 2 > 40 ? 10 : 2)), end: toIp(s.bcast - 1) };
}

const MAC_RE = /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i;

// RouterOS satri: \ " $ ? qochiriladi (? terminalda yordamni ochib yuboradi)
const str = (s) => `"${String(s).replace(/[\\"$?]/g, (c) => "\\" + c)}"`;

// ------------------------------------------------------------------ generator

/**
 * @param f   forma qiymatlari (DEFAULT_FORM shaklida)
 * @param tm  tanlangan til matnlari (mikrotikI18n.getMikrotikText)
 * @returns {{ sections, warnings, script, invalid }}
 *   sections: [{ id, code, steps, script }] — script:false bo'lsa .rsc faylga kirmaydi
 *   invalid:  formadagi xato maydonlar (qizil chegarali bo'ladi)
 */
export function buildConfig(f, tm) {
  const v7 = f.version === "v7";
  const warnings = [];
  const invalid = new Set();
  const sections = [];
  const S = tm.steps;
  const bad = (field, text, level = "error") => {
    if (field) invalid.add(field);
    warnings.push({ level, text });
  };
  const add = (id, lines, steps, script = true) =>
    sections.push({ id, code: lines.filter((l) => l !== null && l !== undefined && l !== false).join("\n"), steps, script });

  const bridge = "bridge";
  const lanPorts = lanPortsOf(f);
  const driver = v7 ? f.wifiDriver : "wireless";

  // ---------- LAN manzillari
  const lanOk = isIp(f.lanIp) && f.lanPrefix >= 8 && f.lanPrefix <= 30;
  const lanIp = lanOk ? f.lanIp.trim() : "192.168.88.1";
  const prefix = lanOk ? Number(f.lanPrefix) : 24;
  const L = subnet(lanIp, prefix);
  if (!lanOk || toInt(lanIp) === L.net || toInt(lanIp) === L.bcast) bad("lanIp", tm.warn.lanIp);
  const lanNet = `${toIp(L.net)}/${prefix}`;
  const lanAddr = `${lanIp}/${prefix}`;

  // ---------- DNS
  const wantCustomDns = f.dnsMode === "custom" || f.wanType === "static";
  const dns = ipList(f.dnsServers);
  if (wantCustomDns && !dns.ok) bad("dnsServers", tm.warn.dns);
  const dnsServers = wantCustomDns ? (dns.ok ? dns.items : ["1.1.1.1", "8.8.8.8"]) : [];
  // Firewall o'chiq bo'lsa router DNS'ini tashqariga ochmaymiz (ochiq resolver bo'lib qoladi)
  const dnsRemote = f.firewall;

  // ---------- 0. Tayyorgarlik (faylga kirmaydi)
  add(
    "prep",
    [
      "# 1) " + tm.code.resetHint,
      "/system reset-configuration no-defaults=yes skip-backup=yes",
      "",
      "# 2) " + tm.code.importHint,
      `/import file-name=${FILE_NAME}`,
    ],
    S.prep({ wan: f.wanPort, lan: lanPorts[0] || "ether2", file: FILE_NAME }),
    false
  );

  // ---------- 1. Router nomi
  const identity = (f.identity || "").trim() || "MikroTik";
  add("identity", ["/system identity", `set name=${str(identity)}`], S.identity({ name: identity }));

  // ---------- 2. Bridge va LAN portlari
  if (lanPorts.length === 0 && !f.wifi) bad(null, tm.warn.noLan);
  add(
    "bridge",
    [
      "/interface bridge",
      `add name=${bridge} comment="KattaBaza: LAN"`,
      lanPorts.length ? "/interface bridge port" : null,
      ...lanPorts.map((p) => `add bridge=${bridge} interface=${p}`),
    ],
    S.bridge({ bridge, ports: lanPorts })
  );

  // ---------- 3. Internet (WAN)
  const wanLines = [];
  const wanSteps = [];
  let wanBase = f.wanPort;

  if (f.wanMac.trim()) {
    if (!MAC_RE.test(f.wanMac.trim())) bad("wanMac", tm.warn.mac);
    const mac = f.wanMac.trim().replace(/-/g, ":").toUpperCase();
    wanLines.push("/interface ethernet", `set [find default-name=${f.wanPort}] mac-address=${mac}`);
    wanSteps.push(...S.wanMac({ port: f.wanPort, mac }));
  }

  if (String(f.wanVlan).trim()) {
    const id = Number(f.wanVlan);
    const okVlan = Number.isInteger(id) && id >= 1 && id <= 4094;
    if (!okVlan) bad("wanVlan", tm.warn.vlan);
    const vid = okVlan ? id : "<VLAN>";
    const name = `vlan${vid}-wan`;
    wanLines.push("/interface vlan", `add name=${name} interface=${f.wanPort} vlan-id=${vid} comment="KattaBaza: WAN"`);
    wanSteps.push(...S.wanVlan({ port: f.wanPort, vlan: vid, name }));
    wanBase = name;
  }

  let wanIf = wanBase;
  if (f.wanType === "dhcp") {
    const peer = !wantCustomDns;
    wanLines.push(
      "/ip dhcp-client",
      `add interface=${wanBase} use-peer-dns=${peer ? "yes" : "no"} add-default-route=yes disabled=no comment="KattaBaza: WAN"`
    );
    wanSteps.push(...S.wanDhcp({ iface: wanBase, peer }));
  } else if (f.wanType === "static") {
    const p = parsePrefix(f.staticMask);
    if (!isIp(f.staticIp)) bad("staticIp", tm.warn.staticIp);
    if (!p || p > 31) bad("staticMask", tm.warn.staticMask);
    if (!isIp(f.staticGw)) bad("staticGw", tm.warn.staticGw);
    const ip = isIp(f.staticIp) ? f.staticIp.trim() : "<IP>";
    const pre = p && p <= 31 ? p : "<MASK>";
    const gw = isIp(f.staticGw) ? f.staticGw.trim() : "<GATEWAY>";
    if (isIp(f.staticIp) && isIp(f.staticGw) && p && p <= 31) {
      const W = subnet(ip, p);
      if (!inSubnet(gw, W)) bad("staticGw", tm.warn.gwOutside, "warn");
      if (W.net <= L.bcast && L.net <= W.bcast) bad("lanIp", tm.warn.overlap);
    }
    wanLines.push(
      "/ip address",
      `add address=${ip}/${pre} interface=${wanBase} comment="KattaBaza: WAN"`,
      "/ip route",
      `add dst-address=0.0.0.0/0 gateway=${gw} comment="KattaBaza: WAN"`
    );
    wanSteps.push(...S.wanStatic({ iface: wanBase, addr: `${ip}/${pre}`, gw }));
  } else {
    wanIf = "pppoe-out1";
    const user = f.pppoeUser.trim();
    if (!user) bad("pppoeUser", tm.warn.pppoeUser);
    if (!f.pppoePass) bad("pppoePass", tm.warn.pppoePass);
    const mtu = String(f.pppoeMtu).trim();
    const mtuOk = !mtu || (/^\d+$/.test(mtu) && Number(mtu) >= 576 && Number(mtu) <= 1500);
    if (!mtuOk) bad("pppoeMtu", tm.warn.mtu);
    const peer = !wantCustomDns;
    const parts = [
      `add name=${wanIf} interface=${wanBase}`,
      `user=${str(user || "<LOGIN>")}`,
      `password=${str(f.pppoePass || "<PASSWORD>")}`,
      f.pppoeService.trim() ? `service-name=${str(f.pppoeService.trim())}` : null,
      mtu && mtuOk ? `max-mtu=${mtu} max-mru=${mtu}` : null,
      `add-default-route=yes use-peer-dns=${peer ? "yes" : "no"} disabled=no comment="KattaBaza: WAN"`,
    ];
    wanLines.push("/interface pppoe-client", parts.filter(Boolean).join(" "));
    wanSteps.push(
      ...S.wanPppoe({ iface: wanBase, user: user || "…", service: f.pppoeService.trim(), mtu: mtu && mtuOk ? mtu : "", peer })
    );
  }
  add("wan", wanLines, wanSteps);

  // ---------- 4. Lokal tarmoq (LAN) va DHCP server
  const lanLines = ["/ip address", `add address=${lanAddr} interface=${bridge} network=${toIp(L.net)} comment="KattaBaza: LAN"`];
  const lanSteps = [...S.lan({ bridge, addr: lanAddr })];
  if (f.dhcpServer) {
    const auto = autoPool(lanIp, prefix);
    const pick = (val, fallback, field) => {
      const v = String(val || "").trim();
      if (!v) return fallback;
      if (inSubnet(v, L) && toInt(v) !== L.net && toInt(v) !== L.bcast) return v;
      bad(field, tm.warn.pool);
      return fallback;
    };
    let start = toInt(pick(f.poolStart, auto.start, "poolStart"));
    let end = toInt(pick(f.poolEnd, auto.end, "poolEnd"));
    if (start > end) {
      bad("poolEnd", tm.warn.pool);
      start = toInt(auto.start);
      end = toInt(auto.end);
    }
    // Router manzili pul ichiga tushsa — uni chetlab o'tamiz
    const me = toInt(lanIp);
    const ranges = [];
    if (me < start || me > end) ranges.push([start, end]);
    else {
      if (me - 1 >= start) ranges.push([start, me - 1]);
      if (me + 1 <= end) ranges.push([me + 1, end]);
    }
    const pool = ranges.map(([a, b]) => (a === b ? toIp(a) : `${toIp(a)}-${toIp(b)}`)).join(",");
    const clientDns = dnsRemote ? lanIp : (dnsServers.length ? dnsServers : ["1.1.1.1", "8.8.8.8"]).join(",");
    lanLines.push(
      "/ip pool",
      `add name=lan-pool ranges=${pool}`,
      "/ip dhcp-server",
      `add name=lan-dhcp interface=${bridge} address-pool=lan-pool lease-time=${f.leaseTime} disabled=no`,
      "/ip dhcp-server network",
      `add address=${lanNet} gateway=${lanIp} dns-server=${clientDns} comment="KattaBaza: LAN"`
    );
    lanSteps.push(...S.dhcpServer({ bridge, net: lanNet, gw: lanIp, pool, dns: clientDns, lease: f.leaseTime }));
  }
  add("lan", lanLines, lanSteps);

  // ---------- 5. Interfeys ro'yxatlari (WAN / LAN) — firewall shularga tayanadi
  add(
    "lists",
    [
      "/interface list",
      `add name=WAN comment="KattaBaza"`,
      `add name=LAN comment="KattaBaza"`,
      "/interface list member",
      `add list=WAN interface=${wanIf}`,
      `add list=LAN interface=${bridge}`,
    ],
    S.lists({ wan: wanIf, lan: bridge })
  );

  // ---------- 6. DNS
  add(
    "dns",
    [
      "/ip dns",
      `set ${dnsServers.length ? `servers=${dnsServers.join(",")} ` : ""}allow-remote-requests=${dnsRemote ? "yes" : "no"}`,
      dnsRemote ? "/ip dns static" : null,
      dnsRemote ? `add name=router.lan address=${lanIp} comment="KattaBaza"` : null,
    ],
    S.dns({ servers: dnsServers.join(", "), remote: dnsRemote, ip: lanIp })
  );

  // ---------- 7. NAT (internetni LAN'ga tarqatish)
  add(
    "nat",
    ["/ip firewall nat", `add chain=srcnat out-interface-list=WAN action=masquerade comment="KattaBaza: LAN -> internet"`],
    S.nat()
  );

  // ---------- 8. Firewall
  // Navbat (queue) bo'lsa FastTrack qo'yilmaydi — aks holda tezlik cheklovi ishlamaydi
  const queueOn = f.queue;
  const winboxIps = ipList(f.wanWinboxFrom);
  if (f.wanWinbox && !winboxIps.ok) bad("wanWinboxFrom", tm.warn.winboxIps);
  const winboxWan = f.wanWinbox && winboxIps.ok;

  if (f.firewall) {
    const rules = [
      ["input", "action=accept connection-state=established,related,untracked", "accept established,related,untracked"],
      ["input", "action=drop connection-state=invalid", "drop invalid"],
      ["input", "action=accept protocol=icmp", "accept ICMP"],
      v7 ? ["input", "action=accept dst-address=127.0.0.1", "accept to local loopback"] : null,
      winboxWan
        ? ["input", "action=accept protocol=tcp dst-port=8291 in-interface-list=WAN src-address-list=winbox-remote", "Winbox from allowed IPs"]
        : null,
      ["input", "action=drop in-interface-list=!LAN", "drop all not coming from LAN"],
      ["forward", "action=accept ipsec-policy=in,ipsec", "accept in ipsec policy"],
      ["forward", "action=accept ipsec-policy=out,ipsec", "accept out ipsec policy"],
      queueOn
        ? null
        : ["forward", `action=fasttrack-connection connection-state=established,related${v7 ? " hw-offload=yes" : ""}`, "fasttrack"],
      ["forward", "action=accept connection-state=established,related,untracked", "accept established,related,untracked"],
      ["forward", "action=drop connection-state=invalid", "drop invalid"],
      ["forward", "action=drop connection-state=new connection-nat-state=!dstnat in-interface-list=WAN", "drop all from WAN not DSTNATed"],
    ].filter(Boolean);
    add(
      "firewall",
      [
        winboxWan ? "/ip firewall address-list" : null,
        ...(winboxWan ? winboxIps.items.map((ip) => `add list=winbox-remote address=${ip} comment="KattaBaza"`) : []),
        "/ip firewall filter",
        ...rules.map(([chain, body, c]) => `add chain=${chain} ${body} comment="KattaBaza: ${c}"`),
      ],
      [
        ...S.firewall({ fasttrack: !queueOn }),
        ...rules.map(([chain, body]) => `\`${chain}\` · ${body.replace(/^action=(\S+)\s*/, "")} → **${body.match(/^action=(\S+)/)[1]}**`),
        ...(winboxWan ? S.winboxWan({ ips: winboxIps.items.join(", ") }) : []),
      ]
    );
  } else {
    bad(null, tm.warn.noFirewall, "warn");
    if (f.wanWinbox) bad(null, tm.warn.winboxNoFirewall, "warn");
  }

  // ---------- 9. Port ochish (dst-nat)
  const fw = f.forwards.filter((r) => r.ext || r.ip || r.int);
  if (fw.length) {
    const lines = ["/ip firewall nat"];
    const list = [];
    fw.forEach((r, i) => {
      const n = i + 1;
      const ext = String(r.ext).trim();
      const intPort = String(r.int).trim() || ext;
      const portRe = /^\d{1,5}(-\d{1,5})?$/;
      const okPorts = portRe.test(ext) && portRe.test(intPort);
      if (!okPorts || !isIp(r.ip)) bad(`fwd${i}`, tm.warn.forward(n));
      else if (!inSubnet(r.ip, L)) bad(`fwd${i}`, tm.warn.forwardOutside(n), "warn");
      const ip = isIp(r.ip) ? r.ip.trim() : "<IP>";
      const name = String(r.name || "").replace(/[^\w .:-]/g, "").trim() || `port ${ext}`;
      const protos = r.proto === "both" ? ["tcp", "udp"] : [r.proto];
      protos.forEach((p) =>
        lines.push(
          `add chain=dstnat action=dst-nat in-interface-list=WAN protocol=${p} dst-port=${ext || "<PORT>"} to-addresses=${ip} to-ports=${intPort || "<PORT>"} comment=${str("KattaBaza: " + name)}`
        )
      );
      list.push(`\`${r.proto === "both" ? "tcp+udp" : r.proto} ${ext || "?"}\` → \`${ip}:${intPort || "?"}\`${r.name ? ` (${r.name})` : ""}`);
    });
    add("forwards", lines, [...S.forwards(), ...list]);
  }

  // ---------- 10. Wi-Fi
  if (f.wifi) {
    const ssid = f.ssid.trim();
    if (!ssid) bad("ssid", tm.warn.ssid);
    if (f.wifiPass.length < 8) bad("wifiPass", tm.warn.wifiPass);
    const pass = f.wifiPass.length >= 8 ? f.wifiPass : "<PASSWORD-8+>";
    const ssidS = str(ssid || "KattaBaza");
    if (driver === "wifi") {
      const country = f.country ? f.country[0].toUpperCase() + f.country.slice(1) : "";
      add(
        "wifi",
        [
          "/interface wifi",
          `set [find] configuration.mode=ap configuration.ssid=${ssidS} security.authentication-types=wpa2-psk,wpa3-psk security.passphrase=${str(pass)} disabled=no`,
          country ? `:do {/interface wifi set [find] configuration.country=${country}} on-error={}` : null,
          `:foreach i in=[/interface wifi find] do={/interface bridge port add bridge=${bridge} interface=[/interface wifi get $i name]}`,
        ],
        S.wifiNew({ ssid: ssid || "KattaBaza", bridge })
      );
    } else {
      add(
        "wifi",
        [
          "/interface wireless security-profiles",
          `add name=kattabaza mode=dynamic-keys authentication-types=wpa2-psk unicast-ciphers=aes-ccm group-ciphers=aes-ccm wpa2-pre-shared-key=${str(pass)}`,
          "/interface wireless",
          `set [find] mode=ap-bridge ssid=${ssidS} security-profile=kattabaza frequency=auto wps-mode=disabled disabled=no`,
          f.country ? `:do {/interface wireless set [find] country=${f.country}} on-error={}` : null,
          "# 2.4 GHz -> b/g/n, 5 GHz -> a/n/ac (old cards: a/n)",
          ":foreach i in=[/interface wireless find] do={",
          '  :if ([/interface wireless get $i band] ~ "2ghz") do={',
          "    /interface wireless set $i band=2ghz-b/g/n channel-width=20/40mhz-XX",
          "  } else={",
          "    :do {/interface wireless set $i band=5ghz-a/n/ac channel-width=20/40/80mhz-XXXX} on-error={/interface wireless set $i band=5ghz-a/n channel-width=20/40mhz-XX}",
          "  }",
          `  /interface bridge port add bridge=${bridge} interface=[/interface wireless get $i name]`,
          "}",
        ],
        S.wifiLegacy({ ssid: ssid || "KattaBaza", bridge })
      );
    }
  }

  // ---------- 11. Tezlik cheklovi
  if (queueOn) {
    const num = (v) => /^\d+(\.\d+)?$/.test(String(v).trim()) && Number(v) > 0;
    if (!num(f.queueDown)) bad("queueDown", tm.warn.queue);
    if (!num(f.queueUp)) bad("queueUp", tm.warn.queue);
    const down = num(f.queueDown) ? `${String(f.queueDown).trim()}M` : "<DOWN>M";
    const up = num(f.queueUp) ? `${String(f.queueUp).trim()}M` : "<UP>M";
    add(
      "queue",
      ["/queue simple", `add name=lan-limit target=${lanNet} max-limit=${up}/${down} comment="KattaBaza: LAN speed limit"`],
      S.queue({ target: lanNet, up, down })
    );
  }

  // ---------- 12. Xizmatlarni yopish
  if (f.harden) {
    const winboxFrom = [lanNet, ...(winboxWan ? winboxIps.items : [])].join(",");
    add(
      "services",
      [
        "/ip service",
        "set telnet disabled=yes",
        "set ftp disabled=yes",
        "set api disabled=yes",
        "set api-ssl disabled=yes",
        `set www address=${lanNet}`,
        `set ssh address=${lanNet}`,
        `set winbox address=${winboxFrom}`,
        "/ip neighbor discovery-settings",
        "set discover-interface-list=LAN",
        "/tool mac-server",
        "set allowed-interface-list=LAN",
        "/tool mac-server mac-winbox",
        "set allowed-interface-list=LAN",
        "/tool bandwidth-server",
        "set enabled=no",
        "/ip ssh",
        "set strong-crypto=yes",
      ],
      S.services({ net: lanNet, winbox: winboxFrom })
    );
  }

  // ---------- 13. Vaqt
  add(
    "time",
    [
      "/system clock",
      `set time-zone-autodetect=no time-zone-name=${f.timezone}`,
      f.ntp ? "/system ntp client" : null,
      f.ntp
        ? v7
          ? "set enabled=yes servers=0.pool.ntp.org,1.pool.ntp.org"
          : "set enabled=yes server-dns-names=0.pool.ntp.org,1.pool.ntp.org"
        : null,
    ],
    S.time({ tz: f.timezone, ntp: f.ntp })
  );

  // ---------- 14. Administrator
  const user = (f.adminUser || "").trim() || "admin";
  if (!/^[\w.-]+$/.test(user)) bad("adminUser", tm.warn.adminUser);
  // Parolsiz foydalanuvchi qo'shmaymiz — bo'lim parol kiritilgandagina chiqadi
  if (!f.adminPass) bad("adminPass", tm.warn.adminPass, user === "admin" ? "warn" : "error");
  else if (f.adminPass.length < 8) bad("adminPass", tm.warn.adminWeak, "warn");
  if (f.adminPass) {
    const pass = f.adminPass;
    add(
      "users",
      user === "admin"
        ? ["/user", `set [find name=admin] password=${str(pass)}`]
        : [
            "/user",
            `add name=${user} group=full password=${str(pass)} comment="KattaBaza"`,
            "# " + tm.code.disableAdmin,
            "# /user disable [find name=admin]",
          ],
      user === "admin" ? S.userSet() : S.userAdd({ name: user })
    );
  }

  // ---------- 15. MikroTik Cloud (DDNS)
  if (f.ddns) add("cloud", ["/ip cloud", "set ddns-enabled=yes"], S.cloud());

  // ---------- 16. Zaxira nusxa
  if (f.backup) {
    add(
      "backup",
      ["/system backup", "save name=kattabaza-start dont-encrypt=yes", "/export file=kattabaza-start"],
      S.backup({ name: "kattabaza-start" })
    );
  }

  // ---------- Tekshirish (faylga kirmaydi)
  add(
    "check",
    [
      "/ping 8.8.8.8 count=4",
      "/ping google.com count=4",
      f.wanType === "pppoe" ? "/interface pppoe-client monitor pppoe-out1 once" : null,
      f.wanType === "dhcp" ? "/ip dhcp-client print" : null,
      "/ip dhcp-server lease print",
    ],
    S.check(),
    false
  );

  // ---------- To'liq .rsc fayl
  const model = MODELS.find((m) => m.id === f.model);
  const head = [
    `# KattaBaza - MikroTik setup (${new Date().toISOString().slice(0, 10)})`,
    `# RouterOS ${f.version}${model?.name ? " | " + model.name : ""} | WAN: ${f.wanPort} (${WAN_LABEL[f.wanType]}) | LAN: ${lanAddr}`,
    "# " + tm.code.emptyOnly,
    "#   /system reset-configuration no-defaults=yes skip-backup=yes",
    `#   /import file-name=${FILE_NAME}`,
    "",
  ];
  let n = 0;
  const body = sections
    .filter((s) => s.script)
    .map((s) => `# ---------- ${++n}. ${tm.codeTitle[s.id]}\n${s.code}`);
  const script = [...head, body.join("\n\n"), ""].join("\n");

  return { sections, warnings, script, invalid };
}
