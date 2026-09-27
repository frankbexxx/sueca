/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-orch-from-storage-leaf',
      severity: 'error',
      comment:
        'syncStorageKeys / clearLocalUserData must stay below auth & sync orchestration (TDZ/boot safety).',
      from: {
        path: '^src/services/(syncStorageKeys|clearLocalUserData)\\.ts$'
      },
      to: {
        path: '^src/services/(authState|syncEngine|syncEnqueue|syncFirstLinkFlow|clearSyncLocalState)\\.ts$'
      }
    },
    {
      name: 'no-orch-from-sync-storage-modules',
      severity: 'error',
      comment:
        'Low-level sync storage modules must not import high-level auth/sync orchestration.',
      from: {
        path: '^src/services/(syncMetadata|syncOutbox|syncFirstLinkSession|legacyStatsSeed|syncablePrefsRevision)\\.ts$'
      },
      to: {
        path: '^src/services/(authState|syncEngine|syncFirstLinkFlow)\\.ts$'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: ['node_modules', 'dist', 'android', 'ios']
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true
  }
};
