/**
 * MikroTik bo'limi matnlari (EN / UZ / RU).
 *
 * Winbox menyu nomlari inglizcha qoladi — interfeysning o'zi inglizcha.
 * Qadamlar ichida: `kod` va **qalin** — MikrotikPanel shularni chizadi.
 * `code` va `codeTitle` .rsc faylga yoziladi, shuning uchun faqat ASCII.
 */

const c = (s) => "`" + s + "`";
const cs = (list) => list.map(c).join(", ");

// ------------------------------------------------------------------ FAQ buyruqlari (hamma tilda bir xil)

export const FAQ = [
  { id: "defaultLogin" },
  { id: "winbox" },
  { id: "reset", code: "/system reset-configuration no-defaults=yes skip-backup=yes" },
  { id: "apply", code: "/import file-name=kattabaza.rsc" },
  {
    id: "runAfterReset",
    code: "/system reset-configuration no-defaults=yes skip-backup=yes run-after-reset=kattabaza.rsc",
  },
  { id: "safeMode" },
  { id: "lostAccess" },
  {
    id: "noInternet",
    code: [
      "/ping 8.8.8.8 count=4",
      "/ping google.com count=4",
      "/ip route print where dst-address=0.0.0.0/0",
      "/ip firewall nat print",
    ].join("\n"),
  },
  {
    id: "pppoe",
    code: ["/interface pppoe-client monitor pppoe-out1", '/log print where topics~"pppoe"'].join("\n"),
  },
  {
    id: "mtu",
    code: [
      "/interface pppoe-client set pppoe-out1 max-mtu=1480 max-mru=1480",
      "/ip firewall mangle add chain=forward protocol=tcp tcp-flags=syn action=change-mss new-mss=clamp-to-pmtu passthrough=yes out-interface=pppoe-out1",
    ].join("\n"),
  },
  { id: "greyIp", code: "/ip address print" },
  {
    id: "devices",
    code: ["/ip dhcp-server lease print", "/ip arp print", "/interface wireless registration-table print"].join("\n"),
  },
  { id: "staticLease", code: "/ip dhcp-server lease make-static [find address=192.168.88.50]" },
  {
    id: "portForward",
    code: '/ip firewall nat add chain=srcnat src-address=192.168.88.0/24 dst-address=192.168.88.0/24 out-interface=bridge action=masquerade comment="hairpin NAT"',
  },
  {
    id: "speedDevice",
    code: [
      "/queue simple add name=phone target=192.168.88.50/32 max-limit=5M/10M",
      "/ip firewall filter disable [find action=fasttrack-connection]",
    ].join("\n"),
  },
  {
    id: "blockSite",
    code: [
      "/ip dns static add name=tiktok.com type=NXDOMAIN match-subdomain=yes",
      '/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=udp dst-port=53 action=redirect to-ports=53 comment="force router DNS"',
    ].join("\n"),
  },
  {
    id: "update",
    code: [
      "/system package update set channel=stable",
      "/system package update check-for-updates",
      "/system package update install",
      "# after reboot:",
      "/system routerboard upgrade",
      "/system reboot",
    ].join("\n"),
  },
  { id: "forgotPassword" },
  {
    id: "backup",
    code: [
      "/system backup save name=mybackup dont-encrypt=yes",
      "/export file=myconfig",
      "/system backup load name=mybackup.backup",
    ].join("\n"),
  },
  {
    id: "logs",
    code: ["/log print", "/log print follow", '/log print where topics~"error|critical"'].join("\n"),
  },
  { id: "doubleNat" },
  {
    id: "failover",
    code: [
      "/interface bridge port remove [find interface=ether2]",
      "/interface list member add list=WAN interface=ether2",
      "/ip address add address=192.168.2.10/24 interface=ether2",
      "/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1 distance=1 check-gateway=ping comment=ISP1",
      "/ip route add dst-address=0.0.0.0/0 gateway=192.168.2.1 distance=2 comment=ISP2",
    ].join("\n"),
  },
  {
    id: "scheduleReboot",
    code: '/system scheduler add name=night-reboot start-time=04:00:00 interval=1d on-event="/system reboot"',
  },
  { id: "versions", code: "/system resource print" },
  { id: "wifiInvisible", code: ["/interface wireless print", "/interface wireless enable [find]"].join("\n") },
  { id: "remoteAccess" },
  { id: "dnsFlush", code: "/ip dns cache flush" },
  { id: "changePass", code: '/user set [find name=admin] password="NEW-PASSWORD"' },
  {
    id: "slowSpeed",
    code: [
      "/system resource print",
      "/tool profile duration=10s",
      "/ip firewall filter print where action=fasttrack-connection",
    ].join("\n"),
  },
];

// .rsc ichidagi izohlar — faqat ASCII (RouterOS terminali UTF-8 ni yaxshi ko'rmaydi)
const CODE_EN = {
  resetHint: "Reset to an empty configuration (the router reboots)",
  importHint: "After uploading the file to Files",
  emptyOnly: "Apply on an EMPTY configuration (no-defaults):",
  disableAdmin: "Log in as the new user first, then disable admin:",
};
const CODE_TITLE_EN = {
  identity: "Router name",
  bridge: "Bridge and LAN ports",
  wan: "Internet (WAN)",
  lan: "LAN address and DHCP server",
  lists: "Interface lists",
  dns: "DNS",
  nat: "NAT",
  firewall: "Firewall",
  forwards: "Port forwarding",
  wifi: "Wi-Fi",
  queue: "Speed limit",
  services: "Close unused services",
  time: "Time and NTP",
  users: "Administrator",
  cloud: "MikroTik Cloud DDNS",
  backup: "Backup",
};

const TEXT = {
  // ================================================================== ENGLISH
  en: {
    title: "MikroTik setup",
    subtitle: "Bring a router up from zero: terminal commands and the same steps in Winbox, in one place",
    tabSetup: "Setup",
    tabFaq: "Q&A",

    gRouter: "Router",
    gWan: "Internet (WAN)",
    gLan: "Local network (LAN)",
    gWifi: "Wi-Fi",
    gSecurity: "Security and access",
    gExtras: "Extras",
    gForwards: "Port forwarding",

    model: "Model",
    modelCustom: "Other / custom",
    version: "RouterOS version",
    versionHint: "v7 is recommended; ax, RB5009 and L009 run only v7",
    ports: "Ethernet ports",
    sfp: "SFP port",
    none: "none",
    identity: "Router name",
    timezone: "Time zone",

    wanPort: "Internet port",
    wanType: "Connection type",
    typeDhcp: "DHCP (automatic)",
    typeStatic: "Static IP",
    typePppoe: "PPPoE (login/password)",
    ip: "IP address",
    mask: "Mask",
    gateway: "Gateway",
    pppoeUser: "Login",
    pppoePass: "Password",
    pppoeService: "Service name",
    pppoeMtu: "MTU",
    auto: "auto",
    optional: "optional",
    vlan: "VLAN ID",
    vlanHint: "only if the ISP requires it",
    mac: "MAC address (clone)",
    macHint: "if the ISP is bound to an old router's MAC",
    dnsMode: "DNS servers",
    dnsIsp: "From ISP",
    dnsCustom: "Custom",
    dnsServers: "DNS addresses",

    lanPorts: "LAN ports (bridge)",
    lanIp: "Router IP",
    lanPrefix: "Prefix / mask",
    dhcpServer: "DHCP server (automatic IPs for devices)",
    poolStart: "Pool start",
    poolEnd: "Pool end",
    leaseTime: "Lease time",

    wifiOn: "Enable Wi-Fi",
    wifiDriver: "Wi-Fi driver",
    driverWireless: "wireless (hAP lite / ac, v6 & v7)",
    driverWifi: "wifi (ax models, v7.13+)",
    ssid: "Network name (SSID)",
    wifiPass: "Wi-Fi password",
    country: "Country",
    countryDefault: "don't change",

    firewall: "Firewall (recommended)",
    firewallHint: "closes the router and the LAN to the internet",
    harden: "Close unused services",
    hardenHint: "telnet, ftp, api off; Winbox/SSH only from the LAN",
    adminUser: "User",
    adminUserHint: "admin or a new user",
    adminPass: "New password",
    wanWinbox: "Winbox from the internet",
    wanWinboxFrom: "Allowed IPs",
    wanWinboxHint: "only these public IPs, comma-separated",

    fwdAdd: "Add rule",
    fwdName: "Name",
    fwdProto: "Protocol",
    fwdExt: "External port",
    fwdIp: "Device IP",
    fwdInt: "Internal port",
    fwdEmpty: "No rules. Example: camera 8080 → 192.168.88.20:80.",
    remove: "Remove",

    queue: "Speed limit for the whole LAN",
    queueDown: "Download",
    queueUp: "Upload",
    mbps: "Mbit/s",
    ddns: "MikroTik Cloud DDNS",
    ntp: "Sync time (NTP)",
    backup: "Save a backup at the end",

    resetForm: "Reset form",
    secretNote: "Passwords are not saved in the browser and are not sent anywhere — everything is generated on this page.",

    outTitle: "Ready configuration",
    viewTerminal: "Terminal",
    viewWinbox: "Winbox (interface)",
    copyAll: "Copy all",
    copied: "Copied",
    download: "Download .rsc",
    copy: "Copy",
    notInFile: "not in the file",
    warnTitle: "Check these fields",

    faqTitle: "Frequently asked questions",
    faqSearch: "Search questions…",
    faqEmpty: "Nothing found.",

    sec: {
      prep: "Before you start",
      identity: "Router name",
      bridge: "Bridge and LAN ports",
      wan: "Internet (WAN)",
      lan: "LAN address and DHCP server",
      lists: "Interface lists",
      dns: "DNS",
      nat: "NAT — internet for the LAN",
      firewall: "Firewall",
      forwards: "Port forwarding",
      wifi: "Wi-Fi",
      queue: "Speed limit",
      services: "Close unused services",
      time: "Time and NTP",
      users: "Administrator",
      cloud: "MikroTik Cloud DDNS",
      backup: "Backup",
      check: "Check",
    },
    secDesc: {
      prep: "Connect, reset to zero and apply the file.",
      identity: "The name shown in Winbox and in the terminal prompt.",
      bridge: "Joins the LAN ports into one network.",
      wan: "How the router gets internet from the ISP.",
      lan: "The router's address in your network and automatic IPs for devices.",
      lists: "WAN / LAN groups — the firewall and NAT rely on them.",
      dns: "Name resolution for the router and the devices.",
      nat: "Shares one internet address with all devices.",
      firewall: "Blocks access to the router and the LAN from the internet.",
      forwards: "Opens ports to devices inside (cameras, servers, games).",
      wifi: "Access point with a WPA2/WPA3 password.",
      queue: "Total speed limit for the whole LAN.",
      services: "Winbox, SSH and WebFig stay reachable only from the LAN.",
      time: "Correct time zone — logs and schedules show the right time.",
      users: "A new password for logging in to the router.",
      cloud: "A permanent name for the router's public address.",
      backup: "Saves the finished configuration on the router.",
      check: "Make sure the internet works.",
    },

    steps: {
      prep: ({ wan, lan, file }) => [
        `Plug the ISP cable into ${c(wan)} and your computer into a LAN port, e.g. ${c(lan)}.`,
        `Download **Winbox** from mikrotik.com/download and open it. On the **Neighbors** tab click the router's **MAC address**, log in as ${c("admin")} (empty password or the one on the sticker) → **Connect**.`,
        `Start from zero (recommended): **System → Reset Configuration** → ✓ No Default Configuration, ✓ Do Not Backup → **Reset Configuration**. The router reboots — connect again by MAC.`,
        `Press **Download .rsc** below, drag the file into **Files** in Winbox, open **New Terminal** and run ${c(`/import file-name=${file}`)}.`,
        `Or copy the blocks below one by one into **New Terminal** (right-click → Paste).`,
      ],
      identity: ({ name }) => [`**System → Identity** → Name: ${c(name)} → **OK**.`],
      bridge: ({ bridge, ports }) =>
        [
          `**Bridge** → **Bridge** tab → **+** → Name: ${c(bridge)} → **OK**.`,
          ports.length
            ? `**Ports** tab → **+** → Interface: ${c(ports[0])}, Bridge: ${c(bridge)} → **OK**.${
                ports.length > 1 ? ` Repeat for ${cs(ports.slice(1))}.` : ""
              }`
            : null,
        ].filter(Boolean),
      wanMac: ({ port, mac }) => [`**Interfaces** → double-click ${c(port)} → **General** → MAC Address: ${c(mac)} → **OK**.`],
      wanVlan: ({ port, vlan, name }) => [
        `**Interfaces → VLAN** → **+** → Name: ${c(name)}, VLAN ID: ${c(vlan)}, Interface: ${c(port)} → **OK**.`,
      ],
      wanDhcp: ({ iface, peer }) => [
        `**IP → DHCP Client** → **+** → Interface: ${c(iface)}, Use Peer DNS: ${peer ? "✓" : "✗"}, Add Default Route: ${c("yes")} → **OK**.`,
        `Wait until Status shows **bound** and an IP address appears.`,
      ],
      wanStatic: ({ iface, addr, gw }) => [
        `**IP → Addresses** → **+** → Address: ${c(addr)}, Interface: ${c(iface)} → **OK**.`,
        `**IP → Routes** → **+** → Dst. Address: ${c("0.0.0.0/0")}, Gateway: ${c(gw)} → **OK**.`,
      ],
      wanPppoe: ({ iface, user, service, mtu, peer }) => [
        `**PPP** → **Interface** tab → **+** → **PPPoE Client**.`,
        `**General**: Name ${c("pppoe-out1")}, Interfaces: ${c(iface)}${mtu ? `, Max MTU / Max MRU: ${c(mtu)}` : ""}.`,
        `**Dial Out**: User ${c(user)}, Password — from your ISP contract${service ? `, Service ${c(service)}` : ""}, Use Peer DNS ${peer ? "✓" : "✗"}, ✓ Add Default Route → **OK**.`,
        `The status at the bottom of the window should become **connected**.`,
      ],
      lan: ({ bridge, addr }) => [`**IP → Addresses** → **+** → Address: ${c(addr)}, Interface: ${c(bridge)} → **OK**.`],
      dhcpServer: ({ bridge, net, gw, pool, dns, lease }) => [
        `**IP → DHCP Server** → **DHCP Setup** → DHCP Server Interface: ${c(bridge)} → **Next**.`,
        `Address space ${c(net)} → Gateway ${c(gw)} → Addresses to give out ${c(pool)} → DNS servers ${c(dns)} → Lease time ${c(lease)} → **Next** until finished.`,
      ],
      lists: ({ wan, lan }) => [
        `**Interfaces → Interface List** → **Lists** → **+** → Name ${c("WAN")} → **OK**; again for ${c("LAN")}.`,
        `Back on **Interface List**: **+** → List ${c("WAN")}, Interface ${c(wan)} → **OK**; **+** → List ${c("LAN")}, Interface ${c(lan)} → **OK**.`,
      ],
      dns: ({ servers, remote, ip }) =>
        [
          `**IP → DNS** → Servers: ${servers ? c(servers) : "leave empty (the ISP gives them)"}, Allow Remote Requests ${remote ? "✓" : "✗"} → **OK**.`,
          remote ? `**Static** → **+** → Name ${c("router.lan")}, Address ${c(ip)} → **OK** (open the router by name).` : null,
        ].filter(Boolean),
      nat: () => [
        `**IP → Firewall → NAT** → **+** → **General**: Chain ${c("srcnat")}, Out. Interface List ${c("WAN")} → **Action**: ${c("masquerade")} → **OK**.`,
      ],
      firewall: ({ fasttrack }) => [
        `**IP → Firewall → Filter Rules** → add the rules **in exactly this order** (each one: **+** → General / Advanced / Action). Pasting the block into the terminal is much faster.`,
        ...(fasttrack ? [] : ["FastTrack is left out on purpose — the speed limit (queue) wouldn't work with it."]),
      ],
      winboxWan: ({ ips }) => [
        `**IP → Firewall → Address Lists** → **+** → Name ${c("winbox-remote")}, Address: ${c(ips)}. The accept rule for port ${c("8291")} must stay **above** “drop all not coming from LAN”.`,
      ],
      forwards: () => [
        `**IP → Firewall → NAT** → **+** for each rule: **General**: Chain ${c("dstnat")}, Protocol, Dst. Port (external), In. Interface List ${c("WAN")} → **Action**: ${c("dst-nat")}, To Addresses (device IP), To Ports (internal port) → **OK**.`,
      ],
      wifiLegacy: ({ ssid, bridge }) => [
        `**Wireless → Security Profiles** → **+** → Name ${c("kattabaza")}, Mode ${c("dynamic keys")}, ✓ WPA2 PSK, WPA2 Pre-Shared Key — your password → **OK**.`,
        `**Wireless → WiFi Interfaces** → double-click ${c("wlan1")} → **Wireless**: Mode ${c("ap bridge")}, Band ${c("2GHz-B/G/N")}, SSID ${c(ssid)}, Security Profile ${c("kattabaza")}, WPS Mode ${c("disabled")} → **OK** → enable (✓).`,
        `If there is ${c("wlan2")} (5 GHz) — the same, with Band ${c("5GHz-A/N/AC")}.`,
        `**Bridge → Ports** → **+** → Interface ${c("wlan1")} (and ${c("wlan2")}), Bridge ${c(bridge)} → **OK**.`,
      ],
      wifiNew: ({ ssid, bridge }) => [
        `**WiFi** → **WiFi** tab → double-click ${c("wifi1")} → **Configuration**: Mode ${c("ap")}, SSID ${c(ssid)}, Country → **Security**: ✓ WPA2 PSK, ✓ WPA3 PSK, Passphrase — your password → **OK** → enable (✓).`,
        `Repeat for ${c("wifi2")} (the second band).`,
        `**Bridge → Ports** → **+** → Interface ${c("wifi1")} (and ${c("wifi2")}), Bridge ${c(bridge)} → **OK**.`,
      ],
      queue: ({ target, up, down }) => [
        `**Queues → Simple Queues** → **+** → Name ${c("lan-limit")}, Target ${c(target)}, Max Limit: Upload ${c(up)}, Download ${c(down)} → **OK**.`,
      ],
      services: ({ net, winbox }) => [
        `**IP → Services** → disable (✗) ${cs(["telnet", "ftp", "api", "api-ssl"])}.`,
        `Double-click ${c("www")} and ${c("ssh")} → Available From ${c(net)}; ${c("winbox")} → ${c(winbox)} → **OK**.`,
        `**Tools → MAC Server** → MAC Telnet Server and MAC Winbox Server → Allowed Interface List ${c("LAN")}.`,
        `**IP → Neighbors → Discovery Settings** → Interface List ${c("LAN")}. **Tools → BTest Server** → ✗ Enabled.`,
      ],
      time: ({ tz, ntp }) =>
        [
          `**System → Clock** → ✗ Time Zone Autodetect, Time Zone Name ${c(tz)} → **OK**.`,
          ntp ? `**System → NTP Client** → ✓ Enabled, Servers ${cs(["0.pool.ntp.org", "1.pool.ntp.org"])} → **OK**.` : null,
        ].filter(Boolean),
      userSet: () => [
        `**System → Users** → select ${c("admin")} → **Password** → enter the new password twice → **OK**.`,
        `Write the password down — it can't be recovered, only reset.`,
      ],
      userAdd: ({ name }) => [
        `**System → Users** → **+** → Name ${c(name)}, Group ${c("full")}, Password (twice) → **OK**.`,
        `Log out and log back in as ${c(name)}. Only then disable ${c("admin")} (select → ✗) — the script leaves that line commented on purpose.`,
      ],
      cloud: () => [
        `**IP → Cloud** → ✓ DDNS Enabled → **Apply**. In a minute DNS Name shows an address like ${c("xxxx.sn.mynetname.net")} — it always points to your router.`,
      ],
      backup: ({ name }) => [
        `**Files → Backup** → Name ${c(name)}, ✓ Don't Encrypt → **Backup**.`,
        `Drag ${c(name + ".backup")} and ${c(name + ".rsc")} from **Files** to your computer and keep them safe.`,
      ],
      check: () => [
        `In **New Terminal** run the commands below — every ping must get replies.`,
        `On the computer: replug the cable (or reconnect to Wi-Fi) and open any website.`,
        `Look at your IP on the KattaBaza home page — it should now be the ISP's address.`,
      ],
    },

    warn: {
      lanIp: "LAN: invalid router IP or prefix (allowed /8–/30).",
      dns: "DNS: enter one or more IPv4 addresses, e.g. 1.1.1.1, 8.8.8.8.",
      noLan: "No LAN ports and Wi-Fi is off — there is nothing to connect a computer to.",
      mac: "MAC address format: AA:BB:CC:DD:EE:FF.",
      vlan: "VLAN ID must be 1–4094.",
      staticIp: "Static IP: enter the IP address from your ISP.",
      staticMask: "Static IP: invalid mask (e.g. 255.255.255.0 or 24).",
      staticGw: "Static IP: enter the gateway.",
      gwOutside: "The gateway is outside the IP/mask subnet — double-check with the ISP.",
      overlap: "WAN and LAN subnets overlap — change the LAN IP (e.g. 192.168.10.1).",
      pppoeUser: "PPPoE: enter the login.",
      pppoePass: "PPPoE: enter the password.",
      mtu: "MTU must be 576–1500 (usually 1480 or 1492).",
      pool: "DHCP pool: addresses must be inside the LAN subnet, start ≤ end.",
      winboxIps: "Winbox from the internet: enter the IPs allowed to connect.",
      noFirewall: "The firewall is off — the router is open to the internet. Not recommended.",
      winboxNoFirewall: "Without the firewall Winbox is reachable from the whole internet.",
      forward: (n) => `Port forwarding #${n}: check the ports and the device IP.`,
      forwardOutside: (n) => `Port forwarding #${n}: the device IP is not in the LAN subnet.`,
      ssid: "Wi-Fi: enter a network name (SSID).",
      wifiPass: "Wi-Fi: the password must be at least 8 characters.",
      queue: "Speed limit: enter numbers in Mbit/s.",
      adminUser: "User name: only letters, digits and . _ -",
      adminPass: "Set a router password — without it the Administrator block is skipped.",
      adminWeak: "The password is shorter than 8 characters.",
    },

    code: CODE_EN,
    codeTitle: CODE_TITLE_EN,

    faq: {
      defaultLogin: {
        q: "What are the default IP, login and password?",
        a: "With the factory configuration: IP `192.168.88.1`, user `admin`. Older devices have an empty password; newer ones have a random password printed on the sticker. After a no-defaults reset the router has no IP at all — connect in Winbox by MAC address (Neighbors tab).",
      },
      winbox: {
        q: "Where do I get Winbox and how do I connect?",
        a: "Download Winbox from the official site mikrotik.com/download (Windows, macOS, Linux). Plug the computer into any port except WAN, open Winbox → Neighbors → click the MAC address → login → Connect. MAC connection works even when the router has no IP. With an IP you can also open WebFig in a browser: http://192.168.88.1.",
      },
      reset: {
        q: "How do I reset the router to zero?",
        a: "From the terminal — the router reboots with an empty configuration:",
        n: "With the button: hold RESET, power the router on and release it when the LED starts blinking (about 5 seconds) — the factory configuration comes back. Holding longer switches to CAPsMAN and then Netinstall modes.",
      },
      apply: {
        q: "How do I apply the generated script?",
        a: "Best: press “Download .rsc”, drag the file into Files in Winbox, then run in New Terminal:",
        n: "On RouterOS v7 add `verbose=yes` to see every line and exactly where an error happens. You can also paste the blocks one by one into New Terminal. Apply on an empty configuration — otherwise the bridge, DHCP and other items may already exist.",
      },
      runAfterReset: {
        q: "Can the script run automatically right after a reset?",
        a: "Yes. Upload the file to Files and run:",
        n: "The file runs at boot before the ports are ready, so put `:delay 15s` on the first line of the file. On older devices with a flash folder the path is `flash/kattabaza.rsc`.",
      },
      safeMode: {
        q: "How do I avoid locking myself out while changing settings?",
        a: "Turn on Safe Mode: the “Safe Mode” button in Winbox or Ctrl+X in the terminal. If the connection drops, every change made since then is rolled back automatically. Press it again to keep the changes.",
      },
      lostAccess: {
        q: "I applied the script and lost access to the router",
        a: "Plug the cable into a LAN port (not WAN) and in Winbox → Neighbors connect by MAC — the script keeps MAC Winbox allowed from the LAN. If the router isn't listed, reset it with the button and apply the file again.",
      },
      noInternet: {
        q: "The router is set up but there's no internet",
        a: "Check step by step in New Terminal:",
        n: "No reply from 8.8.8.8 — the problem is on the WAN side: the cable, DHCP status (bound), PPPoE status (connected) or ISP settings. 8.8.8.8 works but google.com doesn't — DNS. The router has internet but devices don't — the NAT (masquerade) rule or the device's IP/gateway.",
      },
      pppoe: {
        q: "PPPoE doesn't connect",
        a: "Look at the status and the log:",
        n: "“authentication failed” — wrong login or password. Stuck at “initializing” — the cable is in the wrong port, a VLAN is required, or the ISP is bound to the old router's MAC (use the MAC clone field). Some ISPs require a Service name.",
      },
      mtu: {
        q: "Some sites open slowly or only partly over PPPoE",
        a: "Usually it's MTU. Lower the MTU and clamp TCP MSS:",
      },
      greyIp: {
        q: "How do I know if my IP is public or behind the ISP's NAT?",
        a: "Compare the WAN address on the router with the IP on the KattaBaza home page:",
        n: "If they differ, or the WAN address is in 10.x.x.x, 172.16–31.x.x, 192.168.x.x or 100.64–127.x.x, you are behind the ISP's NAT (CGNAT). Port forwarding and remote Winbox won't work — ask the ISP for a public IP.",
      },
      devices: {
        q: "How do I see the connected devices?",
        a: "Leases show the name, IP and MAC of every device; the registration table shows Wi-Fi clients:",
        n: "With the new wifi driver (v7, ax models): `/interface wifi registration-table print`. In Winbox: IP → DHCP Server → Leases.",
      },
      staticLease: {
        q: "How do I give a device a fixed IP?",
        a: "Make its current DHCP lease static (put in its IP):",
        n: "Or in Winbox: IP → DHCP Server → Leases → double-click the device → Make Static. After that you can change the address in the same window.",
      },
      portForward: {
        q: "I opened a port but it doesn't work",
        a: "Check: 1) your IP is public (see the question above); 2) the device keeps the same IP (make its lease static); 3) the device's own firewall allows the port; 4) you test from outside (mobile internet), not from the LAN. To make it work from inside the LAN too, add hairpin NAT:",
        n: "For hairpin the dstnat rule must match `dst-address=<your public IP>` instead of `in-interface-list=WAN`.",
      },
      speedDevice: {
        q: "How do I limit the speed of one device?",
        a: "Add a simple queue for its IP (upload/download):",
        n: "Queues don't apply to FastTrack-ed traffic, so the second line turns FastTrack off. The generator does this itself when the speed limit is on.",
      },
      blockSite: {
        q: "How do I block a website (e.g. TikTok)?",
        a: "The simplest way on RouterOS v7 is DNS, and force every device to use the router's DNS:",
        n: "Browsers with “secure DNS” (DoH) can bypass this — turn it off in the browser or block DoH servers.",
      },
      update: {
        q: "How do I update RouterOS and the firmware?",
        a: "Make a backup first. `install` downloads the update and reboots the router:",
        n: "`routerboard upgrade` brings the bootloader to the same version — it is applied after one more reboot.",
      },
      forgotPassword: {
        q: "I forgot the router password",
        a: "A password can't be recovered. Reset with the button (see the reset question) — the configuration is lost too. If even that doesn't help, reinstall with Netinstall (mikrotik.com/download). That's why the generator saves a backup at the end.",
      },
      backup: {
        q: "How do I make a backup and restore it?",
        a: "Save, export and restore:",
        n: "A .backup is a full binary copy — restore it only on the same model. An .rsc export is readable text — you can import it on another router (`/import file-name=myconfig.rsc`). Download both files from Files to your computer.",
      },
      logs: {
        q: "Where do I see logs and errors?",
        a: "In Winbox — the Log menu. In the terminal (`follow` shows new lines live, Ctrl+C to exit):",
      },
      doubleNat: {
        q: "There's an ISP modem in front of the MikroTik",
        a: "That's two NATs (double NAT). It works, but port forwarding, some games and VoIP suffer. Better: switch the ISP modem to bridge mode and set up PPPoE on the MikroTik, or put the MikroTik's address into the modem's DMZ. In the generator choose DHCP for WAN.",
      },
      failover: {
        q: "How do I connect two ISPs (backup internet)?",
        a: "Second ISP on ether2: remove it from the bridge, add it to the WAN list, give it the ISP's address and add two default routes with different distance (example with static gateways):",
        n: "When ISP1's gateway stops answering pings, traffic goes through ISP2. If an ISP is DHCP or PPPoE, set `default-route-distance` in its client instead (1 — main, 2 — backup).",
      },
      scheduleReboot: {
        q: "How do I reboot the router every night automatically?",
        a: "Usually not needed, but it helps with unstable ISPs:",
        n: "Remove it: `/system scheduler remove night-reboot`.",
      },
      versions: {
        q: "RouterOS v6 or v7 — which one?",
        a: "Check the version and the model:",
        n: "v7 is recommended for all new devices (ax models, RB5009 and L009 support only v7); v6 stays only on old ones. The difference matters for Wi-Fi (wireless vs wifi) and NTP — the generator accounts for it.",
      },
      wifiInvisible: {
        q: "The Wi-Fi network is not visible",
        a: "The interface may be disabled (X), the band wrong or the package missing:",
        n: "For the new driver: `/interface wifi print` and `/interface wifi enable [find]`. On hAP ax the wifi package (wifi-qcom) must be installed: System → Packages.",
      },
      remoteAccess: {
        q: "How do I manage the router from outside?",
        a: "Never open Winbox (port 8291) to the whole internet. In the generator turn on “Winbox from the internet” and enter your public IPs — only they can connect. Even better: set up a VPN (WireGuard on v7) and connect through it. Turn on MikroTik Cloud DDNS to get a permanent name for a changing IP.",
      },
      dnsFlush: {
        q: "A site moved but the old address still opens",
        a: "Clear the router's DNS cache:",
        n: "On Windows also run `ipconfig /flushdns`.",
      },
      changePass: {
        q: "How do I change the password from the terminal?",
        a: "Set it directly:",
        n: "Or just type `/password` — it asks for the old and the new password.",
      },
      slowSpeed: {
        q: "The internet is slower than my plan",
        a: "Look at the CPU load and FastTrack:",
        n: "If the CPU is near 100%, FastTrack must be on (the third command must find a rule) and unnecessary queues/mangle rules off. Wi-Fi speed depends on distance and band — measure over a cable first.",
      },
    },
  },

  // ================================================================== O'ZBEKCHA
  uz: {
    title: "MikroTik sozlash",
    subtitle: "Routerni noldan ishga tushirish: terminal buyruqlari va Winbox’dagi xuddi shu qadamlar bir joyda",
    tabSetup: "Sozlash",
    tabFaq: "Savol-javob",

    gRouter: "Router",
    gWan: "Internet (WAN)",
    gLan: "Lokal tarmoq (LAN)",
    gWifi: "Wi-Fi",
    gSecurity: "Xavfsizlik va kirish",
    gExtras: "Qo‘shimcha",
    gForwards: "Port ochish (port forwarding)",

    model: "Model",
    modelCustom: "Boshqa / qo‘lda",
    version: "RouterOS versiyasi",
    versionHint: "v7 tavsiya etiladi; ax, RB5009 va L009 faqat v7 da ishlaydi",
    ports: "Ethernet portlar",
    sfp: "SFP port",
    none: "yo‘q",
    identity: "Router nomi",
    timezone: "Vaqt zonasi",

    wanPort: "Internet kiradigan port",
    wanType: "Ulanish turi",
    typeDhcp: "DHCP (avtomatik)",
    typeStatic: "Statik IP",
    typePppoe: "PPPoE (login/parol)",
    ip: "IP manzil",
    mask: "Maska",
    gateway: "Shlyuz (gateway)",
    pppoeUser: "Login",
    pppoePass: "Parol",
    pppoeService: "Service name",
    pppoeMtu: "MTU",
    auto: "avto",
    optional: "ixtiyoriy",
    vlan: "VLAN ID",
    vlanHint: "faqat provayder talab qilsa",
    mac: "MAC manzil (klon)",
    macHint: "provayder eski routerning MAC’iga bog‘lagan bo‘lsa",
    dnsMode: "DNS serverlar",
    dnsIsp: "Provayderdan",
    dnsCustom: "O‘zim kiritaman",
    dnsServers: "DNS manzillar",

    lanPorts: "LAN portlar (bridge)",
    lanIp: "Router IP",
    lanPrefix: "Prefiks / maska",
    dhcpServer: "DHCP server (qurilmalarga avtomatik IP)",
    poolStart: "Pul boshi",
    poolEnd: "Pul oxiri",
    leaseTime: "Ijara muddati",

    wifiOn: "Wi-Fi’ni yoqish",
    wifiDriver: "Wi-Fi drayveri",
    driverWireless: "wireless (hAP lite / ac, v6 va v7)",
    driverWifi: "wifi (ax modellar, v7.13+)",
    ssid: "Tarmoq nomi (SSID)",
    wifiPass: "Wi-Fi paroli",
    country: "Davlat",
    countryDefault: "o‘zgartirmaslik",

    firewall: "Firewall (tavsiya etiladi)",
    firewallHint: "internetdan routerga va LAN’ga kirishni yopadi",
    harden: "Keraksiz xizmatlarni yopish",
    hardenHint: "telnet, ftp, api o‘chadi; Winbox/SSH faqat LAN’dan",
    adminUser: "Foydalanuvchi",
    adminUserHint: "admin yoki yangi foydalanuvchi",
    adminPass: "Yangi parol",
    wanWinbox: "Internetdan Winbox",
    wanWinboxFrom: "Ruxsat etilgan IP’lar",
    wanWinboxHint: "faqat shu tashqi IP’lar, vergul bilan",

    fwdAdd: "Qoida qo‘shish",
    fwdName: "Nomi",
    fwdProto: "Protokol",
    fwdExt: "Tashqi port",
    fwdIp: "Qurilma IP",
    fwdInt: "Ichki port",
    fwdEmpty: "Qoida yo‘q. Masalan: kamera 8080 → 192.168.88.20:80.",
    remove: "O‘chirish",

    queue: "Butun LAN uchun tezlik cheklovi",
    queueDown: "Yuklab olish",
    queueUp: "Yuborish",
    mbps: "Mbit/s",
    ddns: "MikroTik Cloud DDNS",
    ntp: "Vaqtni sinxronlash (NTP)",
    backup: "Oxirida zaxira nusxa olish",

    resetForm: "Formani tozalash",
    secretNote: "Parollar brauzerda saqlanmaydi va hech qayerga yuborilmaydi — hammasi shu sahifaning o‘zida tuziladi.",

    outTitle: "Tayyor sozlama",
    viewTerminal: "Terminal",
    viewWinbox: "Winbox (interfeys)",
    copyAll: "Hammasini nusxalash",
    copied: "Nusxalandi",
    download: ".rsc yuklab olish",
    copy: "Nusxalash",
    notInFile: "faylga kirmaydi",
    warnTitle: "Shu maydonlarni tekshiring",

    faqTitle: "Ko‘p beriladigan savollar",
    faqSearch: "Savollardan qidirish…",
    faqEmpty: "Hech narsa topilmadi.",

    sec: {
      prep: "Boshlashdan oldin",
      identity: "Router nomi",
      bridge: "Bridge va LAN portlar",
      wan: "Internet (WAN)",
      lan: "LAN manzil va DHCP server",
      lists: "Interfeys ro‘yxatlari",
      dns: "DNS",
      nat: "NAT — LAN’ga internet",
      firewall: "Firewall",
      forwards: "Port ochish",
      wifi: "Wi-Fi",
      queue: "Tezlik cheklovi",
      services: "Keraksiz xizmatlarni yopish",
      time: "Vaqt va NTP",
      users: "Administrator",
      cloud: "MikroTik Cloud DDNS",
      backup: "Zaxira nusxa",
      check: "Tekshirish",
    },
    secDesc: {
      prep: "Ulanish, noldan tozalash va faylni ishga tushirish.",
      identity: "Winbox’da va terminalda ko‘rinadigan nom.",
      bridge: "LAN portlarini bitta tarmoqqa birlashtiradi.",
      wan: "Router provayderdan internetni qanday oladi.",
      lan: "Routerning tarmoqdagi manzili va qurilmalarga avtomatik IP.",
      lists: "WAN / LAN guruhlari — firewall va NAT shularga tayanadi.",
      dns: "Router va qurilmalar uchun domen nomlarini aniqlash.",
      nat: "Bitta internet manzilni barcha qurilmalarga tarqatadi.",
      firewall: "Internetdan routerga va LAN’ga kirishni yopadi.",
      forwards: "Ichkaridagi qurilmalarga port ochadi (kamera, server, o‘yin).",
      wifi: "WPA2/WPA3 parolli kirish nuqtasi.",
      queue: "Butun LAN uchun umumiy tezlik chegarasi.",
      services: "Winbox, SSH va WebFig faqat LAN’dan ochiladi.",
      time: "To‘g‘ri vaqt zonasi — loglar va jadval to‘g‘ri vaqtni ko‘rsatadi.",
      users: "Routerga kirish uchun yangi parol.",
      cloud: "Routerning tashqi manzili uchun doimiy nom.",
      backup: "Tayyor sozlamani routerning o‘zida saqlaydi.",
      check: "Internet ishlayotganiga ishonch hosil qilish.",
    },

    steps: {
      prep: ({ wan, lan, file }) => [
        `Provayder kabelini ${c(wan)} portiga, kompyuterni LAN portlardan biriga (masalan, ${c(lan)}) ulang.`,
        `**Winbox**’ni mikrotik.com/download saytidan yuklab oching. **Neighbors** bo‘limida routerning **MAC manzili**ni bosing, ${c("admin")} bilan kiring (parol bo‘sh yoki routerning stikerida) → **Connect**.`,
        `Noldan boshlash (tavsiya etiladi): **System → Reset Configuration** → ✓ No Default Configuration, ✓ Do Not Backup → **Reset Configuration**. Router qayta yuklanadi — yana MAC orqali ulaning.`,
        `Pastdagi **.rsc yuklab olish** tugmasini bosing, faylni Winbox’dagi **Files** oynasiga sudrab tashlang, **New Terminal**’ni ochib ${c(`/import file-name=${file}`)} ni ishga tushiring.`,
        `Yoki pastdagi bloklarni bittalab **New Terminal**’ga joylang (o‘ng tugma → Paste).`,
      ],
      identity: ({ name }) => [`**System → Identity** → Name: ${c(name)} → **OK**.`],
      bridge: ({ bridge, ports }) =>
        [
          `**Bridge** → **Bridge** varag‘i → **+** → Name: ${c(bridge)} → **OK**.`,
          ports.length
            ? `**Ports** varag‘i → **+** → Interface: ${c(ports[0])}, Bridge: ${c(bridge)} → **OK**.${
                ports.length > 1 ? ` Shuni ${cs(ports.slice(1))} uchun ham takrorlang.` : ""
              }`
            : null,
        ].filter(Boolean),
      wanMac: ({ port, mac }) => [
        `**Interfaces** → ${c(port)} ustiga ikki marta bosing → **General** → MAC Address: ${c(mac)} → **OK**.`,
      ],
      wanVlan: ({ port, vlan, name }) => [
        `**Interfaces → VLAN** → **+** → Name: ${c(name)}, VLAN ID: ${c(vlan)}, Interface: ${c(port)} → **OK**.`,
      ],
      wanDhcp: ({ iface, peer }) => [
        `**IP → DHCP Client** → **+** → Interface: ${c(iface)}, Use Peer DNS: ${peer ? "✓" : "✗"}, Add Default Route: ${c("yes")} → **OK**.`,
        `Status **bound** bo‘lib, IP manzil chiqguncha kuting.`,
      ],
      wanStatic: ({ iface, addr, gw }) => [
        `**IP → Addresses** → **+** → Address: ${c(addr)}, Interface: ${c(iface)} → **OK**.`,
        `**IP → Routes** → **+** → Dst. Address: ${c("0.0.0.0/0")}, Gateway: ${c(gw)} → **OK**.`,
      ],
      wanPppoe: ({ iface, user, service, mtu, peer }) => [
        `**PPP** → **Interface** varag‘i → **+** → **PPPoE Client**.`,
        `**General**: Name ${c("pppoe-out1")}, Interfaces: ${c(iface)}${mtu ? `, Max MTU / Max MRU: ${c(mtu)}` : ""}.`,
        `**Dial Out**: User ${c(user)}, Password — provayder shartnomasidagi parol${service ? `, Service ${c(service)}` : ""}, Use Peer DNS ${peer ? "✓" : "✗"}, ✓ Add Default Route → **OK**.`,
        `Oynaning pastidagi status **connected** bo‘lishi kerak.`,
      ],
      lan: ({ bridge, addr }) => [`**IP → Addresses** → **+** → Address: ${c(addr)}, Interface: ${c(bridge)} → **OK**.`],
      dhcpServer: ({ bridge, net, gw, pool, dns, lease }) => [
        `**IP → DHCP Server** → **DHCP Setup** → DHCP Server Interface: ${c(bridge)} → **Next**.`,
        `Address space ${c(net)} → Gateway ${c(gw)} → Addresses to give out ${c(pool)} → DNS servers ${c(dns)} → Lease time ${c(lease)} → oxirigacha **Next**.`,
      ],
      lists: ({ wan, lan }) => [
        `**Interfaces → Interface List** → **Lists** → **+** → Name ${c("WAN")} → **OK**; ${c("LAN")} uchun ham shunday.`,
        `**Interface List**’ning o‘zida: **+** → List ${c("WAN")}, Interface ${c(wan)} → **OK**; **+** → List ${c("LAN")}, Interface ${c(lan)} → **OK**.`,
      ],
      dns: ({ servers, remote, ip }) =>
        [
          `**IP → DNS** → Servers: ${servers ? c(servers) : "bo‘sh qoldiring (provayder o‘zi beradi)"}, Allow Remote Requests ${remote ? "✓" : "✗"} → **OK**.`,
          remote ? `**Static** → **+** → Name ${c("router.lan")}, Address ${c(ip)} → **OK** (routerni nom bilan ochish uchun).` : null,
        ].filter(Boolean),
      nat: () => [
        `**IP → Firewall → NAT** → **+** → **General**: Chain ${c("srcnat")}, Out. Interface List ${c("WAN")} → **Action**: ${c("masquerade")} → **OK**.`,
      ],
      firewall: ({ fasttrack }) => [
        `**IP → Firewall → Filter Rules** → qoidalarni **aynan shu tartibda** qo‘shing (har biri: **+** → General / Advanced / Action). Blokni terminalga joylash ancha tez.`,
        ...(fasttrack ? [] : ["FastTrack ataylab qo‘yilmagan — u bilan tezlik cheklovi (queue) ishlamaydi."]),
      ],
      winboxWan: ({ ips }) => [
        `**IP → Firewall → Address Lists** → **+** → Name ${c("winbox-remote")}, Address: ${c(ips)}. ${c("8291")} port uchun accept qoidasi “drop all not coming from LAN” qoidasidan **yuqorida** turishi shart.`,
      ],
      forwards: () => [
        `**IP → Firewall → NAT** → har bir qoida uchun **+**: **General**: Chain ${c("dstnat")}, Protocol, Dst. Port (tashqi), In. Interface List ${c("WAN")} → **Action**: ${c("dst-nat")}, To Addresses (qurilma IP), To Ports (ichki port) → **OK**.`,
      ],
      wifiLegacy: ({ ssid, bridge }) => [
        `**Wireless → Security Profiles** → **+** → Name ${c("kattabaza")}, Mode ${c("dynamic keys")}, ✓ WPA2 PSK, WPA2 Pre-Shared Key — parolingiz → **OK**.`,
        `**Wireless → WiFi Interfaces** → ${c("wlan1")} ustiga ikki marta bosing → **Wireless**: Mode ${c("ap bridge")}, Band ${c("2GHz-B/G/N")}, SSID ${c(ssid)}, Security Profile ${c("kattabaza")}, WPS Mode ${c("disabled")} → **OK** → yoqing (✓).`,
        `${c("wlan2")} (5 GHz) bo‘lsa — xuddi shunday, Band ${c("5GHz-A/N/AC")}.`,
        `**Bridge → Ports** → **+** → Interface ${c("wlan1")} (va ${c("wlan2")}), Bridge ${c(bridge)} → **OK**.`,
      ],
      wifiNew: ({ ssid, bridge }) => [
        `**WiFi** → **WiFi** varag‘i → ${c("wifi1")} ustiga ikki marta bosing → **Configuration**: Mode ${c("ap")}, SSID ${c(ssid)}, Country → **Security**: ✓ WPA2 PSK, ✓ WPA3 PSK, Passphrase — parolingiz → **OK** → yoqing (✓).`,
        `${c("wifi2")} (ikkinchi diapazon) uchun ham takrorlang.`,
        `**Bridge → Ports** → **+** → Interface ${c("wifi1")} (va ${c("wifi2")}), Bridge ${c(bridge)} → **OK**.`,
      ],
      queue: ({ target, up, down }) => [
        `**Queues → Simple Queues** → **+** → Name ${c("lan-limit")}, Target ${c(target)}, Max Limit: Upload ${c(up)}, Download ${c(down)} → **OK**.`,
      ],
      services: ({ net, winbox }) => [
        `**IP → Services** → ${cs(["telnet", "ftp", "api", "api-ssl"])} ni o‘chiring (✗).`,
        `${c("www")} va ${c("ssh")} ustiga ikki marta bosing → Available From ${c(net)}; ${c("winbox")} → ${c(winbox)} → **OK**.`,
        `**Tools → MAC Server** → MAC Telnet Server va MAC Winbox Server → Allowed Interface List ${c("LAN")}.`,
        `**IP → Neighbors → Discovery Settings** → Interface List ${c("LAN")}. **Tools → BTest Server** → ✗ Enabled.`,
      ],
      time: ({ tz, ntp }) =>
        [
          `**System → Clock** → ✗ Time Zone Autodetect, Time Zone Name ${c(tz)} → **OK**.`,
          ntp ? `**System → NTP Client** → ✓ Enabled, Servers ${cs(["0.pool.ntp.org", "1.pool.ntp.org"])} → **OK**.` : null,
        ].filter(Boolean),
      userSet: () => [
        `**System → Users** → ${c("admin")} ni tanlang → **Password** → yangi parolni ikki marta kiriting → **OK**.`,
        `Parolni yozib qo‘ying — uni tiklab bo‘lmaydi, faqat routerni reset qilish mumkin.`,
      ],
      userAdd: ({ name }) => [
        `**System → Users** → **+** → Name ${c(name)}, Group ${c("full")}, Password (ikki marta) → **OK**.`,
        `Chiqib, ${c(name)} bilan qayta kiring. Shundan keyingina ${c("admin")} ni o‘chiring (tanlang → ✗) — skriptda bu qator ataylab izohga olingan.`,
      ],
      cloud: () => [
        `**IP → Cloud** → ✓ DDNS Enabled → **Apply**. Bir daqiqadan so‘ng DNS Name’da ${c("xxxx.sn.mynetname.net")} kabi manzil chiqadi — u doim routeringizga olib boradi.`,
      ],
      backup: ({ name }) => [
        `**Files → Backup** → Name ${c(name)}, ✓ Don't Encrypt → **Backup**.`,
        `${c(name + ".backup")} va ${c(name + ".rsc")} fayllarini **Files**’dan kompyuterga sudrab oling va saqlab qo‘ying.`,
      ],
      check: () => [
        `**New Terminal**’da pastdagi buyruqlarni bering — har bir ping javob olishi kerak.`,
        `Kompyuterda kabelni qayta ulang (yoki Wi-Fi’ga qayta ulaning) va istalgan saytni oching.`,
        `KattaBaza bosh sahifasida IP’ingizga qarang — endi u provayder manzili bo‘lishi kerak.`,
      ],
    },

    warn: {
      lanIp: "LAN: router IP yoki prefiks noto‘g‘ri (ruxsat /8–/30).",
      dns: "DNS: bitta yoki bir nechta IPv4 kiriting, masalan 1.1.1.1, 8.8.8.8.",
      noLan: "LAN port tanlanmagan va Wi-Fi o‘chiq — kompyuterni ulashga joy yo‘q.",
      mac: "MAC manzil formati: AA:BB:CC:DD:EE:FF.",
      vlan: "VLAN ID 1–4094 oralig‘ida bo‘lishi kerak.",
      staticIp: "Statik IP: provayder bergan IP manzilni kiriting.",
      staticMask: "Statik IP: maska noto‘g‘ri (masalan 255.255.255.0 yoki 24).",
      staticGw: "Statik IP: shlyuzni (gateway) kiriting.",
      gwOutside: "Shlyuz IP/maska tarmog‘idan tashqarida — provayderdan qayta so‘rang.",
      overlap: "WAN va LAN tarmoqlari ustma-ust tushdi — LAN IP’ni o‘zgartiring (masalan 192.168.10.1).",
      pppoeUser: "PPPoE: loginni kiriting.",
      pppoePass: "PPPoE: parolni kiriting.",
      mtu: "MTU 576–1500 oralig‘ida bo‘lsin (odatda 1480 yoki 1492).",
      pool: "DHCP pul: manzillar LAN tarmog‘i ichida va boshi ≤ oxiri bo‘lishi kerak.",
      winboxIps: "Internetdan Winbox: ulanishga ruxsat beriladigan IP’larni kiriting.",
      noFirewall: "Firewall o‘chiq — router internetga ochiq qoladi. Tavsiya etilmaydi.",
      winboxNoFirewall: "Firewall’siz Winbox butun internetdan ochiq bo‘ladi.",
      forward: (n) => `Port ochish #${n}: portlar va qurilma IP’sini tekshiring.`,
      forwardOutside: (n) => `Port ochish #${n}: qurilma IP’si LAN tarmog‘ida emas.`,
      ssid: "Wi-Fi: tarmoq nomini (SSID) kiriting.",
      wifiPass: "Wi-Fi: parol kamida 8 belgi bo‘lishi kerak.",
      queue: "Tezlik cheklovi: Mbit/s’da raqam kiriting.",
      adminUser: "Foydalanuvchi nomi: faqat harf, raqam va . _ -",
      adminPass: "Router parolini kiriting — usiz Administrator bloki tuzilmaydi.",
      adminWeak: "Parol 8 belgidan qisqa.",
    },

    code: {
      resetHint: "Bo'sh konfiguratsiyaga qaytarish (router qayta yuklanadi)",
      importHint: "Faylni Files'ga yuklagandan keyin",
      emptyOnly: "BO'SH konfiguratsiyada ishlating (no-defaults):",
      disableAdmin: "Avval yangi foydalanuvchi bilan kiring, keyin admin'ni o'chiring:",
    },
    codeTitle: {
      identity: "Router nomi",
      bridge: "Bridge va LAN portlar",
      wan: "Internet (WAN)",
      lan: "LAN manzil va DHCP server",
      lists: "Interfeys ro'yxatlari",
      dns: "DNS",
      nat: "NAT",
      firewall: "Firewall",
      forwards: "Port ochish",
      wifi: "Wi-Fi",
      queue: "Tezlik cheklovi",
      services: "Keraksiz xizmatlarni yopish",
      time: "Vaqt va NTP",
      users: "Administrator",
      cloud: "MikroTik Cloud DDNS",
      backup: "Zaxira nusxa",
    },

    faq: {
      defaultLogin: {
        q: "Zavod IP manzili, logini va paroli qanday?",
        a: "Zavod sozlamasida: IP `192.168.88.1`, foydalanuvchi `admin`. Eski qurilmalarda parol bo‘sh, yangilarida tasodifiy parol routerning stikerida yozilgan. No-defaults reset’dan keyin routerda umuman IP bo‘lmaydi — Winbox’da MAC manzil orqali ulaning (Neighbors bo‘limi).",
      },
      winbox: {
        q: "Winbox’ni qayerdan olaman va qanday ulanaman?",
        a: "Winbox’ni rasmiy sayt mikrotik.com/download’dan yuklab oling (Windows, macOS, Linux). Kompyuterni WAN’dan boshqa istalgan portga ulang, Winbox → Neighbors → MAC manzilni bosing → login → Connect. MAC orqali ulanish routerda IP bo‘lmasa ham ishlaydi. IP bo‘lsa, brauzerda WebFig’ni ham ochish mumkin: http://192.168.88.1.",
      },
      reset: {
        q: "Routerni noldan qanday tozalayman (reset)?",
        a: "Terminal orqali — router bo‘sh konfiguratsiya bilan qayta yuklanadi:",
        n: "Tugma bilan: RESET’ni bosib turib routerni tokka ulang, chiroq lip-lip qila boshlaganda (taxminan 5 soniya) qo‘yib yuboring — zavod sozlamasi qaytadi. Uzoqroq bosib tursangiz CAPsMAN, keyin Netinstall rejimiga o‘tadi.",
      },
      apply: {
        q: "Tayyor skriptni qanday ishga tushiraman?",
        a: "Eng yaxshi yo‘li: “.rsc yuklab olish”ni bosing, faylni Winbox’dagi Files’ga sudrab tashlang va New Terminal’da bering:",
        n: "RouterOS v7 da oxiriga `verbose=yes` qo‘shsangiz, har bir qator va xato aynan qayerda ekanini ko‘rasiz. Bloklarni bittalab New Terminal’ga joylasa ham bo‘ladi. Bo‘sh konfiguratsiyada ishlating — aks holda bridge, DHCP va boshqalar allaqachon mavjud bo‘lishi mumkin.",
      },
      runAfterReset: {
        q: "Skript reset’dan keyin o‘zi ishga tushishi mumkinmi?",
        a: "Ha. Faylni Files’ga yuklang va bering:",
        n: "Fayl yuklanish paytida, portlar tayyor bo‘lmasdan ishga tushadi — shuning uchun faylning birinchi qatoriga `:delay 15s` yozing. flash papkasi bor eski qurilmalarda yo‘l `flash/kattabaza.rsc` bo‘ladi.",
      },
      safeMode: {
        q: "Sozlayotganda routerdan uzilib qolmaslik uchun nima qilay?",
        a: "Safe Mode’ni yoqing: Winbox’dagi “Safe Mode” tugmasi yoki terminalda Ctrl+X. Ulanish uzilsa, shu paytdan beri qilingan hamma o‘zgarishlar avtomatik bekor bo‘ladi. O‘zgarishlarni saqlash uchun yana bir marta bosing.",
      },
      lostAccess: {
        q: "Skriptni berdim va routerga kira olmay qoldim",
        a: "Kabelni LAN portga (WAN emas) ulang va Winbox → Neighbors’da MAC orqali ulaning — skript LAN’dan MAC Winbox’ni ochiq qoldiradi. Router ro‘yxatda chiqmasa, tugma bilan reset qiling va faylni qayta bering.",
      },
      noInternet: {
        q: "Router sozlandi, lekin internet yo‘q",
        a: "New Terminal’da bosqichma-bosqich tekshiring:",
        n: "8.8.8.8 javob bermasa — muammo WAN tomonda: kabel, DHCP holati (bound), PPPoE holati (connected) yoki provayder sozlamasi. 8.8.8.8 ishlaydi, google.com yo‘q — DNS. Routerda internet bor, qurilmalarda yo‘q — NAT (masquerade) qoidasi yoki qurilmaning IP/shlyuzi.",
      },
      pppoe: {
        q: "PPPoE ulanmayapti",
        a: "Holat va logga qarang:",
        n: "“authentication failed” — login yoki parol xato. “initializing”da qotib qolsa — kabel boshqa portda, VLAN kerak yoki provayder eski routerning MAC’iga bog‘lagan (MAC klon maydonidan foydalaning). Ba’zi provayderlar Service name talab qiladi.",
      },
      mtu: {
        q: "PPPoE’da ba’zi saytlar sekin yoki chala ochiladi",
        a: "Odatda MTU sababli. MTU’ni kamaytiring va TCP MSS’ni moslang:",
      },
      greyIp: {
        q: "IP’im “oq” (ommaviy) yoki provayder NAT’i ortidami — qanday bilaman?",
        a: "Routerdagi WAN manzilni KattaBaza bosh sahifasidagi IP bilan solishtiring:",
        n: "Ular farq qilsa yoki WAN manzil 10.x.x.x, 172.16–31.x.x, 192.168.x.x yoki 100.64–127.x.x bo‘lsa — siz provayder NAT’i (CGNAT) ortidasiz. Port ochish va tashqaridan Winbox ishlamaydi — provayderdan oq IP so‘rang.",
      },
      devices: {
        q: "Ulangan qurilmalarni qanday ko‘raman?",
        a: "Lease’larda har bir qurilmaning nomi, IP va MAC’i; registration table’da Wi-Fi mijozlari:",
        n: "Yangi wifi drayverida (v7, ax modellar): `/interface wifi registration-table print`. Winbox’da: IP → DHCP Server → Leases.",
      },
      staticLease: {
        q: "Qurilmaga doimiy IP qanday beraman?",
        a: "Uning hozirgi DHCP lease’ini statik qiling (IP’ni o‘zingiznikiga almashtiring):",
        n: "Yoki Winbox’da: IP → DHCP Server → Leases → qurilma ustiga ikki marta bosing → Make Static. Shundan keyin o‘sha oynada manzilni o‘zgartirish mumkin.",
      },
      portForward: {
        q: "Port ochdim, lekin ishlamayapti",
        a: "Tekshiring: 1) IP’ingiz oq (yuqoridagi savolga qarang); 2) qurilma IP’si o‘zgarmaydi (lease’ni statik qiling); 3) qurilmaning o‘z firewall’i portga ruxsat beradi; 4) tashqaridan (mobil internetdan) tekshiryapsiz, LAN ichidan emas. LAN ichidan ham ishlashi uchun hairpin NAT qo‘shing:",
        n: "Hairpin uchun dstnat qoidasi `in-interface-list=WAN` o‘rniga `dst-address=<oq IP’ingiz>` bo‘yicha tutishi kerak.",
      },
      speedDevice: {
        q: "Bitta qurilmaning tezligini qanday cheklayman?",
        a: "Uning IP’si uchun simple queue qo‘shing (yuborish/yuklab olish):",
        n: "Queue FastTrack’dan o‘tgan trafikka ta’sir qilmaydi — ikkinchi qator FastTrack’ni o‘chiradi. Tezlik cheklovi yoqilganda generator buni o‘zi qiladi.",
      },
      blockSite: {
        q: "Saytni qanday bloklayman (masalan TikTok)?",
        a: "RouterOS v7 da eng oson yo‘li — DNS orqali, va hamma qurilmani router DNS’idan foydalanishga majburlash:",
        n: "“Xavfsiz DNS” (DoH) yoqilgan brauzerlar buni chetlab o‘tishi mumkin — brauzerda o‘chiring yoki DoH serverlarini bloklang.",
      },
      update: {
        q: "RouterOS va firmware’ni qanday yangilayman?",
        a: "Avval zaxira nusxa oling. `install` yangilanishni yuklab, routerni qayta yuklaydi:",
        n: "`routerboard upgrade` bootloader’ni ham shu versiyaga ko‘taradi — yana bir qayta yuklashdan keyin kuchga kiradi.",
      },
      forgotPassword: {
        q: "Router parolini unutdim",
        a: "Parolni tiklab bo‘lmaydi. Tugma bilan reset qiling (reset savoliga qarang) — sozlamalar ham o‘chadi. Bu ham yordam bermasa, Netinstall bilan qayta o‘rnating (mikrotik.com/download). Shuning uchun generator oxirida zaxira nusxa oladi.",
      },
      backup: {
        q: "Zaxira nusxa qanday olinadi va tiklanadi?",
        a: "Saqlash, eksport va tiklash:",
        n: ".backup — to‘liq ikkilik nusxa, faqat shu modelning o‘ziga tiklang. .rsc eksport — o‘qiladigan matn, boshqa routerga ham import qilsa bo‘ladi (`/import file-name=myconfig.rsc`). Ikkala faylni Files’dan kompyuterga yuklab oling.",
      },
      logs: {
        q: "Loglar va xatolarni qayerda ko‘raman?",
        a: "Winbox’da — Log menyusi. Terminalda (`follow` yangi qatorlarni jonli ko‘rsatadi, chiqish Ctrl+C):",
      },
      doubleNat: {
        q: "MikroTik’dan oldin provayder modemi turibdi",
        a: "Bu ikki qavat NAT (double NAT). Ishlaydi, lekin port ochish, ba’zi o‘yinlar va IP-telefoniya qiynaladi. Yaxshisi: provayder modemini bridge rejimiga o‘tkazib, PPPoE’ni MikroTik’da sozlang yoki modemning DMZ’iga MikroTik manzilini qo‘ying. Generatorda WAN uchun DHCP tanlang.",
      },
      failover: {
        q: "Ikkita provayderni qanday ulayman (zaxira internet)?",
        a: "Ikkinchi provayder ether2’da: uni bridge’dan chiqaring, WAN ro‘yxatiga qo‘shing, provayder bergan manzilni bering va distance’i har xil ikkita default marshrut qo‘shing (statik shlyuzlar bilan misol):",
        n: "ISP1 shlyuzi ping’ga javob bermay qolsa, trafik ISP2 orqali ketadi. Provayder DHCP yoki PPPoE bo‘lsa, uning mijozida `default-route-distance` ni qo‘ying (1 — asosiy, 2 — zaxira).",
      },
      scheduleReboot: {
        q: "Routerni har kecha avtomatik qayta yuklash",
        a: "Odatda kerak emas, lekin beqaror provayderda yordam beradi:",
        n: "O‘chirish: `/system scheduler remove night-reboot`.",
      },
      versions: {
        q: "RouterOS v6 yoki v7 — qaysi biri?",
        a: "Versiya va modelni tekshiring:",
        n: "Yangi qurilmalarning hammasiga v7 tavsiya etiladi (ax modellar, RB5009 va L009 faqat v7 ni qo‘llaydi); v6 faqat eski qurilmalarda qolgan. Farq Wi-Fi (wireless yoki wifi) va NTP’da seziladi — generator buni hisobga oladi.",
      },
      wifiInvisible: {
        q: "Wi-Fi tarmog‘i ko‘rinmayapti",
        a: "Interfeys o‘chiq (X), band noto‘g‘ri yoki paket o‘rnatilmagan bo‘lishi mumkin:",
        n: "Yangi drayver uchun: `/interface wifi print` va `/interface wifi enable [find]`. hAP ax’da wifi paketi (wifi-qcom) o‘rnatilgan bo‘lishi kerak: System → Packages.",
      },
      remoteAccess: {
        q: "Routerni tashqaridan qanday boshqaraman?",
        a: "Winbox’ni (8291-port) hech qachon butun internetga ochmang. Generatorda “Internetdan Winbox”ni yoqib, o‘z tashqi IP’laringizni kiriting — faqat ular ulana oladi. Undan ham yaxshisi — VPN (v7 da WireGuard) sozlab, u orqali ulaning. IP o‘zgarib tursa, MikroTik Cloud DDNS doimiy nom beradi.",
      },
      dnsFlush: {
        q: "Sayt ko‘chdi, lekin eski manzil ochilyapti",
        a: "Routerning DNS keshini tozalang:",
        n: "Windows’da `ipconfig /flushdns` ni ham bering.",
      },
      changePass: {
        q: "Parolni terminaldan qanday o‘zgartiraman?",
        a: "To‘g‘ridan-to‘g‘ri:",
        n: "Yoki shunchaki `/password` deb yozing — eski va yangi parolni so‘raydi.",
      },
      slowSpeed: {
        q: "Internet tarifdagidan sekin",
        a: "Protsessor yuklamasi va FastTrack’ni ko‘ring:",
        n: "Protsessor 100% ga yaqin bo‘lsa — FastTrack yoqilgan bo‘lishi (uchinchi buyruq qoidani topishi), keraksiz queue/mangle qoidalari o‘chirilgan bo‘lishi kerak. Wi-Fi tezligi masofa va diapazonga bog‘liq — avval kabel orqali o‘lchang.",
      },
    },
  },

  // ================================================================== РУССКИЙ
  ru: {
    title: "Настройка MikroTik",
    subtitle: "Запуск роутера с нуля: команды для терминала и те же шаги в Winbox — в одном месте",
    tabSetup: "Настройка",
    tabFaq: "Вопросы",

    gRouter: "Роутер",
    gWan: "Интернет (WAN)",
    gLan: "Локальная сеть (LAN)",
    gWifi: "Wi-Fi",
    gSecurity: "Безопасность и доступ",
    gExtras: "Дополнительно",
    gForwards: "Проброс портов",

    model: "Модель",
    modelCustom: "Другая / вручную",
    version: "Версия RouterOS",
    versionHint: "рекомендуется v7; ax, RB5009 и L009 работают только на v7",
    ports: "Порты Ethernet",
    sfp: "SFP-порт",
    none: "нет",
    identity: "Имя роутера",
    timezone: "Часовой пояс",

    wanPort: "Порт интернета",
    wanType: "Тип подключения",
    typeDhcp: "DHCP (автоматически)",
    typeStatic: "Статический IP",
    typePppoe: "PPPoE (логин/пароль)",
    ip: "IP-адрес",
    mask: "Маска",
    gateway: "Шлюз",
    pppoeUser: "Логин",
    pppoePass: "Пароль",
    pppoeService: "Service name",
    pppoeMtu: "MTU",
    auto: "авто",
    optional: "необязательно",
    vlan: "VLAN ID",
    vlanHint: "только если требует провайдер",
    mac: "MAC-адрес (клон)",
    macHint: "если провайдер привязал MAC старого роутера",
    dnsMode: "DNS-серверы",
    dnsIsp: "От провайдера",
    dnsCustom: "Свои",
    dnsServers: "Адреса DNS",

    lanPorts: "Порты LAN (bridge)",
    lanIp: "IP роутера",
    lanPrefix: "Префикс / маска",
    dhcpServer: "DHCP-сервер (автоматические IP для устройств)",
    poolStart: "Начало пула",
    poolEnd: "Конец пула",
    leaseTime: "Срок аренды",

    wifiOn: "Включить Wi-Fi",
    wifiDriver: "Драйвер Wi-Fi",
    driverWireless: "wireless (hAP lite / ac, v6 и v7)",
    driverWifi: "wifi (модели ax, v7.13+)",
    ssid: "Имя сети (SSID)",
    wifiPass: "Пароль Wi-Fi",
    country: "Страна",
    countryDefault: "не менять",

    firewall: "Firewall (рекомендуется)",
    firewallHint: "закрывает роутер и LAN от интернета",
    harden: "Закрыть лишние сервисы",
    hardenHint: "telnet, ftp, api выключены; Winbox/SSH только из LAN",
    adminUser: "Пользователь",
    adminUserHint: "admin или новый пользователь",
    adminPass: "Новый пароль",
    wanWinbox: "Winbox из интернета",
    wanWinboxFrom: "Разрешённые IP",
    wanWinboxHint: "только эти внешние IP, через запятую",

    fwdAdd: "Добавить правило",
    fwdName: "Название",
    fwdProto: "Протокол",
    fwdExt: "Внешний порт",
    fwdIp: "IP устройства",
    fwdInt: "Внутренний порт",
    fwdEmpty: "Правил нет. Пример: камера 8080 → 192.168.88.20:80.",
    remove: "Удалить",

    queue: "Ограничение скорости для всей LAN",
    queueDown: "Загрузка",
    queueUp: "Отдача",
    mbps: "Мбит/с",
    ddns: "MikroTik Cloud DDNS",
    ntp: "Синхронизация времени (NTP)",
    backup: "Сделать бэкап в конце",

    resetForm: "Сбросить форму",
    secretNote: "Пароли не сохраняются в браузере и никуда не отправляются — всё формируется прямо на этой странице.",

    outTitle: "Готовая конфигурация",
    viewTerminal: "Терминал",
    viewWinbox: "Winbox (интерфейс)",
    copyAll: "Скопировать всё",
    copied: "Скопировано",
    download: "Скачать .rsc",
    copy: "Копировать",
    notInFile: "не в файле",
    warnTitle: "Проверьте эти поля",

    faqTitle: "Частые вопросы",
    faqSearch: "Поиск по вопросам…",
    faqEmpty: "Ничего не найдено.",

    sec: {
      prep: "Перед началом",
      identity: "Имя роутера",
      bridge: "Bridge и порты LAN",
      wan: "Интернет (WAN)",
      lan: "Адрес LAN и DHCP-сервер",
      lists: "Списки интерфейсов",
      dns: "DNS",
      nat: "NAT — интернет для LAN",
      firewall: "Firewall",
      forwards: "Проброс портов",
      wifi: "Wi-Fi",
      queue: "Ограничение скорости",
      services: "Закрыть лишние сервисы",
      time: "Время и NTP",
      users: "Администратор",
      cloud: "MikroTik Cloud DDNS",
      backup: "Бэкап",
      check: "Проверка",
    },
    secDesc: {
      prep: "Подключиться, сбросить в ноль и применить файл.",
      identity: "Имя, которое видно в Winbox и в приглашении терминала.",
      bridge: "Объединяет порты LAN в одну сеть.",
      wan: "Как роутер получает интернет от провайдера.",
      lan: "Адрес роутера в вашей сети и автоматические IP для устройств.",
      lists: "Группы WAN / LAN — на них опираются firewall и NAT.",
      dns: "Разрешение имён для роутера и устройств.",
      nat: "Раздаёт один интернет-адрес всем устройствам.",
      firewall: "Закрывает доступ к роутеру и LAN из интернета.",
      forwards: "Открывает порты к устройствам внутри (камеры, серверы, игры).",
      wifi: "Точка доступа с паролем WPA2/WPA3.",
      queue: "Общий лимит скорости для всей LAN.",
      services: "Winbox, SSH и WebFig доступны только из LAN.",
      time: "Правильный часовой пояс — логи и расписания показывают верное время.",
      users: "Новый пароль для входа на роутер.",
      cloud: "Постоянное имя для внешнего адреса роутера.",
      backup: "Сохраняет готовую конфигурацию на роутере.",
      check: "Убедиться, что интернет работает.",
    },

    steps: {
      prep: ({ wan, lan, file }) => [
        `Кабель провайдера — в ${c(wan)}, компьютер — в любой порт LAN, например ${c(lan)}.`,
        `Скачайте **Winbox** с mikrotik.com/download и откройте. На вкладке **Neighbors** нажмите **MAC-адрес** роутера, войдите как ${c("admin")} (пароль пустой или с наклейки) → **Connect**.`,
        `Начать с нуля (рекомендуется): **System → Reset Configuration** → ✓ No Default Configuration, ✓ Do Not Backup → **Reset Configuration**. Роутер перезагрузится — снова подключитесь по MAC.`,
        `Нажмите **Скачать .rsc** ниже, перетащите файл в окно **Files** в Winbox, откройте **New Terminal** и выполните ${c(`/import file-name=${file}`)}.`,
        `Или вставляйте блоки ниже по одному в **New Terminal** (правая кнопка → Paste).`,
      ],
      identity: ({ name }) => [`**System → Identity** → Name: ${c(name)} → **OK**.`],
      bridge: ({ bridge, ports }) =>
        [
          `**Bridge** → вкладка **Bridge** → **+** → Name: ${c(bridge)} → **OK**.`,
          ports.length
            ? `Вкладка **Ports** → **+** → Interface: ${c(ports[0])}, Bridge: ${c(bridge)} → **OK**.${
                ports.length > 1 ? ` Повторите для ${cs(ports.slice(1))}.` : ""
              }`
            : null,
        ].filter(Boolean),
      wanMac: ({ port, mac }) => [
        `**Interfaces** → двойной клик по ${c(port)} → **General** → MAC Address: ${c(mac)} → **OK**.`,
      ],
      wanVlan: ({ port, vlan, name }) => [
        `**Interfaces → VLAN** → **+** → Name: ${c(name)}, VLAN ID: ${c(vlan)}, Interface: ${c(port)} → **OK**.`,
      ],
      wanDhcp: ({ iface, peer }) => [
        `**IP → DHCP Client** → **+** → Interface: ${c(iface)}, Use Peer DNS: ${peer ? "✓" : "✗"}, Add Default Route: ${c("yes")} → **OK**.`,
        `Дождитесь статуса **bound** и появления IP-адреса.`,
      ],
      wanStatic: ({ iface, addr, gw }) => [
        `**IP → Addresses** → **+** → Address: ${c(addr)}, Interface: ${c(iface)} → **OK**.`,
        `**IP → Routes** → **+** → Dst. Address: ${c("0.0.0.0/0")}, Gateway: ${c(gw)} → **OK**.`,
      ],
      wanPppoe: ({ iface, user, service, mtu, peer }) => [
        `**PPP** → вкладка **Interface** → **+** → **PPPoE Client**.`,
        `**General**: Name ${c("pppoe-out1")}, Interfaces: ${c(iface)}${mtu ? `, Max MTU / Max MRU: ${c(mtu)}` : ""}.`,
        `**Dial Out**: User ${c(user)}, Password — из договора с провайдером${service ? `, Service ${c(service)}` : ""}, Use Peer DNS ${peer ? "✓" : "✗"}, ✓ Add Default Route → **OK**.`,
        `Статус внизу окна должен стать **connected**.`,
      ],
      lan: ({ bridge, addr }) => [`**IP → Addresses** → **+** → Address: ${c(addr)}, Interface: ${c(bridge)} → **OK**.`],
      dhcpServer: ({ bridge, net, gw, pool, dns, lease }) => [
        `**IP → DHCP Server** → **DHCP Setup** → DHCP Server Interface: ${c(bridge)} → **Next**.`,
        `Address space ${c(net)} → Gateway ${c(gw)} → Addresses to give out ${c(pool)} → DNS servers ${c(dns)} → Lease time ${c(lease)} → **Next** до конца.`,
      ],
      lists: ({ wan, lan }) => [
        `**Interfaces → Interface List** → **Lists** → **+** → Name ${c("WAN")} → **OK**; так же для ${c("LAN")}.`,
        `В самом **Interface List**: **+** → List ${c("WAN")}, Interface ${c(wan)} → **OK**; **+** → List ${c("LAN")}, Interface ${c(lan)} → **OK**.`,
      ],
      dns: ({ servers, remote, ip }) =>
        [
          `**IP → DNS** → Servers: ${servers ? c(servers) : "оставьте пустым (выдаёт провайдер)"}, Allow Remote Requests ${remote ? "✓" : "✗"} → **OK**.`,
          remote ? `**Static** → **+** → Name ${c("router.lan")}, Address ${c(ip)} → **OK** (чтобы открывать роутер по имени).` : null,
        ].filter(Boolean),
      nat: () => [
        `**IP → Firewall → NAT** → **+** → **General**: Chain ${c("srcnat")}, Out. Interface List ${c("WAN")} → **Action**: ${c("masquerade")} → **OK**.`,
      ],
      firewall: ({ fasttrack }) => [
        `**IP → Firewall → Filter Rules** → добавьте правила **строго в этом порядке** (каждое: **+** → General / Advanced / Action). Вставить блок в терминал гораздо быстрее.`,
        ...(fasttrack ? [] : ["FastTrack не добавлен намеренно — с ним не работает ограничение скорости (queue)."]),
      ],
      winboxWan: ({ ips }) => [
        `**IP → Firewall → Address Lists** → **+** → Name ${c("winbox-remote")}, Address: ${c(ips)}. Правило accept для порта ${c("8291")} должно стоять **выше** «drop all not coming from LAN».`,
      ],
      forwards: () => [
        `**IP → Firewall → NAT** → **+** для каждого правила: **General**: Chain ${c("dstnat")}, Protocol, Dst. Port (внешний), In. Interface List ${c("WAN")} → **Action**: ${c("dst-nat")}, To Addresses (IP устройства), To Ports (внутренний порт) → **OK**.`,
      ],
      wifiLegacy: ({ ssid, bridge }) => [
        `**Wireless → Security Profiles** → **+** → Name ${c("kattabaza")}, Mode ${c("dynamic keys")}, ✓ WPA2 PSK, WPA2 Pre-Shared Key — ваш пароль → **OK**.`,
        `**Wireless → WiFi Interfaces** → двойной клик по ${c("wlan1")} → **Wireless**: Mode ${c("ap bridge")}, Band ${c("2GHz-B/G/N")}, SSID ${c(ssid)}, Security Profile ${c("kattabaza")}, WPS Mode ${c("disabled")} → **OK** → включите (✓).`,
        `Если есть ${c("wlan2")} (5 ГГц) — так же, Band ${c("5GHz-A/N/AC")}.`,
        `**Bridge → Ports** → **+** → Interface ${c("wlan1")} (и ${c("wlan2")}), Bridge ${c(bridge)} → **OK**.`,
      ],
      wifiNew: ({ ssid, bridge }) => [
        `**WiFi** → вкладка **WiFi** → двойной клик по ${c("wifi1")} → **Configuration**: Mode ${c("ap")}, SSID ${c(ssid)}, Country → **Security**: ✓ WPA2 PSK, ✓ WPA3 PSK, Passphrase — ваш пароль → **OK** → включите (✓).`,
        `Повторите для ${c("wifi2")} (второй диапазон).`,
        `**Bridge → Ports** → **+** → Interface ${c("wifi1")} (и ${c("wifi2")}), Bridge ${c(bridge)} → **OK**.`,
      ],
      queue: ({ target, up, down }) => [
        `**Queues → Simple Queues** → **+** → Name ${c("lan-limit")}, Target ${c(target)}, Max Limit: Upload ${c(up)}, Download ${c(down)} → **OK**.`,
      ],
      services: ({ net, winbox }) => [
        `**IP → Services** → отключите (✗) ${cs(["telnet", "ftp", "api", "api-ssl"])}.`,
        `Двойной клик по ${c("www")} и ${c("ssh")} → Available From ${c(net)}; ${c("winbox")} → ${c(winbox)} → **OK**.`,
        `**Tools → MAC Server** → MAC Telnet Server и MAC Winbox Server → Allowed Interface List ${c("LAN")}.`,
        `**IP → Neighbors → Discovery Settings** → Interface List ${c("LAN")}. **Tools → BTest Server** → ✗ Enabled.`,
      ],
      time: ({ tz, ntp }) =>
        [
          `**System → Clock** → ✗ Time Zone Autodetect, Time Zone Name ${c(tz)} → **OK**.`,
          ntp ? `**System → NTP Client** → ✓ Enabled, Servers ${cs(["0.pool.ntp.org", "1.pool.ntp.org"])} → **OK**.` : null,
        ].filter(Boolean),
      userSet: () => [
        `**System → Users** → выберите ${c("admin")} → **Password** → дважды введите новый пароль → **OK**.`,
        `Запишите пароль — восстановить его нельзя, только сбросить роутер.`,
      ],
      userAdd: ({ name }) => [
        `**System → Users** → **+** → Name ${c(name)}, Group ${c("full")}, Password (дважды) → **OK**.`,
        `Выйдите и войдите заново как ${c(name)}. Только после этого отключите ${c("admin")} (выбрать → ✗) — в скрипте эта строка намеренно закомментирована.`,
      ],
      cloud: () => [
        `**IP → Cloud** → ✓ DDNS Enabled → **Apply**. Через минуту в DNS Name появится адрес вида ${c("xxxx.sn.mynetname.net")} — он всегда ведёт на ваш роутер.`,
      ],
      backup: ({ name }) => [
        `**Files → Backup** → Name ${c(name)}, ✓ Don't Encrypt → **Backup**.`,
        `Перетащите ${c(name + ".backup")} и ${c(name + ".rsc")} из **Files** на компьютер и сохраните.`,
      ],
      check: () => [
        `В **New Terminal** выполните команды ниже — каждый ping должен получить ответы.`,
        `На компьютере переподключите кабель (или Wi-Fi) и откройте любой сайт.`,
        `Посмотрите свой IP на главной странице KattaBaza — теперь это должен быть адрес провайдера.`,
      ],
    },

    warn: {
      lanIp: "LAN: неверный IP роутера или префикс (допустимо /8–/30).",
      dns: "DNS: укажите один или несколько IPv4, например 1.1.1.1, 8.8.8.8.",
      noLan: "Нет портов LAN и Wi-Fi выключен — компьютер некуда подключить.",
      mac: "Формат MAC-адреса: AA:BB:CC:DD:EE:FF.",
      vlan: "VLAN ID должен быть 1–4094.",
      staticIp: "Статический IP: укажите IP-адрес от провайдера.",
      staticMask: "Статический IP: неверная маска (например 255.255.255.0 или 24).",
      staticGw: "Статический IP: укажите шлюз.",
      gwOutside: "Шлюз вне подсети IP/маски — уточните у провайдера.",
      overlap: "Подсети WAN и LAN пересекаются — смените IP LAN (например 192.168.10.1).",
      pppoeUser: "PPPoE: укажите логин.",
      pppoePass: "PPPoE: укажите пароль.",
      mtu: "MTU должен быть 576–1500 (обычно 1480 или 1492).",
      pool: "Пул DHCP: адреса должны быть внутри подсети LAN, начало ≤ конца.",
      winboxIps: "Winbox из интернета: укажите IP, которым разрешено подключаться.",
      noFirewall: "Firewall выключен — роутер открыт в интернет. Не рекомендуется.",
      winboxNoFirewall: "Без firewall Winbox доступен из всего интернета.",
      forward: (n) => `Проброс портов №${n}: проверьте порты и IP устройства.`,
      forwardOutside: (n) => `Проброс портов №${n}: IP устройства не в подсети LAN.`,
      ssid: "Wi-Fi: укажите имя сети (SSID).",
      wifiPass: "Wi-Fi: пароль должен быть не короче 8 символов.",
      queue: "Ограничение скорости: укажите числа в Мбит/с.",
      adminUser: "Имя пользователя: только буквы, цифры и . _ -",
      adminPass: "Задайте пароль роутера — без него блок «Администратор» не формируется.",
      adminWeak: "Пароль короче 8 символов.",
    },

    code: CODE_EN,
    codeTitle: CODE_TITLE_EN,

    faq: {
      defaultLogin: {
        q: "Какие IP, логин и пароль по умолчанию?",
        a: "С заводской конфигурацией: IP `192.168.88.1`, пользователь `admin`. На старых устройствах пароль пустой, на новых — случайный пароль на наклейке. После сброса no-defaults у роутера вообще нет IP — подключайтесь в Winbox по MAC-адресу (вкладка Neighbors).",
      },
      winbox: {
        q: "Где взять Winbox и как подключиться?",
        a: "Скачайте Winbox с официального сайта mikrotik.com/download (Windows, macOS, Linux). Подключите компьютер в любой порт, кроме WAN, откройте Winbox → Neighbors → нажмите MAC-адрес → логин → Connect. Подключение по MAC работает, даже если у роутера нет IP. Если IP есть, можно открыть и WebFig в браузере: http://192.168.88.1.",
      },
      reset: {
        q: "Как сбросить роутер в ноль?",
        a: "Из терминала — роутер перезагрузится с пустой конфигурацией:",
        n: "Кнопкой: зажмите RESET, включите питание и отпустите, когда индикатор начнёт мигать (около 5 секунд) — вернётся заводская конфигурация. Если держать дольше, роутер перейдёт в режим CAPsMAN, а затем Netinstall.",
      },
      apply: {
        q: "Как применить готовый скрипт?",
        a: "Лучше всего: нажмите «Скачать .rsc», перетащите файл в Files в Winbox и выполните в New Terminal:",
        n: "На RouterOS v7 добавьте `verbose=yes` — увидите каждую строку и где именно ошибка. Можно и вставлять блоки по одному в New Terminal. Применяйте на пустой конфигурации — иначе bridge, DHCP и прочее уже могут существовать.",
      },
      runAfterReset: {
        q: "Можно ли запустить скрипт автоматически сразу после сброса?",
        a: "Да. Загрузите файл в Files и выполните:",
        n: "Файл выполняется при загрузке, когда порты ещё не готовы, поэтому первой строкой файла поставьте `:delay 15s`. На старых устройствах с папкой flash путь — `flash/kattabaza.rsc`.",
      },
      safeMode: {
        q: "Как не потерять доступ во время настройки?",
        a: "Включите Safe Mode: кнопка «Safe Mode» в Winbox или Ctrl+X в терминале. Если связь оборвётся, все изменения с этого момента откатятся автоматически. Нажмите ещё раз, чтобы сохранить изменения.",
      },
      lostAccess: {
        q: "Применил скрипт и потерял доступ к роутеру",
        a: "Подключите кабель в порт LAN (не WAN) и в Winbox → Neighbors подключитесь по MAC — скрипт оставляет MAC Winbox доступным из LAN. Если роутера нет в списке, сбросьте его кнопкой и примените файл заново.",
      },
      noInternet: {
        q: "Роутер настроен, но интернета нет",
        a: "Проверяйте по шагам в New Terminal:",
        n: "Нет ответа от 8.8.8.8 — проблема на стороне WAN: кабель, статус DHCP (bound), статус PPPoE (connected) или настройки провайдера. 8.8.8.8 отвечает, а google.com нет — DNS. На роутере интернет есть, а на устройствах нет — правило NAT (masquerade) или IP/шлюз устройства.",
      },
      pppoe: {
        q: "PPPoE не подключается",
        a: "Посмотрите статус и лог:",
        n: "«authentication failed» — неверный логин или пароль. Висит на «initializing» — кабель не в том порту, нужен VLAN или провайдер привязал MAC старого роутера (используйте поле «MAC-адрес (клон)»). Некоторые провайдеры требуют Service name.",
      },
      mtu: {
        q: "По PPPoE некоторые сайты открываются медленно или не до конца",
        a: "Обычно дело в MTU. Уменьшите MTU и подрежьте TCP MSS:",
      },
      greyIp: {
        q: "Как узнать, «белый» у меня IP или я за NAT провайдера?",
        a: "Сравните адрес WAN на роутере с IP на главной странице KattaBaza:",
        n: "Если они различаются или адрес WAN из диапазонов 10.x.x.x, 172.16–31.x.x, 192.168.x.x или 100.64–127.x.x — вы за NAT провайдера (CGNAT). Проброс портов и Winbox извне работать не будут — попросите у провайдера белый IP.",
      },
      devices: {
        q: "Как посмотреть подключённые устройства?",
        a: "В lease — имя, IP и MAC каждого устройства; в registration table — клиенты Wi-Fi:",
        n: "С новым драйвером wifi (v7, модели ax): `/interface wifi registration-table print`. В Winbox: IP → DHCP Server → Leases.",
      },
      staticLease: {
        q: "Как закрепить за устройством постоянный IP?",
        a: "Сделайте его текущую аренду DHCP статической (подставьте свой IP):",
        n: "Или в Winbox: IP → DHCP Server → Leases → двойной клик по устройству → Make Static. После этого адрес можно поменять в том же окне.",
      },
      portForward: {
        q: "Пробросил порт, но не работает",
        a: "Проверьте: 1) IP белый (см. вопрос выше); 2) у устройства не меняется IP (сделайте аренду статической); 3) firewall самого устройства пропускает порт; 4) проверяете снаружи (мобильный интернет), а не из LAN. Чтобы работало и изнутри LAN, добавьте hairpin NAT:",
        n: "Для hairpin правило dstnat должно ловить `dst-address=<ваш белый IP>` вместо `in-interface-list=WAN`.",
      },
      speedDevice: {
        q: "Как ограничить скорость одному устройству?",
        a: "Добавьте simple queue для его IP (отдача/загрузка):",
        n: "Очереди не действуют на трафик FastTrack, поэтому вторая строка выключает FastTrack. Генератор делает это сам, когда включено ограничение скорости.",
      },
      blockSite: {
        q: "Как заблокировать сайт (например TikTok)?",
        a: "Проще всего на RouterOS v7 — через DNS, заставив все устройства пользоваться DNS роутера:",
        n: "Браузеры с «безопасным DNS» (DoH) могут это обойти — отключите его в браузере или заблокируйте серверы DoH.",
      },
      update: {
        q: "Как обновить RouterOS и прошивку?",
        a: "Сначала сделайте бэкап. `install` скачивает обновление и перезагружает роутер:",
        n: "`routerboard upgrade` обновляет загрузчик до той же версии — применяется после ещё одной перезагрузки.",
      },
      forgotPassword: {
        q: "Забыл пароль от роутера",
        a: "Пароль восстановить нельзя. Сбросьте роутер кнопкой (см. вопрос про сброс) — настройки тоже удалятся. Если не помогает — переустановите через Netinstall (mikrotik.com/download). Поэтому генератор в конце делает бэкап.",
      },
      backup: {
        q: "Как сделать бэкап и восстановить его?",
        a: "Сохранение, экспорт и восстановление:",
        n: ".backup — полная бинарная копия, восстанавливайте только на той же модели. Экспорт .rsc — читаемый текст, его можно импортировать и на другой роутер (`/import file-name=myconfig.rsc`). Скачайте оба файла из Files на компьютер.",
      },
      logs: {
        q: "Где смотреть логи и ошибки?",
        a: "В Winbox — меню Log. В терминале (`follow` показывает новые строки в реальном времени, выход Ctrl+C):",
      },
      doubleNat: {
        q: "Перед MikroTik стоит модем провайдера",
        a: "Получается двойной NAT. Работать будет, но страдают проброс портов, некоторые игры и IP-телефония. Лучше: переведите модем провайдера в режим bridge и настройте PPPoE на MikroTik, или добавьте адрес MikroTik в DMZ модема. В генераторе для WAN выберите DHCP.",
      },
      failover: {
        q: "Как подключить двух провайдеров (резервный интернет)?",
        a: "Второй провайдер на ether2: уберите порт из bridge, добавьте в список WAN, задайте адрес от провайдера и два маршрута по умолчанию с разным distance (пример со статическими шлюзами):",
        n: "Когда шлюз ISP1 перестаёт отвечать на ping, трафик уходит через ISP2. Если провайдер по DHCP или PPPoE, укажите `default-route-distance` в его клиенте (1 — основной, 2 — резерв).",
      },
      scheduleReboot: {
        q: "Как перезагружать роутер каждую ночь автоматически?",
        a: "Обычно не нужно, но помогает при нестабильном провайдере:",
        n: "Удалить: `/system scheduler remove night-reboot`.",
      },
      versions: {
        q: "RouterOS v6 или v7 — что выбрать?",
        a: "Проверьте версию и модель:",
        n: "Для всех новых устройств рекомендуется v7 (модели ax, RB5009 и L009 поддерживают только v7); v6 осталась лишь на старых. Разница заметна в Wi-Fi (wireless или wifi) и NTP — генератор это учитывает.",
      },
      wifiInvisible: {
        q: "Сеть Wi-Fi не видна",
        a: "Интерфейс может быть выключен (X), неверный band или не установлен пакет:",
        n: "Для нового драйвера: `/interface wifi print` и `/interface wifi enable [find]`. На hAP ax должен быть установлен пакет wifi (wifi-qcom): System → Packages.",
      },
      remoteAccess: {
        q: "Как управлять роутером снаружи?",
        a: "Никогда не открывайте Winbox (порт 8291) на весь интернет. В генераторе включите «Winbox из интернета» и укажите свои внешние IP — подключиться смогут только они. Ещё лучше — настроить VPN (WireGuard на v7) и подключаться через него. Если IP меняется, MikroTik Cloud DDNS даст постоянное имя.",
      },
      dnsFlush: {
        q: "Сайт переехал, а открывается старый адрес",
        a: "Очистите DNS-кеш роутера:",
        n: "В Windows также выполните `ipconfig /flushdns`.",
      },
      changePass: {
        q: "Как сменить пароль из терминала?",
        a: "Напрямую:",
        n: "Или просто введите `/password` — он спросит старый и новый пароль.",
      },
      slowSpeed: {
        q: "Интернет медленнее, чем по тарифу",
        a: "Посмотрите загрузку процессора и FastTrack:",
        n: "Если процессор под 100% — FastTrack должен быть включён (третья команда должна найти правило), а лишние queue/mangle — выключены. Скорость по Wi-Fi зависит от расстояния и диапазона — сначала измерьте по кабелю.",
      },
    },
  },
};

export function getMikrotikText(lang) {
  return TEXT[lang] || TEXT.en;
}
