---
title: Aura Gem ERP
summary: Resource planning for a gem mining and export business in Ratnapura. Purchasing, splitting, heat treatment, cutting, certificates and exports, with the cost and profit of every stone.
category: Enterprise resource planning
capability: business-systems
client: Abeywardhane Gems
status: on-request
# The owner's dashboard, with the business's figures blurred, taken on 1 October 2026.
cover: ./images/gemerp-dashboard.jpg
coverAlt: "Aura Gem ERP's home dashboard: inventory, sales and exports, heat treatment, cutting, certificates, financials, reports and an audit trail, with the business's figures blurred."
coverLabel: Owner's dashboard
stack:
  - Next.js 15
  - React 19
  - TypeScript
  - NestJS 10
  - PostgreSQL 16
  - Prisma
  - Docker and NGINX
  - Tailwind CSS
caseStudy: true
draft: false
order: 4
missing:
  - Measured results, with how and when they were measured
  - Screenshots with demonstration data, so nothing needs blurring
---

## The client

Abeywardhane Gems mines, treats, cuts and exports gemstones, mostly sapphires, from Ratnapura. A single
rough stone can pass through a dozen hands over several months: inspection, splitting, heat treatment,
cutting and a laboratory certificate, before it is sold abroad.

## The problem

- **The cost of a stone was lost when it was split.** When a rough stone was cut into two, its purchase
  price was not divided between the pieces. Months later, when one piece was sold, nobody knew what it
  had cost.
- **Processing costs disappeared into overheads.** Furnace fuel, cutters' fees, laboratory certificates,
  transport and export insurance were all booked as general expenses, not against the stones they were
  spent on.
- **Prices negotiated from memory.** At gem shows abroad, the sales team had no quick way to see what a
  stone had really cost, so they could sell below cost without knowing it.
- **Records kept in notebooks.** Furnace runs and handovers between workshops were written in personal
  logs, with no single view of which stone was where.
- **Ordinary ERP systems did not fit.** They expect identical products made from fixed parts. They cannot
  follow a stone that is split, loses half its weight when cut, or changes colour in a furnace.

## What we built

A system that follows each stone from purchase to sale: purchase, inspection, crack removal, splitting,
gas and electric heat treatment, cutting, certification, and export or local sale. Every cost along the
way is added to the stone it was spent on, so each stone shows its own cost and profit.

Stones are labelled with barcodes and QR codes, which staff scan with a phone camera or a scanner.

## How it works

- **Workflows are data, not code.** The system has templates for the common routes: a direct sale, rough
  processing, heat treatment of geuda, and stones bought already cut. Each new stone gets its own copy of
  the template's stages. Stages can be marked as not needed, but they stay visible, so the stone's real
  history is always on screen.
- **Splitting keeps the cost and the history.** One stone becomes several in a single database
  transaction. The new pieces inherit the parent's origin, seller and purchase date. The purchase cost is
  divided by weight, or by value when one piece is clearly worth more. Divided by weight, the rounding
  remainder goes to the last piece, so the parts always add up to the exact cent. Divided by value, the
  system refuses to save until the shares add up to the whole cost. The parent stone is then closed and
  cannot be sold or charged again.
- **Heat treatment.** Gas furnace runs record the furnace, temperature, atmosphere, time and operator,
  with photographs and weights before and after. Electric treatments that run for weeks get weekly entries
  and reminders when a batch is due to be checked.
- **Cutting.** The system records who cut the stone, in what style and for what fee, and works out the
  weight lost.
- **Certificates and exports.** Laboratory submissions and certificates are tracked with their scans.
  Certified stones are grouped into export shipments with the buyer, courier tracking and invoice.
- **Sold stones are locked.** Once a stone is sold or exported, nobody can change its costs or records, not
  even the owner, so the accounts cannot be altered afterwards.
- **A full audit trail.** Every change records who made it, when, from where, and the values before and
  after. The trail can be read but never edited or deleted.
- **Seven roles,** from the owner, who sees everything, to a furnace operator, who sees only the
  furnaces and treatment logs.
- **Exact numbers.** Money is stored to the cent and weights to a thousandth of a carat, as decimals,
  never as floating-point numbers that drift.
- **Nine reports,** including income, profit by stone, stock value, cash flow and treatment results,
  exported to PDF, Excel or CSV.
- **One business per installation.** Each business has its own server and database, so its prices,
  suppliers and buyers are never stored alongside another's. The whole system runs in Docker on an office
  machine with no internet connection, or in the cloud.

For example, a rough stone bought for LKR 850,000 is split into pieces of 17.20 and 8.40 carats, with
0.60 carats lost to the saw. Divided by weight, the pieces carry LKR 571,093.75 and LKR 278,906.25 of the
purchase cost. Every later cost, from the furnace to the export courier, is added to the piece it was
spent on.

## Where it stands

Aura Gem ERP is in use at Abeywardhane Gems. It is not open to the public, but gem businesses can ask for
access to see it working, and it is available to buy. [Ask us about Aura Gem ERP](/contact/).
