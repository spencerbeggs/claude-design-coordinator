# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Claude Design Coordinator, please
report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email security concerns directly to:

- **Email**: <spencer@beggs.codes>

Include the following information in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days for critical issues

## Security Considerations

### Known Limitations

This project has some intentional limitations documented in the README:

- **No Authentication**: The coordination server does not authenticate clients.
  Any client can join any session. Deploy behind a firewall or VPN for
  sensitive use cases.

- **In-Memory State**: Session data is not persisted. Server restarts clear all
  state.

- **Local Network**: By default, the server binds to `localhost`. If exposing
  to a network, ensure appropriate access controls are in place.

### Recommendations

When deploying Claude Design Coordinator:

1. Run the server on a trusted network or behind a VPN
2. Do not expose the WebSocket port to the public internet
3. Use environment-specific configurations for HOST binding
4. Monitor server logs for unexpected connection attempts

## Scope

This security policy applies to:

- `@spencerbeggs/claude-coordinator-core`
- `@spencerbeggs/claude-coordinator-server`
- `@spencerbeggs/claude-coordinator-mcp`

Third-party dependencies are managed through regular updates and security
audits via `pnpm audit`.
