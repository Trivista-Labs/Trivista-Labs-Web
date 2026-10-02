---
title: Salon Booking System
summary: Online booking and salon management for a salon and aesthetic clinic in Ratnapura. Guests book online; staff run bookings, treatments, stock, purchasing and costing from one dashboard.
category: Booking and salon management
capability: business-systems
client: The Beauty Room by Nilu
status: live
url: https://www.thebeautyroom.lk/
# The management dashboard, with customer names and phone numbers blurred, and the public booking
# site on a phone, taken on 1 October 2026.
cover: ./images/beautyroom-dashboard.jpg
coverAlt: "The Beauty Room's management dashboard: bookings, treatments, specialists, inventory, suppliers, purchasing, recipes, costing, analytics and reports, with customer details blurred."
screen: ./images/beautyroom-phone.jpg
screenAlt: The Beauty Room's booking site on a phone, with buttons to book the salon or the aesthetic clinic.
coverLabel: Management dashboard
screenLabel: Booking site
stack:
  - Next.js 15
  - React 19
  - TypeScript
  - Tailwind CSS
  - Supabase (PostgreSQL)
  - GSAP
  - Upstash Redis
  - Resend
  - Vercel
caseStudy: true
draft: false
order: 2
missing:
  - The salon's approval of any quotes before they are published
  - Measured results, with how and when they were measured
---

## The client

The Beauty Room by Nilu is a hair and bridal salon with a medical aesthetic clinic, in Ratnapura. The salon
and the clinic share one business but offer very different services, from bridal styling and colour to
facials and laser treatments under a doctor's supervision.

## The problem

- **Double bookings.** Appointments came in by phone and WhatsApp and were written in a book. In the
  wedding season, the same stylist could be booked twice for the same morning.
- **Unknown treatment costs.** Products are bought by the litre or the box but used a few millilitres at a
  time, and import prices change often. Nobody could see what a treatment actually cost to deliver.
- **Rescheduling by phone.** Moving a client meant calling until someone answered.
- **Consent on paper.** Clinic treatments need the client's recorded consent.

## What we built

Two parts that share one database: the public site, where clients book, and a management system for the
staff.

- **The public site** has separate salon and clinic sections, each with its own look. Booking takes seven
  steps: salon or clinic, category, treatment, specialist, a time from the live availability, a phone
  number confirmed with a one-time SMS code, and a booking reference.
- **The management system** covers bookings, treatments, specialists, stock, suppliers, purchasing,
  treatment recipes, costing, analytics and reports.

## How it works

- **Double bookings are impossible.** Each booking is stored as a time range for one specialist, and
  PostgreSQL refuses any booking that overlaps one already held for the same person, using an exclusion
  constraint. If two people pick the same slot at the same moment, the second is told it has just gone and
  is offered other times.
- **Real availability.** The times offered take account of opening hours, staff rosters, existing bookings
  and the notice each treatment needs.
- **Stock kept as a ledger.** Stock levels change only through database functions for purchases, use and
  stocktakes, and every change is recorded. Each purchase updates the product's weighted average cost.
- **The cost of each treatment.** Every treatment has a recipe: the products and quantities it uses, with
  variants such as short or long hair. The system adds the recipe cost, the specialist's time and a share
  of overheads to show the margin on each treatment, and updates it when a purchase changes a product's
  cost.
- **Rescheduling by link.** Staff send the client a single-use link on WhatsApp. The client accepts the new
  time, asks for another or cancels, and the salon is told on Telegram.
- **Messages.** Confirmations and reminders go out by SMS through Sri Lankan gateways and by email. Replies
  of STOP are honoured.
- **Consent recorded.** For clinic treatments, the client types their name as a signature, and the system
  stores it with the version of the consent form and the booking it belongs to.
- **Staff access protected.** The management system needs an approved email address and a code from an
  authenticator app, and every action checks access again on the server. Booking and SMS codes are rate
  limited, and codes are stored only as hashes and expire after five minutes.
- **The site stays up.** Price and treatment changes reach the public site within seconds. If the database
  cannot be reached, the public pages fall back to a built-in copy of the treatment list.

## Where it stands

The site and the management system are live at [thebeautyroom.lk](https://www.thebeautyroom.lk/).
