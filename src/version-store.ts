/**
 * Subpath entry for the version store. Consumers import from
 * `@verevoir/editor/version-store` to keep the surface explicit
 * and avoid pulling in the React editor when they only need the
 * pure store helpers.
 *
 * Mirrors the `@verevoir/access/role-store` /
 * `@verevoir/access/api-keys` pattern.
 */
export { createVersionStore } from './version-store/store.js';
export type {
  VersionStatus,
  VersionFields,
  VersionedData,
  VersionRecord,
  VersionStore,
  VersionStoreOptions,
  VersionStoreStorage,
} from './version-store/types.js';
