# RSVP Write-Only & Admin Table Enhancements

## Context

The RSVP form currently pre-fills household contact info (email, phone, address) when revisited, which the user wants to prevent — making contact info write-only from the guest's perspective. Additionally, the admin guests table and household detail view need richer guest data displayed inline.

---

## Change 1: Write-Only Contact Info on RSVP Form

**Goal:** Guests can submit contact info but never see it pre-filled on revisit. Admins retain full read access.

**File:** [+page.server.ts](src/routes/rsvp/[code]/+page.server.ts)

- In the `load` function, **stop fetching** `household_contact_info` and stop returning `existingHouseholdContact` to the page.

**File:** [+page.svelte](src/routes/rsvp/[code]/+page.svelte)

- Remove references to `data.existingHouseholdContact` that pre-fill the email, phone, and address fields. Form fields will always start blank.

No RLS or migration changes needed — anon SELECT is already blocked; we're just removing the service-role fetch in the RSVP load function.

---

## Change 2: Admin Guests Table — Add Columns

**Goal:** Show attending status (3-state pill), ceremony interest (colored pill + other text), dietary restrictions, and child status in the guests table.

**File:** [+page.server.ts](src/routes/admin/guests/+page.server.ts)

- Already fetches `rsvps(attending, dietary_restrictions, song_request)` — good.
- **Add:** Fetch `ceremony_interest` records (query all, map by `guest_id`, similar to how the RSVP admin page does it).

**File:** [+page.svelte](src/routes/admin/guests/+page.svelte)

- Add table columns:
  - **Child** — badge/icon if `guest.is_child`
  - **Ceremony** — colored pill based on `interest_level`: green "Yes", yellow "Maybe", red "Not Likely", gray "Other" (with `other_text` tooltip or inline)
  - **Dietary** — comma-separated list from `dietary_restrictions.selections` + other text
- The **Status** column already shows attending as a 3-state pill — keep as-is.

---

## Change 3: Guest Detail Page — Verify Existing Info

**File:** [+page.svelte](src/routes/admin/guests/[id]/+page.svelte)

- Already displays: attending status, ceremony interest, dietary restrictions, song request, contact info.
- **Verify** all requested fields are present. No changes expected unless something is missing.

---

## Change 4: Household Detail — Convert Guest List to Table

**Goal:** Replace the simple guest list with a full table showing Name, Child, Attending, Ceremony, Dietary.

**File:** [+page.server.ts](src/routes/admin/households/[id]/+page.server.ts)

- Currently fetches `household` with `guests(*)` — **add** fetching of `rsvps` and `ceremony_interest` for guests in this household.

**File:** [+page.svelte](src/routes/admin/households/[id]/+page.svelte)

- Replace the `<ul>` guest list with a `<table>` containing columns:
  - **Name** — clickable link to guest detail, same as current
  - **Child** — badge if `is_child`
  - **Attending** — 3-state colored pill (Attending/Declined/Pending)
  - **Ceremony** — colored pill (Yes/Maybe/Not Likely/Other)
  - **Dietary** — comma-separated restrictions
  - **Actions** — Remove button (existing functionality)

---

## Verification

1. Visit an RSVP page for a household that already submitted → contact fields should be blank
2. Submit RSVP with contact info → check admin pages still show the data
3. Check admin guests table for new columns (child, ceremony, dietary)
4. Click into a guest detail page → verify all info present
5. Check a household detail page → verify new table with all columns
6. Test CSV export still includes contact info
