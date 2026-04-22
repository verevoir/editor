/**
 * Versioning model for content documents.
 *
 * The store treats a "document" as one or more version records that
 * share a `slug`. Each version carries a `status` (draft / published
 * / archived), an integer `version` counter, and an `updatedAt`
 * timestamp. At most one version per slug may be `published` —
 * `publish()` enforces this by archiving any existing published
 * version for the same slug.
 *
 * The user's content fields live on the same data record. The store
 * doesn't care what those are; it only enforces the four reserved
 * fields below. Consumers parameterise by `TData` to keep their
 * content typed.
 */

export type VersionStatus = 'draft' | 'published' | 'archived';

/**
 * Reserved fields the version store reads and writes. Consumer
 * data shapes must be assignable to this — typically by spreading
 * over a base record.
 */
export interface VersionFields {
  slug: string;
  status: VersionStatus;
  version: number;
  updatedAt: number;
}

/**
 * The full data record stored in `storage.data` for one version.
 * Consumer's content fields union with the reserved versioning
 * fields. The persisted document also has the storage's own `id`,
 * surfaced on `VersionRecord` below for convenience.
 */
export type VersionedData<TData> = TData & VersionFields;

/**
 * One version record returned by the store — flat shape matching
 * what consumers actually want to read. `id` is the storage id of
 * the version document. The remaining fields are the consumer's
 * content plus the reserved versioning fields.
 */
export type VersionRecord<TData> = { id: string } & VersionedData<TData>;

export interface VersionStore<TData> {
  /**
   * Get the currently published version for a slug. Returns null if
   * no published version exists. Public-render path.
   */
  getPublishedBySlug(slug: string): Promise<VersionRecord<TData> | null>;

  /** Get a single version by its storage id. */
  getById(id: string): Promise<VersionRecord<TData> | null>;

  /**
   * Latest version per unique slug — the admin's "list of pages"
   * view. Returns one record per slug, picked as the highest
   * `version` number for that slug regardless of status.
   */
  listLatestPerSlug(): Promise<VersionRecord<TData>[]>;

  /** All versions for a single slug, newest version first. */
  listVersions(slug: string): Promise<VersionRecord<TData>[]>;

  /**
   * Save a version — create if id is unknown, update if known. The
   * caller controls every field, including reserved ones; the store
   * doesn't auto-bump `version` here. Use `createNewVersion` to
   * branch from an existing version with version+1.
   */
  save(record: VersionRecord<TData>): Promise<VersionRecord<TData>>;

  /**
   * Promote a version to `published`. Archives any other version of
   * the same slug currently at `published`. Updates `updatedAt`.
   */
  publish(id: string): Promise<void>;

  /** Demote a published version back to `draft`. */
  unpublish(id: string): Promise<void>;

  /** Archive a version explicitly (e.g. retiring a draft). */
  archive(id: string): Promise<void>;

  /** Delete a version document outright. */
  delete(id: string): Promise<void>;

  /**
   * Branch a new draft from an existing version. Increments the
   * version counter to one above the highest version found for the
   * slug, copies content, sets status to draft. Returns the new
   * record (with a new storage id).
   */
  createNewVersion(id: string): Promise<VersionRecord<TData>>;
}

/**
 * Structural StorageAdapter interface — only the methods this store
 * actually uses. Mirrors the `@verevoir/access/role-store` pattern;
 * keeps `@verevoir/editor` from taking a runtime dependency on
 * `@verevoir/storage`. Pass any object that satisfies this shape.
 */
export interface VersionStoreStorage {
  get(id: string): Promise<{
    id: string;
    blockType: string;
    data: Record<string, unknown>;
  } | null>;
  list(
    blockType: string,
    options?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, 'asc' | 'desc'>;
      limit?: number;
    },
  ): Promise<{ id: string; data: Record<string, unknown> }[]>;
  create(
    blockType: string,
    data: Record<string, unknown>,
  ): Promise<{ id: string; data: Record<string, unknown> }>;
  update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<{ id: string; data: Record<string, unknown> }>;
  delete(id: string): Promise<void>;
}

export interface VersionStoreOptions {
  /** The shared storage adapter — typically `@verevoir/storage`. */
  storage: VersionStoreStorage;
  /**
   * The `blockType` discriminator used when reading / writing
   * versions. Each store instance owns one block type — typically
   * one per content kind (`'page'`, `'article'`, etc.).
   */
  blockType: string;
}
