---
title: SwapUP
summary: Shift management for teams. A visual schedule of morning, afternoon and night shifts, swap requests that are tracked and approved by managers, and instant notifications.
category: Shift management
capability: products
client: Trivista Labs, own product
status: live
url: https://www.swapupnow.com/
# Screenshots of the public site, taken on 1 October 2026.
cover: ./images/swapup-site.jpg
coverAlt: "The SwapUP home page: “Shift Management, Simplified.”, beside a weekly shift schedule with a swap approved."
screen: ./images/swapup-phone.jpg
screenAlt: The SwapUP site on a phone, showing the weekly shift schedule.
coverLabel: Public site
screenLabel: On a phone
stack:
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - Node.js and Express
  - Prisma
  - PostgreSQL (Supabase)
  - Firebase Cloud Messaging
caseStudy: true
draft: false
order: 3
missing:
  - Screenshots of the admin panel and the staff app, with demonstration data
  - Measured results, with how and when they were measured
---

## The problem

Hotels, restaurants and shops run on shifts, and shifts change all the time. In most of these businesses,
the roster is a sheet on the staff-room wall, and changes happen in WhatsApp groups.

- **Swaps agreed informally.** When someone cannot work, they message colleagues until one agrees. The
  manager often hears about it late, or not at all.
- **Attendance hard to trust.** Fingerprint scanners fail in kitchens, where hands are wet or greasy, so
  businesses fall back on paper sign-in sheets, and people can sign in for absent colleagues.
- **Hours lost to admin.** Supervisors build rosters in spreadsheets, work out who was late and match
  leave notes to hours by hand.

## What we built

SwapUP is Trivista's own product, in two parts that work from the same data.

- **A web admin panel** for owners, managers and HR: the weekly schedule, live attendance, departments and
  their managers, leave rules and requests, and reports on punctuality by department.
- **A mobile app for staff:** their own roster, shift swaps proposed in chat, clocking in, leave requests
  and balances, team messages, and notifications when anything changes.

## How it works

- **Swaps with both sides agreed.** A worker picks a shift they cannot do and proposes it to an eligible
  colleague, as a card in their chat. The colleague accepts or declines. Only accepted swaps reach the
  manager, and when the manager approves, both rosters change in a single database transaction and both
  people are notified.
- **Clocking in needs two checks.** The worker scans the QR code on the wall at work, and the app sends
  the phone's location with it. The server refuses a clock-in from outside the workplace and records why.
  It then marks the worker on time or late, against the shift start and the business's grace period.
- **QR codes that can be replaced.** Each business's code is generated randomly. If a photo of it gets
  passed around, a manager makes a new one in one click and the old one stops working.
- **Shifts that cross midnight.** Dates are worked out in Sri Lankan time on the server, so a night shift
  and the day's attendance figures fall on the right day.
- **Businesses kept apart.** Every query is limited to one business's data, and new staff must change
  their temporary password the first time they sign in.

## Where it stands

SwapUP is live at [swapupnow.com](https://www.swapupnow.com/), with free and paid plans.
