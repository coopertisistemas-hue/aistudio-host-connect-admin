# CONNECT UI CRUD STANDARD

**Version:** 1.0  
**Date:** 2026-02-28  
**Status:** APPROVED

---

## 1. OVERVIEW

This document defines the standard UI pattern for all CRUD modules in Host Connect. The pattern ensures visual consistency, proper user experience, and security compliance across all pages.

---

## 2. LIST PAGE STANDARD

### 2.1 Required Elements

| Element | Description | Required |
|---------|------------|----------|
| Page Title | H1 with module name | ✅ |
| Description | Subtitle explaining the page | ✅ |
| Action Button | "New [Resource]" button | ✅ |
| Search Input | Text search with icon | ✅ |
| Filters | Dropdown/filter controls | ✅ |
| View Toggle | List/Calendar or similar | Optional |
| Data Table | Main content area | ✅ |
| Pagination | Page navigation | ✅ |
| Empty State | When no data | ✅ |
| Loading State | Skeleton during fetch | ✅ |
| Error State | On fetch failure | ✅ |

### 2.2 List Page Layout

```
+----------------------------------------------------------+
|  [Page Title]                              [+ New Item]  |
|  [Page Description]                                       |
+----------------------------------------------------------+
|  [Search Input............] [Filter] [Filter] [ViewMode]  |
+----------------------------------------------------------+
|  TABLE / LIST CONTENT                                    |
|  - Columns with headers                                 |
|  - Row actions (edit, delete, view)                     |
|  - Status badges                                        |
+----------------------------------------------------------+
|  [< Prev] Page 1 of 10 [Next >]                        |
+----------------------------------------------------------+
```

### 2.3 UX Standards

- **Loading:** Show `DataTableSkeleton` component
- **Empty:** Show `EmptyState` component with icon, title, description, CTA
- **Error:** Show error message with retry button
- **Search:** Debounced search (300ms)
- **Pagination:** 10-50 items per page

---

## 3. FORM STANDARD (CREATE/EDIT)

### 3.1 Dialog Requirements

| Element | Description | Required |
|---------|------------|----------|
| Title | "New [Resource]" or "Edit [Resource]" | ✅ |
| Form Fields | All required inputs | ✅ |
| Validation | Client-side + server-side | ✅ |
| Save Button | Primary action | ✅ |
| Cancel Button | Secondary action | ✅ |
| Dirty Guard | Confirm before leaving | ✅ |
| Success Toast | On save success | ✅ |
| Error Toast | On save failure | ✅ |
| Loading State | Disable during save | ✅ |

### 3.2 Form Validation Rules

- Required fields: Show error on blur if empty
- Email: Validate format
- Date: Validate range
- Numbers: Min/max constraints
- Custom: Module-specific validation

### 3.3 Dirty Guard Pattern

```typescript
const [isDirty, setIsDirty] = useState(false);

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

---

## 4. REPORT STANDARD

### 4.1 Required Elements

| Element | Description | Required |
|---------|------------|----------|
| Page Title | "Relatório de [Module]" | ✅ |
| Date Range | Start/End date pickers | ✅ |
| Filters | Additional filters | Optional |
| Apply Button | Run report | ✅ |
| Export CSV | Download button | ✅ |
| Print View | Print-friendly table | ✅ |
| Summary Cards | Key metrics | Optional |

### 4.2 Report Layout

```
+----------------------------------------------------------+
|  Relatório de [Module]                    [Export CSV]    |
+----------------------------------------------------------+
|  [Data Inicial] → [Data Final] [Aplicar]               |
+----------------------------------------------------------+
|  +------------------+  +------------------+               |
|  | Metric 1        |  | Metric 2        |               |
|  | Value           |  | Value           |               |
|  +------------------+  +------------------+               |
+----------------------------------------------------------+
|  TABLE / REPORT CONTENT                                 |
+----------------------------------------------------------+
|  [< Prev] Page 1 of 10 [Next >]                        |
+----------------------------------------------------------+
```

### 4.3 CSV Export

- Include all filtered columns
- Proper date formatting
- UTF-8 encoding with BOM
- Filename: `[module]_[date].csv`

---

## 5. ROLE GATING

### 5.1 Action Visibility

| Role | Create | Edit | Delete | View |
|------|--------|------|--------|------|
| owner | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ |
| staff_* | ⚠️ | ⚠️ | ❌ | ✅ |
| viewer | ❌ | ❌ | ❌ | ✅ |

### 5.2 Implementation Pattern

```typescript
const { userRole } = useAuth();
const isViewer = userRole === 'viewer';
const canEdit = ['admin', 'owner', 'manager'].includes(userRole);

// Hide create button
{!isViewer && <Button>Nova Reserva</Button>}

// Disable form inputs
<Input disabled={isViewer} />

// Hide delete action
{canEdit && <Button onClick={handleDelete}>Excluir</Button>}
```

---

## 6. MULTI-TENANT SCOPING

### 6.1 Required Patterns

All data hooks MUST include org_id:

```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('org_id', currentOrgId);

// ❌ WRONG - No org filter
const { data } = await supabase
  .from('bookings')
  .select('*');
```

### 6.2 Property-Level Scoping

For property-specific data:

```typescript
// Filter by property_id in addition to org_id
.eq('property_id', selectedPropertyId)
```

---

## 7. VISUAL CONSISTENCY

### 7.1 Component Library

Use shadcn/ui components:
- `Button` - Primary/Secondary/Ghost variants
- `Card` - For containers
- `Input` - For text fields
- `Select` - For dropdowns
- `Dialog` - For forms
- `Table` - For lists
- `Badge` - For status
- `Toast` - For notifications

### 7.2 Icons

Use Lucide React icons consistently.

### 7.3 Colors

| Purpose | Color |
|---------|-------|
| Primary | `hero` variant or brand color |
| Success | Green/green-500 |
| Warning | Yellow/yellow-500 |
| Error | Red/red-500 |
| Muted | `muted-foreground` |

---

## 8. ERROR HANDLING

### 8.1 API Errors

```typescript
try {
  await mutation.mutateAsync(data);
  toast({ title: 'Sucesso', description: 'Item salvo com sucesso' });
} catch (error: any) {
  toast({
    title: 'Erro',
    description: error.message || 'Falha ao salvar',
    variant: 'destructive'
  });
}
```

### 8.2 Loading States

```typescript
// Button loading
<Button disabled={mutation.isPending}>
  {mutation.isPending ? <Loader2 className="animate-spin" /> : 'Salvar'}
</Button>
```

---

## 9. CHECKLIST

### List Page
- [ ] Page title and description present
- [ ] Search input with icon
- [ ] Filters implemented
- [ ] Loading skeleton shown
- [ ] Empty state with CTA
- [ ] Error state with retry
- [ ] Pagination working
- [ ] Role gating applied

### Form Dialog
- [ ] Title reflects mode (create/edit)
- [ ] All required fields present
- [ ] Validation messages shown
- [ ] Save/Cancel buttons
- [ ] Dirty guard implemented
- [ ] Toast notifications work
- [ ] Loading state during save

### Report Page
- [ ] Date range filters
- [ ] Export CSV button
- [ ] Print-friendly view
- [ ] Summary metrics (if applicable)

---

## 10. APPROVAL

| Role | Name | Date |
|------|------|------|
| DEV | MiniMax | 2026-02-28 |
| ORCHESTRATOR | [Pending] | [Pending] |
| GP | [Pending] | [Pending] |
