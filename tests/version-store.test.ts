import { describe, it, expect, beforeEach } from 'vitest';
import { createVersionStore } from '../src/version-store/store';
import type { VersionStoreStorage } from '../src/version-store/types';

/**
 * In-memory StorageAdapter stub. Mirrors the bits of
 * `@verevoir/storage` the version store actually consumes — same
 * structural-typing trick the role-store and accounts use to stay
 * dependency-light.
 */
function makeStorage(): VersionStoreStorage {
  let nextId = 1;
  const docs = new Map<
    string,
    { id: string; blockType: string; data: Record<string, unknown> }
  >();

  function matches(
    docData: Record<string, unknown>,
    where: Record<string, unknown> | undefined,
  ): boolean {
    if (!where) return true;
    for (const [k, v] of Object.entries(where)) {
      if (docData[k] !== v) return false;
    }
    return true;
  }

  return {
    async get(id) {
      return docs.get(id) ?? null;
    },
    async list(blockType, options) {
      let results = Array.from(docs.values()).filter(
        (d) => d.blockType === blockType && matches(d.data, options?.where),
      );
      if (options?.orderBy) {
        const [field, dir] = Object.entries(options.orderBy)[0];
        results = [...results].sort((a, b) => {
          const av = a.data[field] as number;
          const bv = b.data[field] as number;
          return dir === 'desc' ? bv - av : av - bv;
        });
      }
      if (options?.limit !== undefined) results = results.slice(0, options.limit);
      return results.map((d) => ({ id: d.id, data: d.data }));
    },
    async create(blockType, data) {
      const id = String(nextId++);
      const doc = { id, blockType, data: { ...data } };
      docs.set(id, doc);
      return { id, data: doc.data };
    },
    async update(id, data) {
      const doc = docs.get(id);
      if (!doc) throw new Error('not found');
      doc.data = { ...data };
      return { id, data: doc.data };
    },
    async delete(id) {
      docs.delete(id);
    },
  };
}

interface PageContent {
  title: string;
  body: string;
}

describe('createVersionStore', () => {
  let storage: VersionStoreStorage;

  beforeEach(() => {
    storage = makeStorage();
  });

  it('saves a draft and reads it back by id', async () => {
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    const created = await store.save({
      id: 'placeholder',
      slug: '/about',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'About',
      body: 'Hello',
    });
    expect(created.id).not.toBe('placeholder');
    const read = await store.getById(created.id);
    expect(read).not.toBeNull();
    expect(read!.title).toBe('About');
    expect(read!.status).toBe('draft');
  });

  it('publishes a version and exposes it via getPublishedBySlug', async () => {
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    const v1 = await store.save({
      id: '',
      slug: '/about',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'About',
      body: 'Draft content',
    });
    expect(await store.getPublishedBySlug('/about')).toBeNull();
    await store.publish(v1.id);
    const live = await store.getPublishedBySlug('/about');
    expect(live).not.toBeNull();
    expect(live!.id).toBe(v1.id);
    expect(live!.status).toBe('published');
  });

  it('publishing a new version archives the prior published version', async () => {
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    const v1 = await store.save({
      id: '',
      slug: '/about',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'v1',
      body: 'first',
    });
    await store.publish(v1.id);
    const v2 = await store.createNewVersion(v1.id);
    expect(v2.version).toBe(2);
    expect(v2.status).toBe('draft');
    await store.save({ ...v2, body: 'second' });
    await store.publish(v2.id);

    const live = await store.getPublishedBySlug('/about');
    expect(live!.id).toBe(v2.id);
    expect(live!.body).toBe('second');

    const v1Now = await store.getById(v1.id);
    expect(v1Now!.status).toBe('archived');
  });

  it('listLatestPerSlug returns one record per slug, highest version', async () => {
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    const a = await store.save({
      id: '',
      slug: '/a',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'A',
      body: '',
    });
    await store.createNewVersion(a.id); // bump /a to v2
    await store.save({
      id: '',
      slug: '/b',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'B',
      body: '',
    });

    const latest = await store.listLatestPerSlug();
    expect(latest).toHaveLength(2);
    const aLatest = latest.find((r) => r.slug === '/a');
    expect(aLatest!.version).toBe(2);
  });

  it('listVersions returns all versions for a slug newest first', async () => {
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    const v1 = await store.save({
      id: '',
      slug: '/x',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'x',
      body: '',
    });
    await store.createNewVersion(v1.id);
    await store.createNewVersion(v1.id); // creates v3 from the v1 source
    const versions = await store.listVersions('/x');
    expect(versions.map((v) => v.version)).toEqual([3, 2, 1]);
  });

  it('unpublish demotes published back to draft', async () => {
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    const v1 = await store.save({
      id: '',
      slug: '/a',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'a',
      body: '',
    });
    await store.publish(v1.id);
    await store.unpublish(v1.id);
    const v1Now = await store.getById(v1.id);
    expect(v1Now!.status).toBe('draft');
    expect(await store.getPublishedBySlug('/a')).toBeNull();
  });

  it('archive sets status to archived', async () => {
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    const v1 = await store.save({
      id: '',
      slug: '/a',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'a',
      body: '',
    });
    await store.archive(v1.id);
    const v1Now = await store.getById(v1.id);
    expect(v1Now!.status).toBe('archived');
  });

  it('delete removes the version document', async () => {
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    const v1 = await store.save({
      id: '',
      slug: '/a',
      status: 'draft',
      version: 1,
      updatedAt: 0,
      title: 'a',
      body: '',
    });
    await store.delete(v1.id);
    expect(await store.getById(v1.id)).toBeNull();
  });

  it('getById returns null for the wrong block type', async () => {
    // Simulate a doc of a different blockType — store should ignore it.
    await storage.create('article', { slug: '/x', status: 'draft', version: 1, updatedAt: 0 });
    const created = await storage.list('article');
    const otherId = created[0].id;
    const store = createVersionStore<PageContent>({ storage, blockType: 'page' });
    expect(await store.getById(otherId)).toBeNull();
  });
});
