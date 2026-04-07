# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Horizon Web is a cloud-native application management platform built with **UmiJS 3.5**, **React 17**, and **TypeScript**. It manages groups, applications, instances (clusters), templates, and deployments with RBAC. The UI uses **Ant Design 4** and **Ant Design Pro** components.

## Commands

```bash
# Development
yarn dev                     # Start dev server (with mock data, uses --openssl-legacy-provider)
yarn start:no-mock           # Dev against real API (proxy target in config/proxy.ts)
yarn start:test              # Dev against test API

# Build
yarn build                   # Production build
yarn analyze                 # Build with bundle analysis

# Lint
yarn lint                    # Run all linters (eslint + stylelint + prettier)
yarn lint:fix                # Auto-fix lint issues

# Test
yarn test                    # Jest tests (watch mode)
yarn test:component          # Test src/components only
yarn test:all                # Run all tests once

# Type check
yarn tsc                     # TypeScript check (no emit)

# Other
yarn generate                # Regenerate FilterBox PEG.js grammar parser
```

## Architecture

### Framework & Routing

- **UmiJS 3** meta-framework with DVA (Redux wrapper) for state management
- Routes defined in `config/routes.ts` — not file-system based, all explicit
- Layout: Ant Design Pro Layout (`@ant-design/pro-layout`)
- Micro-frontend support via **qiankun** (`@umijs/plugin-qiankun`)

### Resource Hierarchy

The core domain model is a tree: **Groups → Applications → Instances (Clusters)**. URL patterns follow:

- `/groups/{groupPath}/-/{section}` (e.g., `/groups/team-a/-/members`)
- `/applications/{appPath}/-/{section}` (e.g., `/applications/team-a/my-app/-/configs`)
- `/instances/{instancePath}/-/{section}` (e.g., `/instances/team-a/my-app/prod/-/pods/web-abc`)

The `/-/` separator distinguishes the resource path from the UI section.

### Key Source Directories

- `src/pages/` — Page components, organized by resource type (groups, applications, instances, templates, admin)
- `src/components/` — Reusable components (CodeEditor, Terminal, FilterBox, JsonSchemaForm, etc.)
- `src/services/` — API service layer, each subdirectory wraps `request()` calls with typed responses
- `src/models/` — DVA models (hooks-based): alert.ts, microapps.ts
- `src/locales/` — i18n translations (en-US, zh-CN)
- `config/` — UmiJS config, routes, proxy, default settings

### API Layer

- All API calls go through UmiJS `request()` (configured in `src/app.tsx` via `RequestConfig`)
- Services in `src/services/` export async functions returning `{ data: T }` responses
- API base path: `/apis/` — proxied in dev via `config/proxy.ts`
- Types: `API.*` namespace in `src/services/typings.d.ts`, plus domain-specific `.d.ts` files (`CLUSTER.*`, `TAG.*`, etc.)

### State & Data

- Global initial state loaded in `src/app.tsx` → `getInitialState()` (current user, roles)
- Access via `useModel('@@initialState')` hook
- Data fetching in components typically uses `useRequest()` from UmiJS

### RBAC

- Defined in `src/rbac.tsx` — resources, actions, role-permission mappings
- `RBAC.checkPermission(permission, role, resource)` for access checks
- Admin routes wrapped with `src/wrappers/auth.tsx`

### Key Enums & Constants

- `src/const.tsx` — ResourceType, PublishType, ClusterStatus, TaskStatus, etc.
- `src/rbac.tsx` — Resource names, Action names, permission definitions

### Styling

- **Less** with CSS Modules (camelCase convention via `cssLoader.localsConvention`)
- Co-located `index.less` files alongside components
- Also uses styled-components in some areas

### i18n

- UmiJS locale plugin, default locale: en-US
- Translations in `src/locales/{en-US,zh-CN}/` with module files (component, menu, pages, etc.)
- Usage: `<Intl id="path.to.key" />` component

### Path Aliases

- `@/*` → `src/*`
- `@@/*` → `src/.umi/*` (UmiJS generated internals)

## Conventions

- Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`, etc.)
- Pre-commit hooks (Husky): ESLint on JS/TS, Prettier on JSON/MD, StyleLint on Less
- `console.log` banned in production code (ESLint `no-console: 2`)
- Components use functional style with TypeScript interfaces for props
- Instances are called "clusters" internally (`ResourceType.INSTANCE = 'cluster'`)
