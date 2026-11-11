# NVIDIA Skillspector Check (always-on)

> OpenCode-facing rule source: `instructions/rules/nvidia-skillspector-check.md`.

## Mandatory skillspector verification before installation

Before installing any new skill in this repository, the skill MUST be checked against NVIDIA Skillspector. This is a mandatory verification step to ensure skills meet NVIDIA's standards for compatibility, security, and quality before being installed into the agents-config ecosystem.

## Verification requirements

1. **Skillspector pre-approval** - All new skills must be processed through NVIDIA Skillspector before installation
2. **Compliance validation** - Skillspector must report:
   - Compatibility with existing agent infrastructure
   - No security vulnerabilities or compliance issues
   - Adherence to NVIDIA's skill development guidelines
3. **Documentation** - Skillspector reports or approval artifacts must be included with the installation PR

## Implementation process

### Phase 1: Preparation
- Verify Skillspector access is available for the skill author
- Prepare skill metadata, documentation, and test coverage
- Ensure skill follows all existing patterns in `instructions/skills/`

### Phase 2: Skillspector validation
- Run NVIDIA Skillspector on the skill code
- Address any compliance, security, or compatibility issues
- Obtain Skillspector approval before proceeding

### Phase 3: Installation
- Register the skill in `opencode.json` (via `skills-lock.json` if needed)
- Add necessary files to `instructions/skills/`
- Update README or documentation as required

## Error handling

If Skillspector validation fails:
- Block skill installation until compliance issues are resolved
- Document the specific failures in the PR
- Require Skillspector re-approval after fixes

## Traceability

Skillspector validation results must be:
- Logged in the PR description
- Included as comments or artifacts in the repository
- Referenced in the DoD audit for skill-related changes

## Related rules

This rule works in conjunction with:
- `sdlc-gates.md` - The Implementation Gate must be passed before skill installation
- `harness-engineering.md` - Must follow least-privilege principles and security validation