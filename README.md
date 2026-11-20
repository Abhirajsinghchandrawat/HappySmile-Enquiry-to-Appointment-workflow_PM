# HappySmile — Enquiry-to-Appointment Prototype
live Link: https://happy-smile-enquiry-to-appointment.vercel.app/

Product management task onboarding and flow: **AI-assisted enquiry-to-appointment conversion workflow** for a fictional 12-clinic dental chain. AI makes the first callback within minutes, and front-desk staff handle exceptions: human requests, clinical questions, uncertain calls and slot confirmation.

> All data is fictional. There is no live calling, calendar or booking integration.

## Screens
1. **Patient enquiry** (`#/patient`, mobile-first): enquiry confirmation, treatment summary, English/Hindi, AI disclosure, explicit consent for an automated call, human-callback option, confirmation state.
2. **Front-desk dashboard** (`#/dashboard`, desktop-first): KPIs, a prioritised lead queue, a lead detail panel and staff actions (mark contacted, update booking, confirm slot, complete follow-up, prioritise human callback, assign).

The two screens share state. When the patient submits on screen 1, the enquiry shows up on screen 2. There you can use the clearly labelled *Prototype only* controls to simulate the AI call outcome.

## Workflow rules encoded (`src/lib/leadLogic.ts`)
- Human callback requests and AI handoffs are pinned to the top of the queue.
- Clinical questions and low-confidence calls are always handed off. The AI never advises.
- The AI makes at most 2 unanswered attempts, then stops and the lead moves to staff.
- AI only *requests* a slot. Staff confirm it, so the prototype never claims a live booking.
- Opted-out patients are never called by the AI.

## Run
```bash
npm install
npm run dev     # local
npm run build   # typecheck + production build
```

## Structure
```
src/
  App.tsx                 prototype switcher + hash routing
  screens/                PatientEnquiry, Dashboard
  components/             KpiCards, LeadTable, LeadDetail, StatusBadge, Logo
  store/LeadsContext.tsx  shared state + workflow actions (reducer)
  lib/                    lead logic (next action, intervention, sorting), formatting
  data/                   types, constants, fictional mock leads
  i18n/                   patient copy (English / Hindi)
```
