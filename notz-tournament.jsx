import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import {
  Trophy, Home, LifeBuoy, User, Settings, Search, Bell, X, Check,
  ChevronRight, Lock, Unlock, Copy, Users, Clock, Gamepad2, ArrowLeft,
  Plus, LogOut, AlertCircle, Eye, EyeOff, Mail, CheckCircle2, Loader2,
  TrendingUp, Trash2, Pencil, UserPlus, LogIn, Shield, ShieldAlert,
  LayoutDashboard, Radio
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */

const GAMES = [
  { id: 'bgmi', name: 'BGMI', color: '#E8892B' },
  { id: 'freefire', name: 'Free Fire', color: '#FF5A4E' },
  { id: 'stumble', name: 'Stumble Guys', color: '#F14FA0' },
  { id: 'roblox', name: 'Roblox', color: '#4FA8F1' },
];
const gameById = (id) => GAMES.find(g => g.id === id) || GAMES[0];

const STATUS_META = {
  upcoming: { label: 'Upcoming', color: '#5B8DEF' },
  live: { label: 'Live', color: '#35D07F' },
  completed: { label: 'Completed', color: '#6B7280' },
};

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy },
  { id: 'support', label: 'Support', icon: LifeBuoy },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/*
 * DEV-ONLY ADMIN ACCOUNT
 * -----------------------------------------------------------------------
 * There is no backend in this prototype (see notes at the bottom of this
 * file), so there is nowhere to store a real credential out of the
 * client's reach. This is the closest honest approximation:
 *   - The password is never stored or compared as plaintext, only as a
 *     salted SHA-256 hash (computed with the browser's Web Crypto API).
 *   - Only the exact admin email below is eligible for the admin role;
 *     normal signup cannot create or overwrite this account.
 *   - The hash still lives in this file, so anyone with dev tools can
 *     still read it and could brute-force a weak password offline, or
 *     simply flip role to 'admin' in local storage directly. That is
 *     unavoidable in a pure client-side app \u2014 see the chat reply for
 *     what real protection would require.
 */
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD_HASH = '2aeddb611e86f3ec4363db902eef070613e8675cd7958c19a3c1b3d27a49416e';

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkAdminCredentials(email, password) {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL) return false;
  const hash = await sha256Hex(ADMIN_EMAIL + '::' + password);
  return hash === ADMIN_PASSWORD_HASH;
}

const ANNOUNCEMENTS = [
  { id: 'a1', title: 'Roblox tournaments are here', body: 'Obby Masters and Battle Royale Bash are now live on the platform — check the Roblox tab.', date: '1 day ago' },
  { id: 'a2', title: 'Scheduled maintenance', body: 'A brief maintenance window is planned for this weekend. Room unlocks may be delayed by a few minutes.', date: '2 days ago' },
  { id: 'a3', title: 'Weekend Championship results verified', body: 'The final leaderboard for last week\u2019s BGMI Weekend Championship is verified and published.', date: '3 days ago' },
];

const NOTIFICATIONS_SEED = [
  { id: 'n1', title: 'Room available', body: 'Blaze Cup room details just unlocked.', read: false, date: '10m ago' },
  { id: 'n2', title: 'Results published', body: 'Solo Showdown final standings are up.', read: false, date: '1d ago' },
  { id: 'n3', title: 'New tournament: Battle Royale Bash', body: 'A new Roblox squad tournament just went live.', read: true, date: '3d ago' },
];

function hoursFromNow(h) { return new Date(Date.now() + h * 3600000); }
function daysFromNow(d, hour, min) {
  const dt = new Date(Date.now() + d * 86400000);
  dt.setHours(hour === undefined ? 19 : hour, min === undefined ? 0 : min, 0, 0);
  return dt;
}

function buildTournaments() {
  return [
    {
      id: 't1', gameId: 'bgmi', title: 'Weekend Championship', format: 'Squad',
      entryType: 'Free', prizePool: 5000, maxParticipants: 100, currentParticipants: 64,
      status: 'upcoming', startAt: daysFromNow(2, 19, 0), regDeadline: daysFromNow(1, 18, 0),
      description: 'The flagship weekend BGMI squad tournament. Four rounds across Erangel and Miramar, capped off with a grand finale on Sanhok.',
      rules: [
        'Squads must have exactly 4 registered members at match start.',
        'Emulator use is not allowed \u2014 mobile devices only.',
        'Teaming with rival squads results in immediate disqualification.',
        'Report to the room 15 minutes before the scheduled start time.',
        'Disputed results must be raised via Support within 24 hours with screenshot proof.',
      ],
      participants: ['Team Raptor', 'Ghost Squad', 'Nova Five', 'Team Kryptic', 'Alpha Wolves', 'Silent Reapers', 'Team Vortex', 'Iron Fist'],
      matches: [{ id: 'm1', matchNumber: 1, startAt: daysFromNow(2, 19, 0), status: 'room_locked', roomId: null, roomPassword: null }],
      leaderboard: [],
    },
    {
      id: 't2', gameId: 'bgmi', title: 'Friday Night Clash', format: 'Squad',
      entryType: 'Free', prizePool: 3000, maxParticipants: 50, currentParticipants: 50,
      status: 'upcoming', startAt: daysFromNow(1, 21, 0), regDeadline: hoursFromNow(20),
      description: 'A fast, single-map Friday night clash built for squads who want one intense round instead of a long grind.',
      rules: [
        'Single-map format on Erangel \u2014 no reschedules for late squads.',
        'All 4 squad members must use registered in-game names.',
        'Hacking or use of third-party tools is an instant, permanent ban.',
        'Room ID and password unlock 15 minutes before the match.',
      ],
      participants: ['Team Omega', 'Dark Phoenix', 'Squad Zero', 'Team Havoc', 'Blitz Kings', 'Team Rampage'],
      matches: [{ id: 'm1', matchNumber: 1, startAt: daysFromNow(1, 21, 0), status: 'room_locked', roomId: null, roomPassword: null }],
      leaderboard: [],
    },
    {
      id: 't3', gameId: 'freefire', title: 'Blaze Cup', format: 'Squad',
      entryType: 'Free', prizePool: 4000, maxParticipants: 80, currentParticipants: 45,
      status: 'live', startAt: hoursFromNow(-1), regDeadline: hoursFromNow(-2),
      description: 'Free Fire squads battle across Bermuda and Kalahari, with placement and kill points combined for the final standings.',
      rules: [
        'Squads of 4, matching registered game profiles.',
        'Character skills must be default rank \u2014 no banned combos.',
        'Stream sniping or ghosting is grounds for disqualification.',
        'Final standings combine placement points and kill points.',
      ],
      participants: ['Fire Hawks', 'Team Bermuda', 'Shadow Clan', 'Team Vendetta', 'Crimson Squad', 'Night Wolves'],
      matches: [{ id: 'm1', matchNumber: 1, startAt: hoursFromNow(-1), status: 'live', roomId: '48213097', roomPassword: 'X7K2P9' }],
      leaderboard: [
        { rank: 1, name: 'Fire Hawks', kills: 14, placement: 20, total: 34 },
        { rank: 2, name: 'Shadow Clan', kills: 11, placement: 18, total: 29 },
        { rank: 3, name: 'Team Vendetta', kills: 9, placement: 15, total: 24 },
        { rank: 4, name: 'Crimson Squad', kills: 8, placement: 12, total: 20 },
        { rank: 5, name: 'Night Wolves', kills: 6, placement: 10, total: 16 },
      ],
    },
    {
      id: 't4', gameId: 'freefire', title: 'Solo Showdown', format: 'Solo',
      entryType: 'Free', prizePool: 1500, maxParticipants: 100, currentParticipants: 100,
      status: 'completed', startAt: daysFromNow(-4, 18, 0), regDeadline: daysFromNow(-5, 18, 0),
      description: 'A pure solo Free Fire showdown \u2014 no teammates, no revives, just 100 players and one Booyah.',
      rules: [
        'Solo entries only \u2014 no stand-ins or account sharing.',
        'One life per match, no re-entries.',
        'Final ranking is by placement, with kills as the tiebreaker.',
      ],
      participants: ['Player_Kira', 'ShadowStrikerX', 'ZenoFF', 'RajaGamer', 'BlazeQueen', 'NightHawk99'],
      matches: [{ id: 'm1', matchNumber: 1, startAt: daysFromNow(-4, 18, 0), status: 'completed', roomId: '91820374', roomPassword: 'PL9Q2T' }],
      leaderboard: [
        { rank: 1, name: 'ShadowStrikerX', kills: 9, placement: 15, total: 24 },
        { rank: 2, name: 'ZenoFF', kills: 7, placement: 14, total: 21 },
        { rank: 3, name: 'Player_Kira', kills: 8, placement: 12, total: 20 },
        { rank: 4, name: 'BlazeQueen', kills: 5, placement: 10, total: 15 },
        { rank: 5, name: 'NightHawk99', kills: 4, placement: 9, total: 13 },
      ],
    },
    {
      id: 't5', gameId: 'stumble', title: 'Chaos Royale', format: 'Solo',
      entryType: 'Free', prizePool: 1000, maxParticipants: 60, currentParticipants: 22,
      status: 'upcoming', startAt: daysFromNow(4, 18, 0), regDeadline: daysFromNow(3, 18, 0),
      description: 'Knockout rounds of obstacle chaos, ending in a finale where only one wobbly champion is left standing.',
      rules: [
        'Solo entries only \u2014 one account per player.',
        'Disconnects are not replayed; reconnect quickly if you can.',
        'Custom skins are cosmetic only and give no advantage.',
      ],
      participants: ['Wobble_King', 'JellyBean22', 'FinishLineFan', 'ChaosGremlin', 'StumbleQueen'],
      matches: [{ id: 'm1', matchNumber: 1, startAt: daysFromNow(4, 18, 0), status: 'room_locked', roomId: null, roomPassword: null }],
      leaderboard: [],
    },
    {
      id: 't6', gameId: 'stumble', title: 'Knockout Fiesta', format: 'Duo',
      entryType: 'Free', prizePool: 1200, maxParticipants: 40, currentParticipants: 40,
      status: 'live', startAt: hoursFromNow(-0.5), regDeadline: hoursFromNow(-3),
      description: 'Duos race, dodge, and stumble through three rounds for the Knockout Fiesta crown.',
      rules: [
        'Duos must stay paired for all three rounds.',
        'Round scores are combined for the final leaderboard.',
        'Griefing a teammate on purpose can get your duo disqualified.',
      ],
      participants: ['Duo Dynamite', 'Team Jelly', 'Wobble Twins', 'Chaos Duo', 'Finish Line Bros'],
      matches: [{ id: 'm1', matchNumber: 1, startAt: hoursFromNow(-0.5), status: 'live', roomId: '77234561', roomPassword: 'ZQ4M8L' }],
      leaderboard: [
        { rank: 1, name: 'Duo Dynamite', kills: 0, placement: 28, total: 28 },
        { rank: 2, name: 'Wobble Twins', kills: 0, placement: 24, total: 24 },
        { rank: 3, name: 'Team Jelly', kills: 0, placement: 21, total: 21 },
        { rank: 4, name: 'Chaos Duo', kills: 0, placement: 18, total: 18 },
      ],
    },
    {
      id: 't7', gameId: 'roblox', title: 'Obby Masters', format: 'Solo',
      entryType: 'Free', prizePool: 2000, maxParticipants: 50, currentParticipants: 12,
      status: 'upcoming', startAt: daysFromNow(3, 20, 0), regDeadline: hoursFromNow(6),
      description: 'A timed obstacle-course gauntlet across three brutal obbies. Fastest combined time wins.',
      rules: [
        'One attempt per stage \u2014 no restarts once the timer starts.',
        'Exploiting or using unauthorized scripts is a permanent ban.',
        'Combined time across all three stages determines the winner.',
      ],
      participants: ['ObbyLegend', 'ParkourPro_IN', 'JumpMasterX'],
      matches: [{ id: 'm1', matchNumber: 1, startAt: daysFromNow(3, 20, 0), status: 'room_locked', roomId: null, roomPassword: null }],
      leaderboard: [],
    },
    {
      id: 't8', gameId: 'roblox', title: 'Battle Royale Bash', format: 'Squad',
      entryType: 'Free', prizePool: 3500, maxParticipants: 64, currentParticipants: 64,
      status: 'completed', startAt: daysFromNow(-7, 19, 0), regDeadline: daysFromNow(-8, 19, 0),
      description: 'Squads dropped into a shrinking battleground across a semifinal and a grand final.',
      rules: [
        'Squads of 4 \u2014 substitutes must be declared before the semifinal.',
        'Semifinal and final scores combine for the overall standings.',
        'Exploits or scripts of any kind result in a squad-wide ban.',
      ],
      participants: ['Block Busters', 'Team Pixel', 'RoyaleRunners', 'Squad Cubed', 'Team Voxel'],
      matches: [
        { id: 'm1', matchNumber: 1, startAt: daysFromNow(-7, 17, 0), status: 'completed', roomId: '10293847', roomPassword: 'BX8N3R' },
        { id: 'm2', matchNumber: 2, startAt: daysFromNow(-7, 19, 0), status: 'completed', roomId: '10293848', roomPassword: 'FN2K9W' },
      ],
      leaderboard: [
        { rank: 1, name: 'Team Pixel', kills: 12, placement: 25, total: 37 },
        { rank: 2, name: 'Block Busters', kills: 10, placement: 22, total: 32 },
        { rank: 3, name: 'RoyaleRunners', kills: 9, placement: 19, total: 28 },
        { rank: 4, name: 'Squad Cubed', kills: 7, placement: 16, total: 23 },
        { rank: 5, name: 'Team Voxel', kills: 5, placement: 14, total: 19 },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function cx(...parts) { return parts.filter(Boolean).join(' '); }
function formatMoney(n) { return '\u20B9' + n.toLocaleString('en-IN'); }

function formatWhen(date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = d - now;
  const diffH = diffMs / 3600000;
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (diffH < 0 && diffH > -6) {
    const mins = Math.abs(Math.round(diffH * 60));
    if (mins < 60) return `Started ${mins}m ago`;
    return `Started ${Math.round(mins / 60)}h ago`;
  }
  if (sameDay) return `Today \u2022 ${time}`;
  if (isTomorrow) return `Tomorrow \u2022 ${time}`;
  return `${d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} \u2022 ${time}`;
}

function timeUntil(date) {
  const diffMs = new Date(date) - new Date();
  if (diffMs <= 0) return null;
  const h = diffMs / 3600000;
  if (h < 1) return `${Math.round(diffMs / 60000)}m`;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

function prizeSplit(pool) {
  return [
    { place: '1st', amount: Math.round(pool * 0.5) },
    { place: '2nd', amount: Math.round(pool * 0.3) },
    { place: '3rd', amount: Math.round(pool * 0.2) },
  ];
}

/* ------------------------------------------------------------------ */
/* app context                                                         */
/* ------------------------------------------------------------------ */

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ------------------------------------------------------------------ */
/* style tokens                                                        */
/* ------------------------------------------------------------------ */

function StyleTokens() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
      :root{
        --bg:#0C0E12;--surface:#15181E;--surface2:#1D212A;--line:#262B35;
        --text:#F5F3EF;--text-muted:#9096A3;
        --accent:#F2B33D;--accent-ink:#211804;
        --live:#35D07F;--upcoming:#5B8DEF;--completed:#6B7280;--danger:#E8544A;
      }
      .ntz{background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;min-height:100vh;}
      .ntz *{box-sizing:border-box;}
      .ntz .font-display{font-family:'Rajdhani',sans-serif;}
      .ntz .font-mono{font-family:'JetBrains Mono',monospace;}
      .ntz .bg-app{background:var(--bg);}
      .ntz .bg-surface{background:var(--surface);}
      .ntz .bg-surface2{background:var(--surface2);}
      .ntz .text-primary{color:var(--text);}
      .ntz .text-muted{color:var(--text-muted);}
      .ntz .text-accent{color:var(--accent);}
      .ntz .text-danger{color:var(--danger);}
      .ntz .text-live{color:var(--live);}
      .ntz .bg-accent{background:var(--accent);color:var(--accent-ink);}
      .ntz .bg-danger-10{background:rgba(232,84,74,.14);}
      .ntz .border-line{border-color:var(--line);}
      .ntz .text-tiny{font-size:11px;}
      .ntz .ticket-divider{border-top:2px dashed var(--line);position:relative;height:0;}
      .ntz .notch{position:absolute;top:-7px;width:14px;height:14px;border-radius:50%;background:var(--bg);}
      .ntz .notch-l{left:-7px;}
      .ntz .notch-r{right:-7px;}
      .ntz .card-hover{transition:transform .15s ease,border-color .15s ease;}
      .ntz .card-hover:hover{transform:translateY(-2px);border-color:var(--accent);}
      .ntz .ntz-input{width:100%;background:var(--surface2);border:1px solid var(--line);border-radius:.75rem;padding:.65rem .9rem;color:var(--text);font-size:.9rem;outline:none;transition:border-color .15s;font-family:'Inter',sans-serif;}
      .ntz .ntz-input:focus{border-color:var(--accent);}
      .ntz .ntz-input::placeholder{color:var(--text-muted);}
      .ntz .scrim{background:rgba(0,0,0,.6);}
      .ntz .modal-maxh{max-height:85vh;}
      .ntz .ntz-notif-w{width:20rem;max-width:88vw;}
      .ntz .link-muted{color:var(--text-muted);transition:color .15s;}
      .ntz .link-muted:hover{color:var(--text);}
      .ntz .hover-lift{transition:background .15s;}
      .ntz .hover-lift:hover{background:var(--surface2);}
      .ntz .hover-dim{transition:background .15s;}
      .ntz .hover-dim:hover{background:var(--bg);}
      .ntz .btn-secondary{background:var(--surface2);color:var(--text);transition:background .15s;}
      .ntz .btn-secondary:hover{background:var(--line);}
      .ntz .div-rows > * + *{border-top:1px solid var(--line);}
      .ntz .lb-grid{display:grid;grid-template-columns:28px 1fr 50px 40px 50px;gap:.75rem;}
      .ntz .scrollbar-none::-webkit-scrollbar{display:none;}
      .ntz .scrollbar-none{scrollbar-width:none;}
      .ntz :focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
      @keyframes ntzPulse{0%,100%{opacity:1;}50%{opacity:.35;}}
      .ntz .live-dot{animation:ntzPulse 1.6s ease-in-out infinite;}
      @keyframes ntzFade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
      .ntz .fade-in{animation:ntzFade .25s ease both;}
      @media (prefers-reduced-motion:reduce){.ntz *{animation-duration:.01ms!important;transition-duration:.01ms!important;}}
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* small shared components                                             */
/* ------------------------------------------------------------------ */

function GameTag({ gameId, size }) {
  const g = gameById(gameId);
  return (
    <span className={cx('inline-flex items-center gap-1.5 font-semibold', size === 'md' ? 'text-sm' : 'text-xs')} style={{ color: g.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.color }} />
      {g.name}
    </span>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ color: meta.color, background: meta.color + '1F' }}>
      {status === 'live' && <span className="w-1.5 h-1.5 rounded-full live-dot" style={{ background: meta.color }} />}
      {meta.label}
    </span>
  );
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const full = value >= max;
  return (
    <div className="w-full h-1.5 rounded-full bg-surface2 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: pct + '%', background: full ? 'var(--danger)' : 'var(--accent)' }} />
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center mb-3">
        <Icon size={22} className="text-muted" />
      </div>
      <p className="font-semibold text-primary mb-1">{title}</p>
      {body && <p className="text-sm text-muted max-w-xs">{body}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-2xl border border-line p-4 animate-pulse">
      <div className="h-3 w-16 bg-surface2 rounded mb-3" />
      <div className="h-4 w-3/4 bg-surface2 rounded mb-4" />
      <div className="h-2 w-full bg-surface2 rounded mb-2" />
      <div className="h-8 w-full bg-surface2 rounded mt-4" />
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in">
      <div className="bg-surface2 border border-line text-primary text-sm font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
        <CheckCircle2 size={16} className="text-accent" />
        {message}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-xs text-danger mt-1">{error}</span>}
    </label>
  );
}

function RevRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-1 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-primary">{value}</span>
    </div>
  );
}

function MatchStatusPill({ status }) {
  const map = {
    scheduled: { l: 'Scheduled', c: '#9096A3' },
    room_locked: { l: 'Room Locked', c: '#5B8DEF' },
    room_available: { l: 'Room Available', c: '#35D07F' },
    live: { l: 'Live', c: '#35D07F' },
    completed: { l: 'Completed', c: '#6B7280' },
    cancelled: { l: 'Cancelled', c: '#E8544A' },
  };
  const m = map[status] || map.scheduled;
  return <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ color: m.c, background: m.c + '1F' }}>{m.l}</span>;
}

function LeaderboardTable({ rows }) {
  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <div className="lb-grid px-4 py-2.5 text-tiny text-muted uppercase tracking-wide border-b border-line">
        <span>#</span><span>Team</span><span>Kills</span><span>Pl.</span><span>Total</span>
      </div>
      {rows.map(r => (
        <div key={r.rank} className="lb-grid px-4 py-3 text-sm items-center border-b border-line">
          <span className={cx('font-display font-bold', r.rank <= 3 ? 'text-accent' : 'text-muted')}>{r.rank}</span>
          <span className="font-medium text-primary truncate">{r.name}</span>
          <span className="text-muted">{r.kills}</span>
          <span className="text-muted">{r.placement}</span>
          <span className="font-semibold text-primary">{r.total}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* auth                                                                 */
/* ------------------------------------------------------------------ */

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function validate() {
    const e = {};
    if (mode === 'forgot') {
      if (!form.email.trim()) e.email = 'Enter your email';
      else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
      setErrors(e);
      return Object.keys(e).length === 0;
    }
    if (mode === 'signup' && !form.username.trim()) e.username = 'Username is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Use at least 8 characters';
    if (mode === 'signup' && form.confirm !== form.password) e.confirm = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    if (mode === 'forgot') {
      await new Promise(r => setTimeout(r, 600));
      setForgotSent(true);
      setBusy(false);
      return;
    }

    const isAdminEmail = form.email.trim().toLowerCase() === ADMIN_EMAIL;

    if (mode === 'signup') {
      if (isAdminEmail) {
        setErrors({ form: 'This email is reserved for the admin account \u2014 use Login instead.' });
        setBusy(false);
        return;
      }
      let existing = null;
      try { existing = await window.storage.get('player-data'); } catch (e) { existing = null; }
      if (existing) {
        setErrors({ form: 'An account already exists on this device \u2014 try logging in.' });
        setBusy(false);
        return;
      }
      const data = { username: form.username.trim(), email: form.email.trim(), role: 'player', gameProfiles: {}, registrations: [] };
      try {
        await window.storage.set('player-data', JSON.stringify(data));
      } catch (e) {
        setErrors({ form: 'Something went wrong creating your account.' });
        setBusy(false);
        return;
      }
      setBusy(false);
      onAuthed(data);
      return;
    }

    // login
    if (isAdminEmail) {
      const ok = await checkAdminCredentials(form.email, form.password);
      if (!ok) {
        setErrors({ form: 'Incorrect password for the admin account.' });
        setBusy(false);
        return;
      }
      const data = { username: 'Admin', email: ADMIN_EMAIL, role: 'admin', gameProfiles: {}, registrations: [] };
      try { await window.storage.set('admin-session', JSON.stringify(data)); } catch (e) { /* allow this-session access even if storage failed */ }
      setBusy(false);
      onAuthed(data);
      return;
    }

    let existing = null;
    try { existing = await window.storage.get('player-data'); } catch (e) { existing = null; }
    if (!existing) {
      setErrors({ form: 'Account not found \u2014 try creating one.' });
      setBusy(false);
      return;
    }
    const data = JSON.parse(existing.value);
    setBusy(false);
    onAuthed(data);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <Trophy size={18} />
          </div>
          <span className="font-display font-bold text-2xl tracking-wide text-primary">NOTZ</span>
        </div>

        {mode !== 'forgot' ? (
          <div className="flex bg-surface rounded-xl p-1 mb-6 border border-line">
            <button type="button" onClick={() => { setMode('signup'); setErrors({}); }}
              className={cx('flex-1 py-2 rounded-lg text-sm font-semibold transition', mode === 'signup' ? 'bg-accent' : 'text-muted')}>
              Sign Up
            </button>
            <button type="button" onClick={() => { setMode('login'); setErrors({}); }}
              className={cx('flex-1 py-2 rounded-lg text-sm font-semibold transition', mode === 'login' ? 'bg-accent' : 'text-muted')}>
              Login
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => { setMode('login'); setForgotSent(false); setErrors({}); }} className="flex items-center gap-1.5 text-sm link-muted mb-6">
            <ArrowLeft size={15} /> Back to login
          </button>
        )}

        {mode === 'forgot' && forgotSent ? (
          <div className="bg-surface border border-line rounded-2xl p-6 text-center">
            <CheckCircle2 className="text-accent mx-auto mb-3" size={32} />
            <p className="font-semibold text-primary mb-1">Check your email</p>
            <p className="text-sm text-muted">If an account exists for {form.email}, reset instructions are on the way.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Field label="Username" error={errors.username}>
                <input value={form.username} onChange={e => update('username', e.target.value)} className="ntz-input" placeholder="PlayerX" />
              </Field>
            )}
            <Field label="Email" error={errors.email}>
              <input value={form.email} onChange={e => update('email', e.target.value)} type="email" className="ntz-input" placeholder="you@example.com" />
            </Field>
            {mode !== 'forgot' && (
              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input value={form.password} onChange={e => update('password', e.target.value)} type={showPw ? 'text' : 'password'} className="ntz-input" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
                  <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            )}
            {mode === 'signup' && (
              <Field label="Confirm Password" error={errors.confirm}>
                <input value={form.confirm} onChange={e => update('confirm', e.target.value)} type={showPw ? 'text' : 'password'} className="ntz-input" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
              </Field>
            )}
            {errors.form && (
              <div className="flex items-start gap-2 text-sm text-danger bg-danger-10 rounded-lg p-3">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{errors.form}</span>
              </div>
            )}
            <button type="submit" disabled={busy} className={cx('w-full bg-accent font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition', busy && 'opacity-60')}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : (mode === 'signup' ? <UserPlus size={16} /> : mode === 'login' ? <LogIn size={16} /> : <Mail size={16} />)}
              {mode === 'signup' ? 'Create Account' : mode === 'login' ? 'Login' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {mode === 'login' && !forgotSent && (
          <button type="button" onClick={() => { setMode('forgot'); setErrors({}); }} className="w-full text-center text-sm link-muted mt-4">
            Forgot Password?
          </button>
        )}
        <p className="text-xs text-muted text-center mt-8">Demo account \u2014 stored only on this device, no real email is sent.</p>
        <p className="text-xs text-muted text-center mt-1.5">Dev admin login: <span className="font-mono">admin@gmail.com</span></p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* shell: header / nav / notifications                                 */
/* ------------------------------------------------------------------ */

function AppHeader() {
  const { user, navigate, view, notifOpen, setNotifOpen, unreadCount } = useApp();
  return (
    <header className="sticky top-0 z-30 bg-app border-b border-line">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate('home')} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Trophy size={15} />
            </div>
            <span className="font-display font-bold text-lg tracking-wide hidden sm:inline text-primary">NOTZ</span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={cx('px-3.5 py-2 rounded-lg text-sm font-medium transition', view === item.id ? 'bg-surface text-primary' : 'text-muted')}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-muted">Hi, {user && user.username}</span>
          <div className="relative">
            <button aria-label="Notifications" onClick={() => setNotifOpen(o => !o)} className="relative w-9 h-9 rounded-full bg-surface flex items-center justify-center hover-lift">
              <Bell size={16} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />}
            </button>
            {notifOpen && <NotifPanel />}
          </div>
          <button onClick={() => navigate('profile')} className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center font-display font-bold text-sm text-accent">
            {user && user.username ? user.username[0].toUpperCase() : 'P'}
          </button>
        </div>
      </div>
    </header>
  );
}

function NotifPanel() {
  const { notifications, markAllNotifsRead, setNotifOpen } = useApp();
  return (
    <div className="absolute right-0 top-12 ntz-notif-w bg-surface border border-line rounded-2xl shadow-lg overflow-hidden z-40 fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <span className="font-semibold text-sm text-primary">Notifications</span>
        <button onClick={markAllNotifsRead} className="text-xs text-accent font-medium">Mark all read</button>
      </div>
      <div className="max-h-80 overflow-y-auto div-rows">
        {notifications.map(n => (
          <div key={n.id} className="flex gap-3 px-4 py-3">
            <span className={cx('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', n.read ? 'bg-surface2' : 'bg-accent')} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-primary">{n.title}</p>
              <p className="text-xs text-muted mt-0.5">{n.body}</p>
              <p className="text-tiny text-muted mt-1">{n.date}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setNotifOpen(false)} className="w-full text-center text-xs link-muted py-2.5">Close</button>
    </div>
  );
}

function NavBar() {
  const { view, navigate } = useApp();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-line flex items-stretch">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button key={item.id} onClick={() => navigate(item.id)} className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5">
            <Icon size={19} color={active ? 'var(--accent)' : 'var(--text-muted)'} />
            <span className={cx('text-tiny font-medium', active ? 'text-accent' : 'text-muted')}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* home                                                                 */
/* ------------------------------------------------------------------ */

function FeaturedCard({ tournament: t, registered }) {
  const { navigate } = useApp();
  const g = gameById(t.gameId);
  const until = t.status === 'upcoming' ? timeUntil(t.startAt) : null;
  return (
    <div className="rounded-3xl border border-line overflow-hidden" style={{ background: `linear-gradient(135deg, ${g.color}22, var(--surface) 55%)` }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <GameTag gameId={t.gameId} size="md" />
          <StatusBadge status={t.status} />
        </div>
        <h3 className="font-display font-bold text-2xl sm:text-3xl text-primary leading-tight mb-1">{t.title}</h3>
        <p className="text-sm text-muted mb-5">{t.format} \u2022 {t.entryType} Entry</p>
        <div className="flex items-end gap-6 mb-5 flex-wrap">
          <div>
            <p className="text-tiny text-muted uppercase tracking-wide mb-1">Prize Pool</p>
            <p className="font-display font-bold text-3xl text-accent">{formatMoney(t.prizePool)}</p>
          </div>
          <div>
            <p className="text-tiny text-muted uppercase tracking-wide mb-1">Slots</p>
            <p className="font-display font-bold text-xl text-primary">{t.currentParticipants}/{t.maxParticipants}</p>
          </div>
          {until && (
            <div>
              <p className="text-tiny text-muted uppercase tracking-wide mb-1">Starts In</p>
              <p className="font-display font-bold text-xl text-primary">{until}</p>
            </div>
          )}
        </div>
        <ProgressBar value={t.currentParticipants} max={t.maxParticipants} />
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-muted">{formatWhen(t.startAt)}</p>
          <button onClick={() => navigate('tournamentDetail', { id: t.id })} className="bg-accent font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-1.5">
            {registered ? 'View Registration' : 'View Tournament'} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeView() {
  const { tournaments, navigate, user, isRegistered } = useApp();
  const featured = useMemo(() => {
    const live = tournaments.find(t => t.status === 'live');
    const soonest = tournaments.filter(t => t.status === 'upcoming').sort((a, b) => a.startAt - b.startAt)[0];
    return live || soonest || tournaments[0];
  }, [tournaments]);

  const upcoming = useMemo(() => tournaments.filter(t => t.status !== 'completed' && t.id !== featured.id).slice(0, 6), [tournaments, featured]);

  const myMatches = useMemo(() => {
    const regIds = (user.registrations || []).map(r => r.tournamentId);
    return tournaments.filter(t => regIds.includes(t.id) && t.status !== 'completed');
  }, [tournaments, user]);

  return (
    <div className="space-y-8">
      <section>
        <FeaturedCard tournament={featured} registered={isRegistered(featured.id)} />
      </section>

      <section>
        <h2 className="font-display font-bold text-lg text-primary mb-3">Games</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GAMES.map(g => {
            const count = tournaments.filter(t => t.gameId === g.id && t.status !== 'completed').length;
            return (
              <button key={g.id} onClick={() => navigate('tournaments', { gameId: g.id })} className="bg-surface border border-line rounded-2xl p-4 text-left card-hover">
                <Gamepad2 size={18} color={g.color} />
                <p className="font-semibold text-sm text-primary mt-2.5">{g.name}</p>
                <p className="text-xs text-muted mt-0.5">{count} active</p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-primary">Upcoming Tournaments</h2>
          <button onClick={() => navigate('tournaments')} className="text-xs font-medium text-accent">See all</button>
        </div>
        <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          {upcoming.map(t => (
            <div key={t.id} className="w-72 shrink-0 md:w-auto">
              <TournamentCard tournament={t} registered={isRegistered(t.id)} onOpen={() => navigate('tournamentDetail', { id: t.id })} />
            </div>
          ))}
        </div>
      </section>

      {myMatches.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-lg text-primary mb-3">My Upcoming Matches</h2>
          <div className="space-y-3">
            {myMatches.map(t => (
              <button key={t.id} onClick={() => navigate('matchDetail', { tournamentId: t.id, matchId: t.matches[0].id })}
                className="w-full bg-surface border border-line rounded-2xl p-4 flex items-center justify-between text-left card-hover">
                <div>
                  <GameTag gameId={t.gameId} />
                  <p className="font-semibold text-primary mt-1">{t.title}</p>
                  <p className="text-xs text-muted mt-0.5">Match #{t.matches[0].matchNumber} \u2022 {formatWhen(t.startAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: t.matches[0].roomId ? 'var(--live)' : 'var(--text-muted)' }}>
                  {t.matches[0].roomId ? <Unlock size={13} /> : <Lock size={13} />}
                  {t.matches[0].roomId ? 'Room open' : 'Locked'}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display font-bold text-lg text-primary mb-3">Announcements</h2>
        <div className="space-y-3">
          {ANNOUNCEMENTS.map(a => (
            <div key={a.id} className="bg-surface border border-line rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-primary">{a.title}</p>
                <span className="text-tiny text-muted shrink-0 ml-2">{a.date}</span>
              </div>
              <p className="text-sm text-muted mt-1">{a.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* tournaments list                                                     */
/* ------------------------------------------------------------------ */

function FilterRow({ label, value, onChange, options }) {
  return (
    <div className="mb-2.5">
      <p className="text-tiny text-muted uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
        {options.map(o => (
          <button key={o.v} onClick={() => onChange(o.v)}
            className={cx('shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition', value === o.v ? 'bg-accent border-transparent' : 'bg-surface border-line text-muted')}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function TournamentCard({ tournament: t, registered, onOpen }) {
  const full = t.currentParticipants >= t.maxParticipants;
  const msUntilDeadline = new Date(t.regDeadline) - new Date();
  const urgent = t.status === 'upcoming' && msUntilDeadline > 0 && msUntilDeadline < 24 * 3600000;
  return (
    <button onClick={onOpen} className="w-full text-left bg-surface border border-line rounded-2xl overflow-hidden card-hover">
      <div className="p-4 pb-3.5 flex items-center justify-between">
        <GameTag gameId={t.gameId} />
        <StatusBadge status={t.status} />
      </div>
      <div className="ticket-divider">
        <span className="notch notch-l" /><span className="notch notch-r" />
      </div>
      <div className="p-4 pt-3.5">
        <h3 className="font-display font-bold text-lg text-primary leading-snug mb-2">{t.title}</h3>
        <div className="flex items-center gap-4 text-sm mb-3">
          <span className="flex items-center gap-1.5 text-accent font-semibold"><Trophy size={13} /> {formatMoney(t.prizePool)}</span>
          <span className="flex items-center gap-1.5 text-muted"><Users size={13} /> {t.format}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted mb-1">
          <span>{t.currentParticipants}/{t.maxParticipants} {t.format === 'Solo' ? 'Players' : 'Teams'}</span>
          {full && <span className="text-danger font-medium">Full</span>}
        </div>
        <ProgressBar value={t.currentParticipants} max={t.maxParticipants} />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted flex items-center gap-1"><Clock size={12} /> {formatWhen(t.startAt)}</p>
          {registered && <span className="text-tiny font-semibold text-live flex items-center gap-1"><CheckCircle2 size={12} /> Joined</span>}
        </div>
        {urgent && !registered && <p className="text-tiny text-danger mt-2">Registration closes soon</p>}
      </div>
    </button>
  );
}

function TournamentsView() {
  const { tournaments, navigate, isRegistered, params } = useApp();
  const [query, setQuery] = useState('');
  const [gameFilter, setGameFilter] = useState((params && params.gameId) || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return tournaments.filter(t => {
      if (gameFilter !== 'all' && t.gameId !== gameFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (formatFilter !== 'all' && t.format !== formatFilter) return false;
      if (query.trim() && !t.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [tournaments, gameFilter, statusFilter, formatFilter, query]);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-primary mb-4">Tournaments</h1>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tournaments..." className="ntz-input" style={{ paddingLeft: '2.5rem' }} />
      </div>

      <FilterRow label="Game" value={gameFilter} onChange={setGameFilter} options={[{ v: 'all', l: 'All' }].concat(GAMES.map(g => ({ v: g.id, l: g.name })))} />
      <FilterRow label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ v: 'all', l: 'All' }, { v: 'upcoming', l: 'Upcoming' }, { v: 'live', l: 'Live' }, { v: 'completed', l: 'Completed' }]} />
      <FilterRow label="Format" value={formatFilter} onChange={setFormatFilter} options={[{ v: 'all', l: 'All' }, { v: 'Solo', l: 'Solo' }, { v: 'Duo', l: 'Duo' }, { v: 'Squad', l: 'Squad' }]} />

      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No tournaments found" body="Try a different search or clear a filter." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <TournamentCard key={t.id} tournament={t} registered={isRegistered(t.id)} onOpen={() => navigate('tournamentDetail', { id: t.id })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* tournament detail                                                    */
/* ------------------------------------------------------------------ */

function InfoGrid({ t }) {
  const rows = [
    ['Entry Type', t.entryType],
    ['Max Participants', t.maxParticipants],
    ['Current Participants', t.currentParticipants],
    ['Registration Deadline', formatWhen(t.regDeadline)],
    ['Start Time', formatWhen(t.startAt)],
  ];
  return (
    <div className="bg-surface border border-line rounded-2xl div-rows">
      {rows.map(row => (
        <div key={row[0]} className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted">{row[0]}</span>
          <span className="font-medium text-primary">{row[1]}</span>
        </div>
      ))}
    </div>
  );
}

function TournamentDetailView() {
  const { tournaments, params, navigate, isRegistered, setJoinModal, user } = useApp();
  const [tab, setTab] = useState('overview');
  const t = tournaments.find(x => x.id === params.id);
  if (!t) return <EmptyState icon={AlertCircle} title="Tournament not found" body="It may have been removed." />;

  const g = gameById(t.gameId);
  const registered = isRegistered(t.id);
  const full = t.currentParticipants >= t.maxParticipants;
  const regClosed = t.status !== 'upcoming' || new Date() > new Date(t.regDeadline);

  let joinLabel = 'Join Tournament';
  let joinDisabled = false;
  if (registered) { joinLabel = 'Registered'; joinDisabled = true; }
  else if (full) { joinLabel = 'Tournament Full'; joinDisabled = true; }
  else if (regClosed) { joinLabel = 'Registration Closed'; joinDisabled = true; }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'matches', label: 'Matches' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'participants', label: 'Participants' },
    { id: 'prizes', label: 'Prizes' },
  ];

  const myEntry = (user.registrations || []).find(r => r.tournamentId === t.id);

  return (
    <div className="pb-48 md:pb-6">
      <button onClick={() => navigate('tournaments')} className="flex items-center gap-1.5 text-sm link-muted mb-4">
        <ArrowLeft size={15} /> Back to Tournaments
      </button>

      <div className="rounded-3xl border border-line overflow-hidden mb-5" style={{ background: `linear-gradient(135deg, ${g.color}22, var(--surface) 55%)` }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <GameTag gameId={t.gameId} size="md" />
            <StatusBadge status={t.status} />
          </div>
          <h1 className="font-display font-bold text-3xl text-primary mb-2">{t.title}</h1>
          <p className="text-sm text-muted mb-4">{t.description}</p>
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="text-tiny text-muted uppercase tracking-wide mb-1">Prize Pool</p>
              <p className="font-display font-bold text-2xl text-accent">{formatMoney(t.prizePool)}</p>
            </div>
            <div>
              <p className="text-tiny text-muted uppercase tracking-wide mb-1">Format</p>
              <p className="font-display font-bold text-2xl text-primary">{t.format}</p>
            </div>
            <div>
              <p className="text-tiny text-muted uppercase tracking-wide mb-1">Slots</p>
              <p className="font-display font-bold text-2xl text-primary">{t.currentParticipants}/{t.maxParticipants}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none mb-5 border-b border-line">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={cx('shrink-0 px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition', tab === tb.id ? 'text-primary' : 'border-transparent text-muted')}
            style={tab === tb.id ? { borderColor: 'var(--accent)' } : undefined}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <InfoGrid t={t} />
          <div>
            <h3 className="font-semibold text-primary mb-2.5">Rules</h3>
            <ul className="space-y-2">
              {t.rules.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'matches' && (
        <div className="space-y-3">
          {t.matches.map(m => (
            <button key={m.id} onClick={() => navigate('matchDetail', { tournamentId: t.id, matchId: m.id })}
              className="w-full text-left bg-surface border border-line rounded-2xl p-4 flex items-center justify-between card-hover">
              <div>
                <p className="font-semibold text-primary">Match #{m.matchNumber}</p>
                <p className="text-xs text-muted mt-0.5">{formatWhen(m.startAt)}</p>
              </div>
              <MatchStatusPill status={m.status} />
            </button>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        t.leaderboard.length === 0
          ? <EmptyState icon={TrendingUp} title="Leaderboard not live yet" body="Standings appear once the tournament goes live." />
          : <LeaderboardTable rows={t.leaderboard} />
      )}

      {tab === 'participants' && (
        <div>
          <p className="text-sm text-muted mb-3">{t.currentParticipants} of {t.maxParticipants} {t.format === 'Solo' ? 'players' : 'teams'} registered</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {t.participants.map((p, i) => (
              <div key={i} className="bg-surface border border-line rounded-xl px-3.5 py-2.5 text-sm text-primary flex items-center gap-2">
                <Users size={13} className="text-muted" /> {p}
              </div>
            ))}
            {registered && myEntry && (
              <div className="bg-surface border rounded-xl px-3.5 py-2.5 text-sm font-semibold flex items-center gap-2" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                <Users size={13} /> You ({myEntry.profile ? myEntry.profile.ign : user.username})
              </div>
            )}
          </div>
          {t.currentParticipants > t.participants.length && (
            <p className="text-xs text-muted mt-3">+ {t.currentParticipants - t.participants.length} more</p>
          )}
        </div>
      )}

      {tab === 'prizes' && (
        <div className="space-y-2.5">
          {prizeSplit(t.prizePool).map(p => (
            <div key={p.place} className="bg-surface border border-line rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center">
                  <Trophy size={15} color="var(--accent)" />
                </div>
                <span className="font-semibold text-primary">{p.place} Place</span>
              </div>
              <span className="font-display font-bold text-lg text-accent">{formatMoney(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-20 bg-app border-t border-line p-4 md:static md:border-0 md:p-0 md:mt-6">
        <div className="max-w-6xl mx-auto">
          <button disabled={joinDisabled} onClick={() => setJoinModal(t.id)}
            className={cx('w-full font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition', joinDisabled ? 'bg-surface2 text-muted' : 'bg-accent')}>
            {registered && <CheckCircle2 size={16} />}
            {joinLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* join flow                                                            */
/* ------------------------------------------------------------------ */

function JoinFlowModal({ tournamentId, onClose }) {
  const { tournaments, user, saveGameProfile, joinTournament, showToast, navigate } = useApp();
  const t = tournaments.find(x => x.id === tournamentId);
  const existingProfile = user.gameProfiles && user.gameProfiles[t ? t.gameId : ''];
  const [step, setStep] = useState(existingProfile ? 'review' : 'profile');
  const [uid, setUid] = useState(existingProfile ? existingProfile.uid : '');
  const [ign, setIgn] = useState(existingProfile ? existingProfile.ign : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!t) return null;
  const g = gameById(t.gameId);

  function handleProfileNext() {
    if (!uid.trim() || !ign.trim()) { setError('Both fields are required'); return; }
    setError('');
    saveGameProfile(t.gameId, { uid: uid.trim(), ign: ign.trim() });
    setStep('review');
  }

  async function handleConfirm() {
    setBusy(true);
    await new Promise(r => setTimeout(r, 500));
    joinTournament(t.id, { uid: uid.trim(), ign: ign.trim() });
    setBusy(false);
    setStep('success');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 scrim" onClick={step !== 'success' ? onClose : undefined} />
      <div className="relative w-full md:max-w-md bg-surface border border-line rounded-t-3xl md:rounded-3xl p-6 modal-maxh overflow-y-auto fade-in">
        {step !== 'success' && (
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-1.5 rounded-full bg-accent" />
              <span className={cx('w-6 h-1.5 rounded-full', step === 'review' ? 'bg-accent' : 'bg-surface2')} />
            </div>
            <button onClick={onClose} aria-label="Close" className="text-muted"><X size={18} /></button>
          </div>
        )}

        {step === 'profile' && (
          <div>
            <h2 className="font-display font-bold text-xl text-primary mb-1">Select Game Profile</h2>
            <p className="text-sm text-muted mb-5">Add your {g.name} details to register for {t.title}.</p>
            <div className="space-y-4">
              <Field label="Game UID">
                <input value={uid} onChange={e => setUid(e.target.value)} className="ntz-input" placeholder="e.g. 512983471" />
              </Field>
              <Field label="In-Game Name">
                <input value={ign} onChange={e => setIgn(e.target.value)} className="ntz-input" placeholder="e.g. PlayerX" />
              </Field>
              {error && <p className="text-sm text-danger">{error}</p>}
            </div>
            <button onClick={handleProfileNext} className="w-full bg-accent font-semibold py-3 rounded-xl mt-6 flex items-center justify-center gap-2">
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {step === 'review' && (
          <div>
            <h2 className="font-display font-bold text-xl text-primary mb-1">Review Details</h2>
            <p className="text-sm text-muted mb-5">Confirm before you register.</p>
            <div className="bg-surface2 rounded-2xl p-4 div-rows mb-6">
              <RevRow label="Tournament" value={t.title} />
              <RevRow label="Game" value={g.name} />
              <RevRow label="Format" value={t.format} />
              <RevRow label="Starts" value={formatWhen(t.startAt)} />
              <RevRow label="In-Game Name" value={ign} />
              <RevRow label="Game UID" value={uid} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('profile')} className="flex-1 btn-secondary font-semibold py-3 rounded-xl">Back</button>
              <button onClick={handleConfirm} disabled={busy} className={cx('flex-1 bg-accent font-semibold py-3 rounded-xl flex items-center justify-center gap-2', busy && 'opacity-60')}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Confirm
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <Check size={26} />
            </div>
            <h2 className="font-display font-bold text-xl text-primary mb-1">Registration Successful</h2>
            <p className="text-sm text-muted mb-6">You're in for {t.title}.</p>
            <div className="bg-surface2 rounded-2xl p-4 div-rows text-left mb-6">
              <RevRow label="Format" value={t.format} />
              <RevRow label="Starts" value={formatWhen(t.startAt)} />
            </div>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => { onClose(); showToast('Registered for ' + t.title); }} className="w-full bg-accent font-semibold py-3 rounded-xl">View Tournament</button>
              <button onClick={() => { onClose(); navigate('myTournaments'); }} className="w-full btn-secondary font-semibold py-3 rounded-xl">My Tournaments</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* my tournaments                                                       */
/* ------------------------------------------------------------------ */

function MyTournamentsView() {
  const { user, tournaments, navigate } = useApp();
  const [tab, setTab] = useState('upcoming');
  const regs = user.registrations || [];
  const myTournaments = regs.map(r => tournaments.find(t => t.id === r.tournamentId)).filter(Boolean);
  const filtered = myTournaments.filter(t => t.status === tab);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-primary mb-4">My Tournaments</h1>
      <div className="flex bg-surface rounded-xl p-1 mb-5 border border-line">
        {['upcoming', 'live', 'completed'].map(s => (
          <button key={s} onClick={() => setTab(s)} className={cx('flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition', tab === s ? 'bg-accent' : 'text-muted')}>
            {s}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Trophy} title={`No ${tab} tournaments`} body={tab === 'upcoming' ? 'Join a tournament to see it here.' : undefined} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TournamentCard key={t.id} tournament={t} registered onOpen={() => navigate('tournamentDetail', { id: t.id })} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* match detail                                                         */
/* ------------------------------------------------------------------ */

function RoomField({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between bg-surface2 rounded-xl px-4 py-3">
      <div>
        <p className="text-tiny text-muted uppercase tracking-wide mb-0.5">{label}</p>
        <p className="font-mono font-semibold text-primary tracking-wide">{value}</p>
      </div>
      <button onClick={onCopy} aria-label={'Copy ' + label} className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center hover-dim">
        <Copy size={14} />
      </button>
    </div>
  );
}

function MatchDetailView() {
  const { tournaments, params, navigate, showToast } = useApp();
  const t = tournaments.find(x => x.id === params.tournamentId);
  const m = t && t.matches.find(x => x.id === params.matchId);
  if (!t || !m) return <EmptyState icon={AlertCircle} title="Match not found" />;

  const unlocked = !!m.roomId;

  function copy(text, label) {
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) { /* ignore */ }
    showToast(label + ' copied');
  }

  return (
    <div>
      <button onClick={() => navigate('myTournaments')} className="flex items-center gap-1.5 text-sm link-muted mb-4">
        <ArrowLeft size={15} /> Back
      </button>
      <GameTag gameId={t.gameId} />
      <h1 className="font-display font-bold text-2xl text-primary mt-1 mb-1">{t.title}</h1>
      <p className="text-sm text-muted mb-5">Match #{m.matchNumber} \u2022 {formatWhen(m.startAt)}</p>

      <div className="bg-surface border border-line rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          {unlocked ? <Unlock size={16} color="var(--live)" /> : <Lock size={16} color="var(--text-muted)" />}
          <span className="font-semibold text-primary">{unlocked ? 'Room Details' : 'Room Locked'}</span>
        </div>
        {!unlocked ? (
          <p className="text-sm text-muted">Room details are locked. They'll be available shortly before the match starts.</p>
        ) : (
          <div className="space-y-3">
            <RoomField label="Room ID" value={m.roomId} onCopy={() => copy(m.roomId, 'Room ID')} />
            <RoomField label="Password" value={m.roomPassword} onCopy={() => copy(m.roomPassword, 'Password')} />
          </div>
        )}
      </div>

      <div className="bg-surface border border-line rounded-2xl div-rows">
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted">Status</span>
          <MatchStatusPill status={m.status} />
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted">Game</span>
          <span className="font-medium text-primary">{gameById(t.gameId).name}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-muted">Format</span>
          <span className="font-medium text-primary">{t.format}</span>
        </div>
      </div>

      {t.status === 'completed' && t.leaderboard.length > 0 && (
        <div className="mt-5">
          <h3 className="font-semibold text-primary mb-2.5">Results</h3>
          <LeaderboardTable rows={t.leaderboard} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* profile                                                              */
/* ------------------------------------------------------------------ */

function ProfileView() {
  const { user, tournaments, navigate } = useApp();
  const regs = user.registrations || [];
  const myTournaments = regs.map(r => tournaments.find(t => t.id === r.tournamentId)).filter(Boolean);
  const won = myTournaments.filter(t => {
    if (t.status !== 'completed') return false;
    const profile = user.gameProfiles && user.gameProfiles[t.gameId];
    const mine = profile && t.leaderboard.find(l => l.name === profile.ign);
    return mine && mine.rank === 1;
  }).length;
  const totalPoints = myTournaments.reduce((sum, t) => {
    const profile = user.gameProfiles && user.gameProfiles[t.gameId];
    const mine = profile && t.leaderboard.find(l => l.name === profile.ign);
    return sum + (mine ? mine.total : 0);
  }, 0);

  const stats = [
    { label: 'Tournaments Joined', value: myTournaments.length },
    { label: 'Tournaments Won', value: won },
    { label: 'Matches Played', value: myTournaments.reduce((s, t) => s + t.matches.length, 0) },
    { label: 'Total Points', value: totalPoints },
  ];

  return (
    <div className="pb-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-surface2 flex items-center justify-center font-display font-bold text-2xl text-accent">
          {user.username ? user.username[0].toUpperCase() : 'P'}
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-primary">{user.username}</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-surface border border-line rounded-2xl p-4">
            <p className="font-display font-bold text-2xl text-primary">{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <h3 className="font-semibold text-primary mb-2.5">Game Profiles</h3>
      <div className="space-y-2.5 mb-6">
        {GAMES.map(g => {
          const p = user.gameProfiles && user.gameProfiles[g.id];
          return (
            <div key={g.id} className="bg-surface border border-line rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: g.color + '22' }}>
                  <Gamepad2 size={16} color={g.color} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-primary">{g.name}</p>
                  <p className="text-xs text-muted">{p ? `${p.ign} \u2022 UID ${p.uid}` : 'Not linked yet'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="font-semibold text-primary mb-2.5">Recent Tournaments</h3>
      {myTournaments.length === 0 ? (
        <EmptyState icon={Trophy} title="No tournaments yet" body="Join one from the Tournaments tab to see it here." />
      ) : (
        <div className="div-rows bg-surface border border-line rounded-2xl">
          {myTournaments.map(t => (
            <button key={t.id} onClick={() => navigate('tournamentDetail', { id: t.id })} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
              <div>
                <p className="font-medium text-sm text-primary">{t.title}</p>
                <GameTag gameId={t.gameId} />
              </div>
              <StatusBadge status={t.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* support                                                               */
/* ------------------------------------------------------------------ */

function SupportView() {
  const [tickets, setTickets] = useState([
    { id: 's1', category: 'Result dispute', subject: 'Kills not counted in Blaze Cup', status: 'In Progress', date: '2 days ago' },
    { id: 's2', category: 'Technical issue', subject: 'App crashed during registration', status: 'Resolved', date: '6 days ago' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Tournament issue', subject: '', description: '' });
  const categories = ['Tournament issue', 'Match issue', 'Result dispute', 'Account issue', 'Technical issue', 'Payment issue', 'Other'];
  const statusColor = { Open: '#5B8DEF', 'In Progress': '#F2B33D', 'Waiting for User': '#F14FA0', Resolved: '#35D07F', Closed: '#6B7280' };

  function submit(ev) {
    ev.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setTickets(list => [{ id: 's' + Date.now(), category: form.category, subject: form.subject, status: 'Open', date: 'Just now' }].concat(list));
    setForm({ category: 'Tournament issue', subject: '', description: '' });
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-bold text-2xl text-primary">Support</h1>
        <button onClick={() => setShowForm(s => !s)} className="bg-accent font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
          <Plus size={15} /> New Ticket
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-surface border border-line rounded-2xl p-4 mb-5 space-y-3.5">
          <Field label="Category">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="ntz-input">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="ntz-input" placeholder="Brief summary" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="ntz-input" placeholder="What happened?" />
          </Field>
          <button type="submit" className="w-full bg-accent font-semibold py-2.5 rounded-xl">Submit Ticket</button>
        </form>
      )}

      <h3 className="font-semibold text-primary mb-2.5">My Tickets</h3>
      {tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets yet" />
      ) : (
        <div className="space-y-2.5">
          {tickets.map(tk => (
            <div key={tk.id} className="bg-surface border border-line rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-tiny text-muted uppercase tracking-wide">{tk.category}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: statusColor[tk.status], background: statusColor[tk.status] + '1F' }}>{tk.status}</span>
              </div>
              <p className="font-medium text-sm text-primary mb-1">{tk.subject}</p>
              <p className="text-tiny text-muted">{tk.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* settings                                                              */
/* ------------------------------------------------------------------ */

function SettingsView() {
  const { user, persistUser, handleLogout, showToast } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.username);
  const [notifsOn, setNotifsOn] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function saveName() {
    if (!nameInput.trim()) return;
    persistUser({ ...user, username: nameInput.trim() });
    setEditingName(false);
    showToast('Profile updated');
  }

  async function deleteAccount() {
    try { await window.storage.delete('player-data'); } catch (e) { /* ignore */ }
    handleLogout();
  }

  const groups = [
    { title: 'Account', items: [
      { label: 'Edit Profile', render: 'editProfile' },
      { label: 'Change Password', render: 'static', note: 'Update your password' },
      { label: 'Logout', render: 'logout' },
      { label: 'Delete Account', render: 'delete' },
    ] },
    { title: 'Preferences', items: [
      { label: 'Theme', render: 'static', note: 'Dark' },
      { label: 'Notifications', render: 'toggle' },
      { label: 'Language', render: 'static', note: 'English' },
    ] },
    { title: 'Privacy & Security', items: [
      { label: 'Privacy', render: 'static', note: 'Manage data & visibility' },
      { label: 'Security', render: 'static', note: 'Login & session management' },
    ] },
    { title: 'Information', items: [
      { label: 'Terms', render: 'static' },
      { label: 'Privacy Policy', render: 'static' },
      { label: 'Community Guidelines', render: 'static' },
      { label: 'About', render: 'static' },
      { label: 'Version', render: 'static', note: '1.0.0' },
    ] },
  ];

  return (
    <div className="pb-6">
      <h1 className="font-display font-bold text-2xl text-primary mb-5">Settings</h1>
      {groups.map(grp => (
        <div key={grp.title} className="mb-6">
          <p className="text-tiny text-muted uppercase tracking-wide mb-2">{grp.title}</p>
          <div className="div-rows bg-surface border border-line rounded-2xl">
            {grp.items.map(item => (
              <div key={item.label} className="px-4 py-3.5">
                {item.render === 'editProfile' && (
                  editingName ? (
                    <div className="flex items-center gap-2">
                      <input value={nameInput} onChange={e => setNameInput(e.target.value)} className="ntz-input" />
                      <button onClick={saveName} aria-label="Save name" className="bg-accent px-3 py-2 rounded-lg"><Check size={15} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingName(true)} className="w-full flex items-center justify-between">
                      <span className="text-sm text-primary">{item.label}</span>
                      <span className="text-xs text-muted flex items-center gap-1">{user.username} <Pencil size={12} /></span>
                    </button>
                  )
                )}
                {item.render === 'static' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">{item.label}</span>
                    {item.note && <span className="text-xs text-muted">{item.note}</span>}
                  </div>
                )}
                {item.render === 'toggle' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">{item.label}</span>
                    <button onClick={() => setNotifsOn(v => !v)} aria-label="Toggle notifications" className="w-10 h-6 rounded-full relative" style={{ background: notifsOn ? 'var(--accent)' : 'var(--surface2)' }}>
                      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: notifsOn ? '18px' : '2px' }} />
                    </button>
                  </div>
                )}
                {item.render === 'logout' && (
                  <button onClick={handleLogout} className="w-full flex items-center justify-between">
                    <span className="text-sm text-danger font-medium">{item.label}</span>
                    <LogOut size={15} className="text-danger" />
                  </button>
                )}
                {item.render === 'delete' && (
                  <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-between">
                    <span className="text-sm text-danger font-medium">{item.label}</span>
                    <Trash2 size={15} className="text-danger" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 scrim" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-surface border border-line rounded-2xl p-5 w-full md:max-w-sm">
            <p className="font-semibold text-primary mb-1.5">Delete your account?</p>
            <p className="text-sm text-muted mb-5">This removes your profile and registrations from this device. This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 btn-secondary font-semibold py-2.5 rounded-xl">Cancel</button>
              <button onClick={deleteAccount} className="flex-1 font-semibold py-2.5 rounded-xl text-white" style={{ background: 'var(--danger)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* root app                                                              */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* admin (dev/testing only)                                            */
/* ------------------------------------------------------------------ */

function AdminHeader({ onLogout }) {
  return (
    <header className="sticky top-0 z-30 bg-app border-b border-line">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Shield size={15} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-lg tracking-wide text-primary">NOTZ Admin</span>
            <span className="text-tiny font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-danger bg-danger-10">Dev / Testing</span>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-1.5 text-sm font-medium btn-secondary px-3.5 py-2 rounded-xl">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </header>
  );
}

function AdminView({ tournaments, setTournaments, showToast }) {
  const activeCount = tournaments.filter(t => t.status !== 'completed').length;
  const upcomingCount = tournaments.filter(t => t.status === 'upcoming').length;
  const liveMatches = tournaments.reduce((sum, t) => sum + t.matches.filter(m => m.status === 'live').length, 0);
  const activePrizePool = tournaments.filter(t => t.status !== 'completed').reduce((sum, t) => sum + t.prizePool, 0);

  const stats = [
    { label: 'Active Tournaments', value: activeCount, icon: Trophy },
    { label: 'Upcoming', value: upcomingCount, icon: Clock },
    { label: 'Live Matches', value: liveMatches, icon: Radio },
    { label: 'Active Prize Pool', value: formatMoney(activePrizePool), icon: Users },
  ];

  function changeStatus(id, status) {
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    showToast('Status updated');
  }

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2.5 mb-1">
        <LayoutDashboard size={20} color="var(--accent)" />
        <h1 className="font-display font-bold text-2xl text-primary">Dashboard</h1>
      </div>
      <p className="text-sm text-muted mb-6">Signed in as the development admin account \u2014 changes here are local to this device.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface border border-line rounded-2xl p-4">
              <Icon size={16} color="var(--accent)" />
              <p className="font-display font-bold text-2xl text-primary mt-2">{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg text-primary">Tournaments</h2>
        <span className="text-xs text-muted">{tournaments.length} total</span>
      </div>
      <div className="bg-surface border border-line rounded-2xl div-rows">
        {tournaments.map(t => (
          <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3.5 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <GameTag gameId={t.gameId} />
                <span className="text-xs text-muted">{t.format}</span>
              </div>
              <p className="font-medium text-sm text-primary truncate">{t.title}</p>
              <p className="text-xs text-muted mt-0.5">{formatMoney(t.prizePool)} \u2022 {t.currentParticipants}/{t.maxParticipants}</p>
            </div>
            <select value={t.status} onChange={e => changeStatus(t.id, e.target.value)} className="ntz-input" style={{ width: 'auto' }}>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        ))}
      </div>

      <div className="bg-surface2 border border-line rounded-2xl p-4 mt-8">
        <p className="text-sm font-semibold text-primary mb-1">More admin tools</p>
        <p className="text-xs text-muted">Match management, result verification, player accounts, support tickets, and announcements aren't wired up yet \u2014 ask for any of these next and they can be added here.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [tournaments, setTournaments] = useState(() => buildTournaments());
  const [view, setView] = useState('home');
  const [params, setParams] = useState({});
  const [toast, setToast] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_SEED);
  const [joinModal, setJoinModal] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let adminRes = null;
      try { adminRes = await window.storage.get('admin-session'); } catch (e) { adminRes = null; }
      if (!cancelled && adminRes && adminRes.value) {
        setUser(JSON.parse(adminRes.value));
        setAuthed(true);
        setCheckingAuth(false);
        return;
      }
      let res = null;
      try { res = await window.storage.get('player-data'); } catch (e) { res = null; }
      if (!cancelled && res && res.value) {
        setUser(JSON.parse(res.value));
        setAuthed(true);
      }
      if (!cancelled) setCheckingAuth(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const navigate = useCallback((v, p) => {
    setView(v);
    setParams(p || {});
    if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0);
  }, []);

  const persistUser = useCallback(async (next) => {
    setUser(next);
    try { await window.storage.set('player-data', JSON.stringify(next)); }
    catch (e) { showToast('Could not save changes'); }
  }, [showToast]);

  const handleAuthed = useCallback((data) => {
    setUser(data);
    setAuthed(true);
    navigate('home');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    const key = user && user.role === 'admin' ? 'admin-session' : 'player-data';
    window.storage.delete(key).catch(() => { /* ignore */ });
    setAuthed(false);
    setUser(null);
    setView('home');
  }, [user]);

  const saveGameProfile = useCallback((gameId, profile) => {
    setUser(prev => {
      const next = { ...prev, gameProfiles: { ...prev.gameProfiles, [gameId]: profile } };
      window.storage.set('player-data', JSON.stringify(next)).catch(() => showToast('Could not save changes'));
      return next;
    });
  }, [showToast]);

  const joinTournament = useCallback((tournamentId, profile) => {
    setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, currentParticipants: t.currentParticipants + 1 } : t));
    setUser(prev => {
      const reg = { tournamentId, profile, joinedAt: Date.now() };
      const next = { ...prev, registrations: (prev.registrations || []).concat([reg]) };
      window.storage.set('player-data', JSON.stringify(next)).catch(() => showToast('Could not save changes'));
      return next;
    });
  }, [showToast]);

  const isRegistered = useCallback((tournamentId) => {
    return !!(user && (user.registrations || []).some(r => r.tournamentId === tournamentId));
  }, [user]);

  const markAllNotifsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (checkingAuth) {
    return (
      <div className="ntz min-h-screen flex items-center justify-center">
        <StyleTokens />
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    );
  }

  if (!authed || !user) {
    return (
      <div className="ntz min-h-screen">
        <StyleTokens />
        <AuthScreen onAuthed={handleAuthed} />
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="ntz min-h-screen">
        <StyleTokens />
        <AdminHeader onLogout={handleLogout} />
        <main className="max-w-6xl mx-auto px-4 py-6 fade-in">
          <AdminView tournaments={tournaments} setTournaments={setTournaments} showToast={showToast} />
        </main>
        <Toast message={toast} />
      </div>
    );
  }

  const ctx = {
    user, tournaments, view, params, navigate, showToast,
    saveGameProfile, joinTournament, isRegistered,
    notifications, notifOpen, setNotifOpen, markAllNotifsRead, unreadCount,
    joinModal, setJoinModal, handleLogout, persistUser,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div className="ntz min-h-screen pb-20 md:pb-0">
        <StyleTokens />
        <AppHeader />
        <main key={view} className="max-w-6xl mx-auto px-4 py-5 fade-in">
          {view === 'home' && <HomeView />}
          {view === 'tournaments' && <TournamentsView />}
          {view === 'tournamentDetail' && <TournamentDetailView />}
          {view === 'myTournaments' && <MyTournamentsView />}
          {view === 'matchDetail' && <MatchDetailView />}
          {view === 'profile' && <ProfileView />}
          {view === 'support' && <SupportView />}
          {view === 'settings' && <SettingsView />}
        </main>
        <NavBar />
        {joinModal && <JoinFlowModal tournamentId={joinModal} onClose={() => setJoinModal(null)} />}
        <Toast message={toast} />
      </div>
    </AppCtx.Provider>
  );
}
