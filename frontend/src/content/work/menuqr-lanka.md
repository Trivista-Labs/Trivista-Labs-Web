---
title: MenuQR Lanka
summary: Digital menus for restaurants in Sri Lanka. Guests scan a QR code to browse the menu with photos and prices, and restaurants update it instantly.
category: Restaurant platform
capability: products
client: Trivista Labs, own product
status: live
url: https://www.menuqrlanka.com/
# Screenshots of the public site and its public demo menu, taken on 30 September 2026.
cover: ./images/menuqr-lanka-site.jpg
coverAlt: "The MenuQR Lanka home page: “Turn every table into a QR menu”, beside a phone showing a sample menu."
screen: ./images/menuqr-lanka-menu.jpg
screenAlt: "MenuQR Lanka's live demo menu for a sample restaurant, with search, categories and featured dishes."
coverLabel: Public site
screenLabel: Guest menu, live demo
stack:
  - Next.js 15
  - React 19
  - TypeScript
  - Tailwind CSS
  - Supabase (PostgreSQL)
  - Upstash Redis
  - Vercel
caseStudy: true
draft: false
order: 1
missing:
  - Permission to name the restaurants that use MenuQR Lanka
  - Measured results, with how and when they were measured
  - Screenshots of the restaurant dashboard
---

## The problem

Restaurant menus in Sri Lanka change often. Prices follow supplier costs, and dishes come and go with the
season. With printed menus, every change means a reprint or a pen correction. Tourists also need to know
what is in a dish, how spicy it is and whether it suits their diet, often in a language other than English.

Earlier digital menus did not fix this. PDF menus are slow to open on mobile data and hard to read on a
phone. Menu apps ask guests to install something and sign in before they can see what is on offer.

## What we built

MenuQR Lanka is Trivista's own product. A guest scans the QR code on the table, and the menu opens in the
phone's browser, with no app and no sign-in.

- **For guests:** photos and prices, search and categories, portion options such as regular or large,
  add-ons, and markers for spice and diet. Menus can be read in other languages, including German,
  French, Russian, Chinese and Japanese.
- **Ordering:** each table has its own QR code. Guests build an order and send it to the kitchen or the
  manager on WhatsApp or Telegram, so the restaurant needs no new till or hardware.
- **For owners:** prices, sold-out dishes and daily specials can be changed from a phone. Owners see scans,
  views, popular dishes, and taps on the call, WhatsApp and directions buttons.
- **The restaurant's own look:** the owner picks one brand colour, and the menu works out the rest of its
  palette from it, with text colours checked for contrast.

## How it works

- **Quick on mobile data.** Menu pages are built in advance and served from a CDN. When an owner changes a
  dish, only that restaurant's pages are rebuilt, so guests never see an old price.
- **Each restaurant's data kept apart.** Every table in the database is protected by row-level security in
  PostgreSQL. Guests read with narrow, anonymous access. Changes go through database functions that check
  who is making them.
- **Translations made once.** A menu is translated on the server and the result is stored, so a guest who
  switches language does not wait for a translation service. If that service is down, a built-in
  dictionary is used.
- **Light photos.** Owners' photos are resized and compressed in the browser before upload, to WebP files
  under 350 KB, with up to three per dish.
- **Visits counted without cookies,** using hashed identifiers instead.
- **Rate limits** use Upstash Redis, and fall back to limits kept in memory if Redis cannot be reached.

## Where it stands

MenuQR Lanka is live at [menuqrlanka.com](https://www.menuqrlanka.com/) and in use at restaurants in Sri
Lanka. The site has a demo menu for anyone to try.
