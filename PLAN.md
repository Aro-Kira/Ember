# Real QR Scanner System — Implementation Plan

## Overview

Replace the simulated QR scanner with a real camera-based system. The Youth Portal generates a scannable QR code; the Leader Portal scans it with the device camera. The leader selects the attendance mode (Sunday or Event) before scanning.

## Architecture

```
Youth Portal (check-in tab)          Leader Portal (scanner tab)
┌─────────────────────┐              ┌──────────────────────────┐
│  Real QR code with  │   camera     │  Mode: [Sunday | Event▼] │
│  user's UUID        │ ──────────→  │  [Event dropdown if Event]│
│  (qrcode.react)     │   scan       │  Camera viewfinder        │
└─────────────────────┘              │  (html5-qrcode)           │
                                     └──────────────────────────┘
                                              │
                              ┌────────────────┴────────────────┐
                              ↓                                 ↓
                   Sunday mode:                       Event mode:
                   POST /sunday-attendance/checkin     POST /leader/events/:id/checkin-member
```

---

## Step 1: Install Dependencies

### Youth Portal (`Ember-Youth-Portal/`)
```bash
npm install qrcode.react
```
Lightweight React component for generating QR codes as SVG.

### Leader Portal (`Ember-Youth-Leader-Portal/`)
```bash
npm install html5-qrcode
```
Browser-based QR code scanner using device camera. No server needed.

---

## Step 2: Youth Portal — Real QR Code Display

### File: `Ember-Youth-Portal/src/App.tsx`

**Changes:**

1. **Add import:**
   ```tsx
   import { QRCodeSVG } from 'qrcode.react';
   ```

2. **Remove unused state** (the simulate flow is no longer needed):
   - Remove `checkInScanning` state
   - Remove `checkInSuccess` state
   - Remove `justCheckedInToday` state

3. **Remove the `handleCheckInScan` function** entirely (lines ~530-572 in original). This was the simulate handler that called `api.checkInToEvent`.

4. **Replace mock QR grid in check-in tab** with real QR:
   - The check-in tab (TAB 3) currently renders a fake 5x5 grid of black squares as a "mock QR code"
   - Replace with `<QRCodeSVG value={profile.id} size={160} bgColor="#ffffff" fgColor="#1a1a1a" level="M" />`
   - Keep the same card layout, avatar, name, ID display, stats chips

5. **Update instructions text:**
   - Change from "Present this screen to a Youth Leader to register attendance, or click below to simulate."
   - To: "Present this QR code to a Youth Leader to register your attendance."

6. **Replace the simulate button** with a static "QR Code Active" status indicator (green badge with CheckCircle2 icon)

**No other tabs or functionality are affected.**

---

## Step 3: Leader Portal — Real Camera Scanner + Mode Selector

### File: `Ember-Youth-Leader-Portal/src/components/AttendanceScannerView.tsx`

**Full rewrite of this component.** Currently 257 lines of simulated scanner UI.

**New structure:**

1. **Mode selector** at the top of the scanner deck:
   - Two toggle buttons: `Sunday Service` | `Event`
   - When "Event" is selected, show a dropdown of events filtered to `type === 'live'` only
   - State: `scanMode: 'sunday' | 'event'` and `selectedEventId: string | null`

2. **Real camera scanner:**
   - Use `Html5QrcodeScanner` from `html5-qrcode`
   - Initialize camera on component mount
   - Render scanner into a div ref
   - On successful decode: extract the user ID string from the QR data

3. **On successful scan, route based on mode:**
   - **Sunday mode:** Call `onCheckInSunday(userId)` with today's date/time
   - **Event mode:** Call `onCheckInEvent(selectedEventId, userId)`
   - Show success/failure feedback in the right panel

4. **Scanner cleanup:**
   - Stop camera on component unmount
   - Handle camera permission denied gracefully

**New props interface:**
```tsx
interface AttendanceScannerViewProps {
  onCheckInMember: (rgId: string) => void;  // kept for backward compat
  onCheckInSunday: (userId: string) => void;
  onCheckInEvent: (eventId: string, userId: string) => void;
  members: YouthMember[];
  liveEvents: { id: string; title: string; date: string; time: string; }[];
}
```

**UI Layout (preserving existing design language):**
- Left 8-col: Camera viewfinder with mode selector, scan status, event dropdown
- Right 4-col: Scan result card (member profile on success), hardware specs footer

---

## Step 4: Leader Portal — App.tsx Handler Updates

### File: `Ember-Youth-Leader-Portal/src/App.tsx`

**Changes:**

1. **Add `handleCheckInSunday` handler:**
   ```tsx
   const handleCheckInSunday = async (userId: string) => {
     try {
       const today = new Date().toISOString().split('T')[0];
       const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
       await api.checkInSunday(userId, today, time);
     } catch (err) {
       console.error('Failed to record Sunday attendance:', err);
     }
   };
   ```

2. **Add `handleCheckInEvent` handler:**
   ```tsx
   const handleCheckInEvent = async (eventId: string, userId: string) => {
     try {
       const student = members.find(m => m.id === userId);
       if (!student) return;
       await api.checkInMemberToEvent(eventId, userId);
       // Update local event state
       setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, checkedIn: ev.checkedIn + 1 } : ev));
     } catch (err) {
       console.error('Failed to check in member to event:', err);
     }
   };
   ```

3. **Filter live events for the scanner:**
   ```tsx
   const liveEvents = events.filter(e => e.type === 'live');
   ```

4. **Pass new props to `AttendanceScannerView`:**
   ```tsx
   <AttendanceScannerView
     onCheckInMember={handleCheckInMember}
     onCheckInSunday={handleCheckInSunday}
     onCheckInEvent={handleCheckInEvent}
     members={members}
     liveEvents={liveEvents}
   />
   ```

---

## Step 5: Backend — No Changes

Existing endpoints already support both flows:

| Endpoint | Method | Body | Purpose |
|----------|--------|------|---------|
| `/api/v1/sunday-attendance/checkin` | POST | `{ userId, date, time }` | Record Sunday attendance |
| `/api/v1/leader/events/:id/checkin-member` | POST | `{ userId }` | Check in member to event |

---

## Files Modified

| File | Change |
|------|--------|
| `Ember-Youth-Portal/package.json` | Add `qrcode.react` |
| `Ember-Youth-Portal/src/App.tsx` | Replace mock QR with real `<QRCodeSVG>`, remove simulate button/handler |
| `Ember-Youth-Leader-Portal/package.json` | Add `html5-qrcode` |
| `Ember-Youth-Leader-Portal/src/components/AttendanceScannerView.tsx` | Full rewrite: real camera scanner + mode selector |
| `Ember-Youth-Leader-Portal/src/App.tsx` | Add `handleCheckInSunday`, `handleCheckInEvent`, pass live events + handlers |

---

## Data Flow Summary

### Sunday Attendance
```
Youth shows QR → Leader scans camera → Decodes userId
  → Leader mode = "Sunday"
  → POST /api/v1/sunday-attendance/checkin { userId, date: "2026-06-29", time: "10:30 AM" }
  → Stored in sunday_attendance table
```

### Event Attendance
```
Youth shows QR → Leader scans camera → Decodes userId
  → Leader mode = "Event" → selects "Youth Camp"
  → POST /api/v1/leader/events/:eventId/checkin-member { userId }
  → Stored in event_registrations table (checked_in = true)
```

---

## Verification

1. **Youth Portal:** Open check-in tab → QR code should render with user's ID
2. **Leader Portal:** Open scanner tab → toggle Sunday/Event mode → camera activates → scan QR → attendance recorded
3. **Backend:** Check `sunday_attendance` and `event_registrations` tables for new records
4. **Build check:** Run `npm run build` in both portals to verify no type errors
