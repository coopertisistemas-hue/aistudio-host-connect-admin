# CONNECT Workflow

Standard workflow process for executing work in Host Connect.

---

## Role Definitions

### GP (General Partner / Product Owner)
- Defines feature scope and business requirements
- Prioritizes backlog and sets delivery timelines
- Approves scope changes and acceptance criteria

### Orchestrator
- Translates GP requirements into technical prompts
- Coordinates between GP and DEV
- Ensures prompts are clear, complete, and testable

### DEV (Developer)
- Executes technical implementation
- Writes code following CONNECT standards
- Returns logs and evidence of execution
- Ensures all changes are reversible

---

## Workflow Steps

### 1. Scope Definition (GP)
GP defines the full scope of work including:
- Feature requirements
- Acceptance criteria
- Priority and timeline
- Dependencies

### 2. Prompt Definition (Orchestrator)
Orchestrator creates detailed technical prompts:
- API requirements
- Database schema changes
- RLS policy updates
- Test scenarios

### 3. Execution (DEV)
DEV implements the work:
- Writes or modifies code
- Creates migrations if needed
- Updates RLS policies
- Verifies implementation

### 4. Execution Logs (DEV - Mandatory)
DEV MUST return execution logs for every task:
- Command outputs
- API response samples
- Database query results
- Test outcomes

### 5. Change Control

**No Silent Changes**
- Every code change must be documented
- Breaking changes require explicit approval
- Database changes must be traced

**Reversibility Requirement**
- Every change must have a rollback path
- Migrations must be backward-compatible where possible
- Feature flags for reversible rollouts

---

## Gate Requirements

### PRD Data Gate
- No access to production data without explicit GO approval
- Use staging or synthetic data for development
- Production data access requires documented justification

### Integration Gate
- Test all integrations before marking complete
- Verify API contracts are maintained
- Check backward compatibility

### Test Before Integration
- Run unit tests locally
- Run integration tests in staging
- Verify no regressions before merging

---

**Last Updated:** 2026-02-28  
**Version:** 1.0
