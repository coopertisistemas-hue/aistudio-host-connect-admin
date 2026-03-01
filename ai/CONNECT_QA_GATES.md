# CONNECT QA Gates

Quality assurance checkpoints for Host Connect deployments.

---

## 1. Smoke Test Gate

**Purpose:** Verify basic system functionality after deployment

**Checks:**
- [ ] Application starts without errors
- [ ] API endpoints respond with 200 OK
- [ ] Authentication flow completes successfully
- [ ] Database connections are established
- [ ] Critical dependencies are available

**Failure Action:** Rollback deployment immediately

---

## 2. Migration Validation Gate

**Purpose:** Ensure database migrations are safe and correct

**Pre-Deployment Checks:**
- [ ] Migration files are idempotent
- [ ] Migration has been tested in staging
- [ ] Migration does not cause table locks on large tables
- [ ] Rollback migration exists

**Post-Deployment Checks:**
- [ ] RLS policies are still enabled on all tenant tables
- [ ] Indexes are created and functioning
- [ ] No migration errors in logs

**Failure Action:** Do not proceed; fix migration and re-validate

---

## 3. RLS Validation Gate

**Purpose:** Confirm Row-Level Security is enforced correctly

**Checks:**
- [ ] RLS enabled on all multi-tenant tables
- [ ] RLS policies exist for all access patterns
- [ ] Cross-tenant queries return zero results
- [ ] Tenant isolation tests pass
- [ ] Service role bypasses work as expected (for admin functions)

**Testing Approach:**
- Execute queries as different tenants
- Verify data leakage does not occur
- Confirm org_id and property_id filters are applied

**Failure Action:** Hotfix RLS policies before traffic routing

---

## 4. Production Data Gate

**Purpose:** Control access to production data

**Rules:**
- [ ] No PRD data access without GO gate approval
- [ ] All PRD data access is logged and audited
- [ ] PII is never exported without encryption
- [ ] Data access is time-limited and documented

**Approved Scenarios:**
- Debugging critical incidents (with incident ID)
- Data migration scripts (approved by GP)
- Legal/regulatory requests (with documentation)

**Failure Action:** Revoke access immediately; report to security team

---

## 5. Integration Contract Gate

**Purpose:** Verify external integrations remain functional

**Checks:**
- [ ] All API contracts are backward-compatible
- [ ] Third-party service integrations respond correctly
- [ ] Webhook deliveries succeed
- [ ] Authentication with external services works
- [ ] Rate limits are not exceeded

**Testing Environment:**
- Test in staging with mock/real external services
- Verify error handling for integration failures
- Confirm graceful degradation

**Failure Action:** Revert changes; re-test integration contracts

---

## Gate Sign-Off Matrix

| Gate | Required Sign-Off |
|------|-------------------|
| Smoke Test | DEV |
| Migration Validation | DEV + Orchestrator |
| RLS Validation | DEV + Security Review |
| Production Data | GP + Security |
| Integration Contract | DEV + QA |

---

**Last Updated:** 2026-02-28  
**Enforced By:** All team members
