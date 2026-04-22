import type {
  VersionStore,
  VersionStoreOptions,
  VersionRecord,
  VersionedData,
  VersionFields,
} from './types.js';

/**
 * Create a versioned-document store on top of a storage adapter.
 *
 * Lifted unchanged in shape from `qr-links-service/src/server/
 * content.ts`. Same algorithms — the BLOCK_TYPE constant becomes a
 * config option and the data type becomes generic. Consumers using
 * the existing slinqi storage shape can swap to this without a data
 * migration.
 */
export function createVersionStore<TData extends Record<string, unknown>>(
  options: VersionStoreOptions,
): VersionStore<TData> {
  const { storage, blockType } = options;

  function toRecord(doc: {
    id: string;
    data: Record<string, unknown>;
  }): VersionRecord<TData> {
    return { id: doc.id, ...(doc.data as VersionedData<TData>) };
  }

  return {
    async getPublishedBySlug(slug) {
      const docs = await storage.list(blockType, {
        where: { slug, status: 'published' },
        limit: 1,
      });
      return docs.length > 0 ? toRecord(docs[0]) : null;
    },

    async getById(id) {
      const doc = await storage.get(id);
      if (!doc || doc.blockType !== blockType) return null;
      return toRecord(doc);
    },

    async listLatestPerSlug() {
      const docs = await storage.list(blockType, {
        orderBy: { version: 'desc' },
      });
      const bySlug = new Map<string, VersionRecord<TData>>();
      for (const doc of docs) {
        const record = toRecord(doc);
        if (!bySlug.has(record.slug)) {
          bySlug.set(record.slug, record);
        }
      }
      return [...bySlug.values()];
    },

    async listVersions(slug) {
      const docs = await storage.list(blockType, {
        where: { slug },
        orderBy: { version: 'desc' },
      });
      return docs.map(toRecord);
    },

    async save(record) {
      const { id, ...data } = record;
      const existing = await storage.get(id);
      if (existing) {
        const doc = await storage.update(
          id,
          data as unknown as Record<string, unknown>,
        );
        return toRecord(doc);
      }
      const doc = await storage.create(
        blockType,
        data as unknown as Record<string, unknown>,
      );
      return toRecord(doc);
    },

    async publish(id) {
      const doc = await storage.get(id);
      if (!doc) throw new Error(`Version not found: ${id}`);
      const data = doc.data as VersionedData<TData>;

      const published = await storage.list(blockType, {
        where: { slug: data.slug, status: 'published' },
      });
      for (const p of published) {
        if (p.id !== id) {
          await storage.update(p.id, {
            ...p.data,
            status: 'archived' satisfies VersionFields['status'],
            updatedAt: Date.now(),
          });
        }
      }

      await storage.update(id, {
        ...data,
        status: 'published' satisfies VersionFields['status'],
        updatedAt: Date.now(),
      });
    },

    async unpublish(id) {
      const doc = await storage.get(id);
      if (!doc) throw new Error(`Version not found: ${id}`);
      await storage.update(id, {
        ...doc.data,
        status: 'draft' satisfies VersionFields['status'],
        updatedAt: Date.now(),
      });
    },

    async archive(id) {
      const doc = await storage.get(id);
      if (!doc) throw new Error(`Version not found: ${id}`);
      await storage.update(id, {
        ...doc.data,
        status: 'archived' satisfies VersionFields['status'],
        updatedAt: Date.now(),
      });
    },

    async delete(id) {
      const doc = await storage.get(id);
      if (!doc) throw new Error(`Version not found: ${id}`);
      await storage.delete(id);
    },

    async createNewVersion(id) {
      const doc = await storage.get(id);
      if (!doc) throw new Error(`Version not found: ${id}`);
      const source = doc.data as VersionedData<TData>;

      const versions = await storage.list(blockType, {
        where: { slug: source.slug },
        orderBy: { version: 'desc' },
        limit: 1,
      });
      const maxVersion =
        versions.length > 0
          ? (versions[0].data as VersionedData<TData>).version
          : 0;

      const newData: VersionedData<TData> = {
        ...source,
        status: 'draft',
        version: maxVersion + 1,
        updatedAt: Date.now(),
      };
      const newDoc = await storage.create(
        blockType,
        newData as unknown as Record<string, unknown>,
      );
      return toRecord(newDoc);
    },
  };
}
