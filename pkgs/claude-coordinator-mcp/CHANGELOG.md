# @spencerbeggs/claude-coordinator-mcp

## 0.1.2

### Dependencies

| Dependency                              | Type       | Action  | From  | To    |
| --------------------------------------- | ---------- | ------- | ----- | ----- |
| @spencerbeggs/claude-coordinator-server | dependency | updated | 0.1.1 | 0.1.2 |

* | Dependency | Type       | Action  | From    | To      |                                                                          |
  | ---------- | ---------- | ------- | ------- | ------- | ------------------------------------------------------------------------ |
  | ws         | dependency | updated | ^8.21.0 | ^8.21.1 | [#57][#57] Thanks [@spencerbeggs](https://github.com/apps/spencerbeggs)! |

### Patch Changes

[#57]: https://github.com/spencerbeggs/claude-design-coordinator/pull/57

## 0.1.1

### Dependencies

* | [`1cca972`](https://github.com/spencerbeggs/claude-design-coordinator/commit/1cca9720ca16a8d13be843edd6a9dbc5fd894c92) | Dependency    | Type    | Action                | From                  | To |
  | :--------------------------------------------------------------------------------------------------------------------- | :------------ | :------ | :-------------------- | :-------------------- | -- |
  | @trpc/client                                                                                                           | dependency    | updated | ^11.17.0              | ^11.18.0              |    |
  | @trpc/server                                                                                                           | dependency    | updated | ^11.17.0              | ^11.18.0              |    |
  | @typescript/native-preview                                                                                             | devDependency | updated | ^7.0.0-dev.20260611.2 | ^7.0.0-dev.20260612.1 |    |
  | @savvy-web/bundler                                                                                                     | devDependency | updated | ^0.4.2                | ^0.6.0                |    |
  | vitest                                                                                                                 | devDependency | updated | ^4.1.8                | ^4.1.9                |    |
  | Dependency                                                                                                             | Type          | Action  | From                  | To                    |    |
  | ---------------------------------------                                                                                | ----------    | ------- | -----                 | -----                 |    |
  | @spencerbeggs/claude-coordinator-server                                                                                | dependency    | updated | 0.1.0                 | 0.1.1                 |    |

## 0.1.0

### Minor Changes

* dd83024: Initial release of Claude Design Coordinator packages.

  This release provides a coordination system enabling multiple Claude Code instances to communicate and share knowledge in real-time via WebSocket.

  **Note:** This is an unstable API. Breaking changes WILL occur in minor versions until 1.0.0.

### Patch Changes

* Updated dependencies \[dd83024]
  * @spencerbeggs/claude-coordinator-core\@0.1.0
  * @spencerbeggs/claude-coordinator-server\@0.1.0
