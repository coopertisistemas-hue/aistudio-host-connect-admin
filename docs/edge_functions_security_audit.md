# Edge Functions Security Audit Report

**Date**: 2026-01-19  
**Task**: TASK 5 — Edge Functions Review  
**Objective**: Audit and standardize all Supabase Edge Functions  
**Status**: Analysis Complete

---

## Executive Summary

### Overall Status: 🔴 **CRITICAL SECURITY RISKS**

**Functions Analyzed**: 10  
**Critical Vulnerabilities**: 8 functions  
**Secure Functions**: 2 functions (partially)

**Key Findings**:
- 🔴 **8 functions** use SERVICE_ROLE_KEY without JWT validation
- 🔴 **10 functions** have no org_id context verification
- 🔴 **10 functions** use English error messages (should be Portuguese)
- ⚠️ **No input sanitization** in most functions
- ⚠️ **Privilege escalation risks** in multiple functions

---

## 1. Functions Inventory

| # | Function Name | Purpose | Auth | Org Check | Risk Level |
|---|---------------|---------|------|-----------|------------|
| 1 | `check-availability` | Check room availability | ❌ None | ❌ None | 🔴 CRITICAL |
| 2 | `calculate-price` | Calculate booking price | ❌ None | ❌ None | 🔴 CRITICAL |
| 3 | `get-operational-identity` | Get property branding | ✅ JWT | ❌ None | 🟡 HIGH |
| 4 | `send-support-email` | Send support emails | ❌ None | ❌ None | 🟢 MEDIUM |
| 5 | `create-checkout-session` | Stripe checkout | ❌ None | ❌ None | 🔴 CRITICAL |
| 6 | `verify-stripe-session` | Verify Stripe payment | ❌ None | ❌ None | 🔴 CRITICAL |
| 7 | `sync-ota-inventory` | Sync OTA inventory | ❌ None | ❌ None | 🔴 CRITICAL |
| 8 | `get-public-website-settings` | Public website data | ❌ None | ❌ None | 🟢 LOW |
| 9 | `ai-proxy` | AI API proxy | ❌ None | ❌ None | 🔴 CRITICAL |
| 10 | `social-media-manager` | Social media posts | ❌ None | ❌ None | 🔴 CRITICAL |

---

## 2. Critical Vulnerabilities

### 2.1 Missing JWT Validation (8 functions)

**Affected Functions**:
- `check-availability`
- `calculate-price`
- `create-checkout-session`
- `verify-stripe-session`
- `sync-ota-inventory`
- `send-support-email`
- `ai-proxy`
- `social-media-manager`

**Issue**:
```typescript
// VULNERABLE CODE
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""  // ❌ Bypasses RLS
);
```

**Risk**:
- **SERVICE_ROLE_KEY bypasses ALL RLS policies**
- Any unauthenticated user can call these functions
- No user context for audit logging
- Privilege escalation possible

**Example Attack**:
```bash
# Attacker can check availability for ANY property
curl -X POST https://[project].supabase.co/functions/v1/check-availability \
  -H "Content-Type: application/json" \
  -d '{"property_id": "victim-org-property-id", ...}'
# ✅ SUCCEEDS - No auth required!
```

### 2.2 No Organization Context Verification (10 functions)

**Issue**:
None of the functions verify that the user has access to the requested `property_id` or `org_id`.

**Example Vulnerable Code**:
```typescript
// check-availability/index.ts
const { property_id, room_type_id, check_in, check_out } = await req.json();

// ❌ No verification that user owns/has access to this property
const { data: roomType } = await supabaseClient
  .from('room_types')
  .select('capacity')
  .eq('id', room_type_id)
  .eq('property_id', property_id)  // ❌ User can specify ANY property_id
  .single();
```

**Risk**:
- **Cross-organization data access**
- User from Org A can access Org B's data
- Violates multi-tenant isolation

**Example Attack**:
```typescript
// Authenticated user from Org A
const response = await fetch('/functions/v1/calculate-price', {
  method: 'POST',
  body: JSON.stringify({
    property_id: 'org-b-property-id',  // ❌ Accessing Org B's data
    room_type_id: '...',
    check_in: '2026-01-20',
    check_out: '2026-01-22'
  })
});
// ✅ SUCCEEDS - Returns Org B's pricing!
```

### 2.3 SERVICE_ROLE_KEY Misuse

**Issue**:
Using SERVICE_ROLE_KEY for user-initiated operations bypasses all security.

**Correct Usage**:
- ✅ **SERVICE_ROLE_KEY**: Only for admin/system operations
- ✅ **ANON_KEY + JWT**: For user-initiated operations (respects RLS)

**Current Usage** (WRONG):
```typescript
// ❌ BAD: User operation with SERVICE_ROLE_KEY
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);
```

**Correct Usage**:
```typescript
// ✅ GOOD: User operation with ANON_KEY + JWT
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  }
);
```

### 2.4 English Error Messages (10 functions)

**Issue**:
All error messages are in English, violating Portuguese (Brazil) requirement.

**Examples**:
```typescript
// ❌ WRONG
return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
  status: 400,
});

// ❌ WRONG
throw new Error('Property not found or access denied');

// ✅ CORRECT
return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' }), {
  status: 400,
});

// ✅ CORRECT
throw new Error('Propriedade não encontrada ou acesso negado');
```

### 2.5 No Input Validation/Sanitization

**Issue**:
Functions accept user input without validation or sanitization.

**Example**:
```typescript
// ❌ No validation
const { property_id, room_type_id, check_in, check_out } = await req.json();

// ✅ Should validate
if (!isValidUUID(property_id)) {
  throw new Error('ID de propriedade inválido');
}
if (!isValidDate(check_in) || !isValidDate(check_out)) {
  throw new Error('Datas inválidas');
}
```

---

## 3. Function-by-Function Analysis

### 3.1 check-availability

**Purpose**: Check room availability for booking  
**Risk Level**: 🔴 CRITICAL

**Vulnerabilities**:
1. ❌ No JWT validation (uses SERVICE_ROLE_KEY)
2. ❌ No org_id verification
3. ❌ Any user can check ANY property's availability
4. ❌ English error messages
5. ❌ No input validation

**Recommended Fix**:
```typescript
// 1. Use ANON_KEY + JWT
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  }
);

// 2. Verify user authentication
const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
if (userError || !user) {
  throw new Error('Não autenticado');
}

// 3. Verify user has access to property
const { data: property } = await supabaseClient
  .from('properties')
  .select('org_id')
  .eq('id', property_id)
  .single();

if (!property) {
  throw new Error('Propriedade não encontrada ou acesso negado');
}

// RLS will automatically enforce org_id isolation
```

### 3.2 calculate-price

**Purpose**: Calculate booking price with pricing rules  
**Risk Level**: 🔴 CRITICAL

**Vulnerabilities**:
1. ❌ No JWT validation (uses SERVICE_ROLE_KEY)
2. ❌ No org_id verification
3. ❌ Exposes pricing strategy to competitors
4. ❌ English error messages
5. ❌ No input validation

**Business Impact**:
- Competitor can discover pricing rules
- Sensitive business logic exposed
- Revenue leakage risk

**Recommended Fix**: Same as check-availability + add rate limiting

### 3.3 get-operational-identity

**Purpose**: Get property branding for operational UI  
**Risk Level**: 🟡 HIGH

**Vulnerabilities**:
1. ✅ Has JWT validation (GOOD!)
2. ❌ No org_id verification
3. ❌ User can get branding for ANY property
4. ❌ English error messages

**Partial Fix Needed**:
```typescript
// Already has JWT validation ✅
const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

// ❌ Missing: Verify user has access to property
// Add this:
const { data: property } = await supabaseClient
  .from('properties')
  .select('org_id')
  .eq('id', property_id)
  .single();

// RLS will enforce org_id check automatically
```

### 3.4 send-support-email

**Purpose**: Send support emails via Resend  
**Risk Level**: 🟢 MEDIUM

**Vulnerabilities**:
1. ❌ No JWT validation (but acceptable for public support)
2. ⚠️ Potential spam/abuse risk
3. ❌ English error messages
4. ❌ No rate limiting

**Recommended Fix**:
- Add rate limiting (max 5 emails per hour per IP)
- Add CAPTCHA verification
- Sanitize input to prevent XSS in email HTML
- Portuguese error messages

### 3.5 create-checkout-session & verify-stripe-session

**Purpose**: Stripe payment integration  
**Risk Level**: 🔴 CRITICAL

**Vulnerabilities**:
1. ❌ No JWT validation
2. ❌ No org_id verification
3. ❌ User can create checkout for ANY property
4. ❌ Payment fraud risk
5. ❌ English error messages

**Business Impact**:
- **Payment fraud**: User can create checkout for victim's property
- **Revenue theft**: Payments go to wrong account
- **Legal liability**: PCI compliance violation

**Recommended Fix**: URGENT - Implement full auth + org verification

### 3.6 sync-ota-inventory

**Purpose**: Sync inventory with OTA platforms  
**Risk Level**: 🔴 CRITICAL

**Vulnerabilities**:
1. ❌ No JWT validation
2. ❌ No org_id verification
3. ❌ Any user can trigger OTA sync for ANY property
4. ❌ Could cause overbooking/revenue loss
5. ❌ English error messages

**Business Impact**:
- **Overbooking**: Malicious sync can cause double bookings
- **Revenue loss**: Incorrect inventory sync
- **OTA penalties**: Platform violations

**Recommended Fix**: URGENT - Add API key authentication + org verification

### 3.7 get-public-website-settings

**Purpose**: Get public website settings  
**Risk Level**: 🟢 LOW

**Vulnerabilities**:
1. ✅ Public endpoint (no auth needed by design)
2. ⚠️ May expose sensitive settings
3. ❌ English error messages

**Recommended Fix**:
- Filter sensitive fields before returning
- Add caching to prevent abuse
- Portuguese error messages

### 3.8 ai-proxy

**Purpose**: Proxy AI API requests  
**Risk Level**: 🔴 CRITICAL

**Vulnerabilities**:
1. ❌ No JWT validation
2. ❌ No rate limiting
3. ❌ Cost abuse risk (AI API costs money)
4. ❌ English error messages

**Business Impact**:
- **Cost abuse**: Attacker can rack up AI API bills
- **Service degradation**: Excessive usage
- **Data leakage**: AI prompts may contain sensitive data

**Recommended Fix**: URGENT - Add JWT + rate limiting + cost tracking

### 3.9 social-media-manager

**Purpose**: Generate social media posts  
**Risk Level**: 🔴 CRITICAL

**Vulnerabilities**:
1. ❌ No JWT validation
2. ❌ No org_id verification
3. ❌ User can generate posts for ANY property
4. ❌ Brand damage risk
5. ❌ English error messages

**Business Impact**:
- **Brand damage**: Malicious posts
- **Legal liability**: Inappropriate content
- **Cost abuse**: AI generation costs

**Recommended Fix**: URGENT - Add JWT + org verification + content moderation

---

## 4. Secure Edge Function Template

### Template: Secure User-Initiated Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const isValidDate = (date: string): boolean => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );
  }

  try {
    // 1. Create Supabase client with ANON_KEY + JWT
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 2. Verify JWT and get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // 3. Parse and validate input
    const { property_id, ...otherParams } = await req.json();

    if (!property_id || !isValidUUID(property_id)) {
      return new Response(
        JSON.stringify({ error: 'ID de propriedade inválido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // 4. Verify user has access to property (RLS will enforce org_id)
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('id, org_id, name')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      return new Response(
        JSON.stringify({ error: 'Propriedade não encontrada ou acesso negado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // 5. Perform business logic
    // RLS policies will automatically enforce org_id isolation
    const { data, error } = await supabaseClient
      .from('some_table')
      .select('*')
      .eq('property_id', property_id);

    if (error) {
      console.error('Erro ao buscar dados:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar solicitação' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // 6. Return success response
    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Template: Secure System/Admin Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

serve(async (req) => {
  try {
    // 1. Verify API key (for system-to-system calls)
    const apiKey = req.headers.get('X-API-Key');
    const expectedKey = Deno.env.get('SYSTEM_API_KEY');

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Chave de API inválida' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // 2. Use SERVICE_ROLE_KEY for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Perform admin operation
    // ...

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

---

## 5. Refactoring Recommendations

### Priority 1: URGENT (Fix This Week)

**Functions**: `create-checkout-session`, `verify-stripe-session`, `sync-ota-inventory`, `ai-proxy`

**Actions**:
1. Add JWT validation
2. Add org_id verification
3. Replace SERVICE_ROLE_KEY with ANON_KEY
4. Add rate limiting
5. Portuguese error messages

### Priority 2: HIGH (Fix Next Week)

**Functions**: `check-availability`, `calculate-price`, `social-media-manager`

**Actions**:
1. Add JWT validation
2. Add org_id verification
3. Replace SERVICE_ROLE_KEY with ANON_KEY
4. Portuguese error messages

### Priority 3: MEDIUM (Fix This Month)

**Functions**: `get-operational-identity`, `send-support-email`

**Actions**:
1. Add org_id verification (get-operational-identity)
2. Add rate limiting (send-support-email)
3. Portuguese error messages

### Priority 4: LOW (Maintenance)

**Functions**: `get-public-website-settings`

**Actions**:
1. Filter sensitive fields
2. Add caching
3. Portuguese error messages

---

## 6. Implementation Checklist

### Per-Function Refactoring

- [ ] Replace SERVICE_ROLE_KEY with ANON_KEY + JWT
- [ ] Add JWT validation (`supabaseClient.auth.getUser()`)
- [ ] Add org_id verification (RLS will enforce)
- [ ] Add input validation (UUID, dates, etc.)
- [ ] Add input sanitization (prevent XSS, SQL injection)
- [ ] Replace English error messages with Portuguese
- [ ] Add rate limiting (if applicable)
- [ ] Add comprehensive error handling
- [ ] Add logging for audit trail
- [ ] Test with real user accounts
- [ ] Test cross-org access (should fail)

### Global Improvements

- [ ] Create shared validation utilities
- [ ] Create shared error message constants (Portuguese)
- [ ] Implement rate limiting middleware
- [ ] Add monitoring/alerting for function errors
- [ ] Document all functions in README
- [ ] Add integration tests

---

## 7. Portuguese Error Messages

### Standard Error Messages

```typescript
const ERROR_MESSAGES = {
  // Authentication
  NOT_AUTHENTICATED: 'Não autenticado',
  INVALID_TOKEN: 'Token inválido ou expirado',
  UNAUTHORIZED: 'Acesso não autorizado',
  
  // Validation
  MISSING_PARAMETERS: 'Parâmetros obrigatórios ausentes',
  INVALID_UUID: 'ID inválido',
  INVALID_DATE: 'Data inválida',
  INVALID_INPUT: 'Entrada inválida',
  
  // Resources
  PROPERTY_NOT_FOUND: 'Propriedade não encontrada ou acesso negado',
  ROOM_TYPE_NOT_FOUND: 'Tipo de quarto não encontrado',
  BOOKING_NOT_FOUND: 'Reserva não encontrada',
  
  // Business Logic
  NO_AVAILABILITY: 'Nenhum quarto disponível para o período selecionado',
  CAPACITY_EXCEEDED: 'Número de hóspedes excede a capacidade do quarto',
  MIN_STAY_VIOLATION: 'Requisito de estadia mínima não atendido',
  MAX_STAY_VIOLATION: 'Requisito de estadia máxima excedido',
  
  // System
  INTERNAL_ERROR: 'Erro interno do servidor',
  METHOD_NOT_ALLOWED: 'Método não permitido',
  RATE_LIMIT_EXCEEDED: 'Limite de taxa excedido. Tente novamente mais tarde',
};
```

---

## 8. Security Best Practices

### DO ✅

1. **Always validate JWT** for user-initiated operations
2. **Use ANON_KEY + JWT** for user operations (respects RLS)
3. **Verify org_id** via RLS policies (automatic with ANON_KEY)
4. **Validate all inputs** (UUIDs, dates, strings)
5. **Sanitize inputs** to prevent XSS/injection
6. **Use Portuguese** for all user-facing error messages
7. **Log all operations** for audit trail
8. **Implement rate limiting** for expensive operations
9. **Handle errors gracefully** with meaningful messages
10. **Test cross-org access** (should always fail)

### DON'T ❌

1. **Never use SERVICE_ROLE_KEY** for user operations
2. **Never skip JWT validation** for authenticated endpoints
3. **Never trust user input** without validation
4. **Never expose internal error details** to users
5. **Never use English** for user-facing messages
6. **Never allow cross-org access** without explicit permission
7. **Never log sensitive data** (passwords, tokens, PII)
8. **Never hardcode secrets** in code
9. **Never skip error handling**
10. **Never assume RLS is enough** - always verify explicitly

---

## 9. Testing Strategy

### Unit Tests

```typescript
// Test JWT validation
Deno.test("should reject unauthenticated requests", async () => {
  const response = await fetch('/functions/v1/check-availability', {
    method: 'POST',
    body: JSON.stringify({ property_id: '...' }),
    // No Authorization header
  });
  
  assertEquals(response.status, 401);
  const data = await response.json();
  assertEquals(data.error, 'Não autenticado');
});

// Test cross-org access
Deno.test("should reject cross-org access", async () => {
  const response = await fetch('/functions/v1/check-availability', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <org-a-user-token>',
    },
    body: JSON.stringify({ 
      property_id: '<org-b-property-id>',  // Different org
      // ...
    }),
  });
  
  assertEquals(response.status, 404);
  const data = await response.json();
  assertEquals(data.error, 'Propriedade não encontrada ou acesso negado');
});
```

---

## 10. Conclusion

### Current State: 🔴 CRITICAL

The Edge Functions have **severe security vulnerabilities** that allow:
- Unauthenticated access to sensitive operations
- Cross-organization data access
- Privilege escalation
- Payment fraud
- Cost abuse (AI APIs)
- Revenue loss (OTA sync)

### Immediate Actions Required:

**This Week** (URGENT):
1. Fix payment functions (`create-checkout-session`, `verify-stripe-session`)
2. Fix OTA sync (`sync-ota-inventory`)
3. Fix AI proxy (`ai-proxy`)

**Next Week** (HIGH):
4. Fix availability/pricing functions
5. Fix social media manager

**This Month** (MEDIUM):
6. Fix remaining functions
7. Implement shared utilities
8. Add comprehensive testing

### Estimated Effort:

- **Per function refactoring**: 2-3 hours
- **Shared utilities**: 4 hours
- **Testing**: 8 hours
- **Total**: ~40 hours (1 week)

---

**Status**: ⏳ AWAITING APPROVAL  
**Next Step**: Begin refactoring critical functions immediately  
**Risk Level**: CRITICAL - Production deployment not recommended until fixed
