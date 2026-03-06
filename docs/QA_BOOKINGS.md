# QA CHECKLIST — BOOKINGS MODULE

**Module:** Reservas/Bookings  
**Date:** 2026-02-28  
**Status:** READY FOR QA

---

## 1. LIST PAGE (src/pages/Bookings.tsx)

### 1.1 Layout & Header
- [ ] Page title "Reservas" is displayed
- [ ] Page description is present
- [ ] "Nova Reserva" button is visible (for admin/manager)

### 1.2 Search & Filters
- [ ] Search input with icon is present
- [ ] Search filters by guest name, email, property
- [ ] Status filter dropdown works
- [ ] View toggle (list/calendar) works

### 1.3 Data Display
- [ ] Bookings table shows: guest name, property, dates, status, actions
- [ ] Status badges are color-coded
- [ ] Date formatting is correct (DD/MM/YYYY)
- [ ] Currency formatting is correct (R$ X.XXX,XX)

### 1.4 States
- [ ] Loading state shows DataTableSkeleton
- [ ] Empty state shows when no bookings (with CTA)
- [ ] Error state handles fetch failures

### 1.5 Role Gating
- [ ] Viewer cannot see "Nova Reserva" button
- [ ] Viewer cannot see edit/delete actions

---

## 2. CREATE/EDIT FORM (src/components/BookingDialog.tsx)

### 2.1 Dialog
- [ ] Title shows "Nova Reserva" for create
- [ ] Title shows "Editar Reserva" for edit
- [ ] Dialog opens on create button click
- [ ] Dialog opens on edit button click

### 2.2 Form Fields
- [ ] Guest name (required)
- [ ] Guest email (required, validated)
- [ ] Guest phone (optional)
- [ ] Property selection (required)
- [ ] Check-in date (required)
- [ ] Check-out date (required, > check-in)
- [ ] Number of guests (required)
- [ ] Room type selection
- [ ] Notes (optional)

### 2.3 Validation
- [ ] Required fields show error on blur
- [ ] Email format is validated
- [ ] Dates are validated (check-out > check-in)
- [ ] Cannot submit with validation errors

### 2.4 Actions
- [ ] Save button submits form
- [ ] Cancel button closes dialog
- [ ] Loading state during save
- [ ] Success toast on save
- [ ] Error toast on failure

### 2.5 Edit Mode
- [ ] Form is pre-filled with existing data
- [ ] Updates existing booking on save

---

## 3. DELETE ACTION

- [ ] Delete button triggers confirmation dialog
- [ ] Confirm deletes the booking
- [ ] Success toast after delete
- [ ] List updates after delete

---

## 4. CALENDAR VIEW

- [ ] Toggle switches to calendar view
- [ ] Calendar shows bookings by date
- [ ] Can navigate months

---

## 5. ROLE GATING

| Role | View | Create | Edit | Delete |
|------|------|--------|------|--------|
| owner | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ |
| staff_frontdesk | ✅ | ❌ | ❌ | ❌ |
| staff_housekeeping | ✅ | ❌ | ❌ | ❌ |
| viewer | ✅ | ❌ | ❌ | ❌ |

---

## 6. MULTI-TENANT SCOPING

### 6.1 Database Queries
- [ ] All queries include `org_id` filter
- [ ] All queries include `property_id` filter when applicable

### 6.2 Verification SQL
```sql
-- Run this to verify bookings are scoped to UPH org
SELECT COUNT(*) 
FROM public.bookings 
WHERE org_id = 'b729534c-753b-48b0-ab4f-0756cc1cd271';

-- Should return only bookings for that org (no cross-tenant data)
```

---

## 7. RLS POLICIES

### 7.1 Verification
```sql
-- Check bookings RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bookings';
```

Expected policies:
- SELECT: org_member can view
- INSERT: org_admin can create
- UPDATE: org_admin can update
- DELETE: org_admin can delete

---

## 8. MANUAL TEST CASES

### TC-001: Create New Booking
1. Login as admin
2. Click "Nova Reserva"
3. Fill form with valid data
4. Click "Salvar"
5. Verify booking appears in list
6. Verify success toast

### TC-002: Edit Booking
1. Click edit icon on existing booking
2. Modify guest name
3. Click "Salvar"
4. Verify changes in list
5. Verify success toast

### TC-003: Delete Booking
1. Click delete icon on booking
2. Confirm in dialog
3. Verify booking removed from list
4. Verify success toast

### TC-004: Filter by Status
1. Select "Confirmadas" from filter
2. Verify only confirmed bookings show
3. Select "Todos os Status"
4. Verify all bookings show

### TC-005: Search
1. Type guest name in search
2. Verify results filter in real-time
3. Clear search
4. Verify all bookings show

### TC-006: Viewer Restrictions
1. Login as viewer
2. Verify no "Nova Reserva" button
3. Verify no edit/delete actions
4. Verify read-only access

---

## 9. BUG CHECKLIST

- [ ] No console errors on page load
- [ ] No console errors on create
- [ ] No console errors on edit
- [ ] No console errors on delete
- [ ] No data leakage between orgs
- [ ] Dates display correctly in local timezone
- [ ] Currency displays correctly (BRL)

---

## 10. SIGN-OFF

| Role | Name | Date | Status |
|------|------|------|--------|
| DEV | MiniMax | 2026-02-28 | ✅ Ready |
| QA | [Pending] | [Pending] | [Pending] |
| GP | [Pending] | [Pending] | [Pending] |
