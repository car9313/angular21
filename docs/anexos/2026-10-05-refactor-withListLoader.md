# Anexo histórico — propuesta de refactor `withListLoader` / `withCrudWrites`

> **No es fuente de verdad.** Es la conversación original del 2026-10-05, conservada solo como contexto histórico. El código mencionado (`withListLoader`, `withListCoordinators`, `withCrudWrites`) **no existe** en el proyecto; la abstracción real es `withServerTable` + `withServerTableWrites` en `core/store/features/`. Para el estado vigente, leer `ESTADO-DEL-PROYECTO.md` y `docs/DECISIONES.md`.

---

Tienes razón, te confundí
withListLoader y withListCoordinators no existen en tu código. Me los inventé en la respuesta anterior como propuesta de refactor, sin dejarlo claro. Tu código tiene un solo withMethods con todo dentro. Vamos a anclar todo a tu código real y luego ver si merece la pena dividirlo.

Paso 1: qué hay hoy en tu RoleListStore
Tu store se compone así:

ts
export const RoleListStore = signalStore(
    withEntities<Role>(),
    withQuery(),
    withListStatus(),
    withFilters(),
    withModal<RoleModalMode, Role>(),
    withSelection<number>(),
    withState({ saving: false }),
    withFiltersPersistence({ ... }),
    withComputed(({ ids, entityMap, selectedId }) => ({ ... })),
    withMethods((store) => {
        const repository = inject(RoleRepository);
        return {
            load,                    // ← 1
            applyFiltersAndReload,   // ← 2
            clearFiltersAndReload,   // ← 2
            setSearchAndReload,      // ← 2
            setPageAndReload,        // ← 2
            setPageSizeAndReload,    // ← 2
            openAdd,                 // ← 3
            openEdit,                // ← 3
            openDetail,              // ← 3
            openPermissions,         // ← 3
            closeModalAndClearSelection, // ← 3
            createAndReload,         // ← 4
            updateAndReload,         // ← 4
            deleteAndReload,         // ← 4
        };
    })
);
Ese withMethods es uno solo y contiene 14 métodos. Ahora agrúpalos por lo que hacen:

Grupo	Métodos	Qué hacen
1. Cargar	load	rxMethod que llama repository.list y mete entidades
2. Coordinar lectura	applyFiltersAndReload, clearFiltersAndReload, setSearchAndReload, setPageAndReload, setPageSizeAndReload	mutan query/filters y llaman a load
3. Modales/selección	openAdd, openEdit, openDetail, openPermissions, closeModalAndClearSelection	coordinan withModal + withSelection
4. Escribir	createAndReload, updateAndReload, deleteAndReload	saving + repo + load + finalize
Esos 4 grupos son exactamente lo que en mi respuesta anterior llamé, respectivamente:

grupo 1 → withListLoader

grupo 2 → withListCoordinators

grupo 3 → (parte de coordinadores, parte dominio)

grupo 4 → withCrudWrites

O sea: no inventé capacidades nuevas, solo puse nombre a grupos que ya existían dentro de tu withMethods. Disculpa la confusión.

Paso 2: por qué querrías separarlos
Hoy tienes un archivo con 14 métodos mezclados. Si mañana creas UserListStore, ProductListStore, etc., vas a repetir los grupos 1, 2 y 4 casi idénticos (solo cambia el repo y el mensaje de error). El grupo 3 es mitad genérico mitad dominio.

La idea de separar es: un feature por grupo reutilizable, para que cada store solo aporte lo específico de su dominio.

Paso 3: cómo quedaría si extraes cada grupo a un feature
Voy a mostrarlo sin inventar nombres nuevos: uso exactamente los grupos de la tabla.

Feature A — solo load
ts
// core/store/features/with-list-loader.feature.ts
export function withListLoader<E extends { id: Id }, Id extends string | number>(config: {
  repository: () => { list(q: QueryParams): Observable<Page<E>> };
  errorMessage: string;
}) {
  return signalStoreFeature(
    withMethods((store) => {
      const repo = config.repository();
      return {
        load: rxMethod<QueryParams>((query$) =>
          query$.pipe(
            switchMap((q) => {
              store._setLoading(true);
              return repo.list(q).pipe(
                tap((page) => {
                  patchState(store, setAllEntities(page.objects ?? []));
                  store._setMeta(page.meta);
                  store._setLoading(false);
                }),
                catchError((e: unknown) => {
                  patchState(store, setAllEntities<E>([]));
                  store._setError(e instanceof Error ? e.message : config.errorMessage);
                  return EMPTY;
                }),
              );
            }),
          ),
        ),
      };
    }),
  );
}
Es literalmente tu método load movido a un archivo aparte, parametrizado por repo y mensaje.

Feature B — coordinadores de lectura
ts
// core/store/features/with-list-coordinators.feature.ts
export function withListCoordinators() {
  return signalStoreFeature(
    withMethods((store) => ({
      applyFiltersAndReload(v: Record<string, unknown>) {
        store.applyFilters(v);
        this.load(store.query());
      },
      clearFiltersAndReload() {
        store.clearFilters();
        this.load(store.query());
      },
      setSearchAndReload(text: string) {
        store.setSearch(text);
        this.load(store.query());
      },
      setPageAndReload(page: number) {
        store.setPage(page);
        this.load(store.query());
      },
      setPageSizeAndReload(size: number) {
        store.setPageSize(size);
        this.load(store.query());
      },
    })),
  );
}
Son tus 5 métodos del grupo 2, movidos tal cual. Nota: usan this.load, que viene del feature A. Por eso A debe ir antes que B.

Feature C — escrituras CRUD
ts
// core/store/features/with-crud-writes.feature.ts
export function withCrudWrites<E, Id>(config: {
  repository: () => {
    create(...args: any[]): Observable<E>;
    update(id: Id, ...args: any[]): Observable<E>;
    delete(id: Id): Observable<void>;
  };
}) {
  return signalStoreFeature(
    withState({ saving: false }),
    withMethods((store) => {
      const repo = config.repository();
      return {
        _runWrite<R>(op: () => Observable<R>): Observable<R> {
          return defer(() => {
            patchState(store, { saving: true });
            return op();
          }).pipe(
            tap(() => this.load(store.query())),
            finalize(() => patchState(store, { saving: false })),
          );
        },
        createAndReload(...args: any[]) { return this._runWrite(() => repo.create(...args)); },
        updateAndReload(id: Id, ...args: any[]) { return this._runWrite(() => repo.update(id, ...args)); },
        deleteAndReload(id: Id) { return this._runWrite(() => repo.delete(id)); },
      };
    }),
  );
}
Son tus 3 métodos del grupo 4 + la bandera saving. Nota: usan this.load y store.query(), que vienen de A y de withQuery. Por eso A y withQuery deben ir antes que C.

El store de roles quedaría
ts
export const RoleListStore = signalStore(
    withEntities<Role>(),
    withQuery(),
    withListStatus(),
    withFilters(),
    withModal<RoleModalMode, Role>(),
    withSelection<number>(),
    withFiltersPersistence({ storageKey: 'roles.list.filters', ttlMs: 24 * 60 * 60 * 1000 }),

    withListLoader<Role, number>({
      repository: () => inject(RoleRepository),
      errorMessage: 'No se pudieron cargar los roles.',
    }),
    withListCoordinators(),
    withCrudWrites<Role, number>({ repository: () => inject(RoleRepository) }),

    withComputed(({ ids, entityMap, selectedId }) => ({
      isEmpty: computed(() => ids().length === 0),
      selectedItem: computed(() => {
        const id = selectedId();
        return id !== null ? (entityMap()[id] ?? null) : null;
      }),
    })),

    withMethods((store) => ({
      openAdd() { store.openModal('add', null); },
      openEdit(item: Role) { store.select(item.id); store.openModal('edit', item); },
      openDetail(item: Role) { store.select(item.id); store.openModal('detail', item); },
      openPermissions(item: Role) { store.select(item.id); store.openModal('permissions', item); },
      closeModalAndClearSelection() { store.closeModal(); store.clearSelection(); },
    })),
);
Compara con tu versión original: el comportamiento es idéntico. Solo cambió dónde vive cada método. Los métodos genéricos (grupos 1, 2, 4) se fueron a features reutilizables. Los específicos de roles (grupo 3, openPermissions) se quedaron.

Paso 4: sobre withListCoordinators específicamente
Es solo un nombre para agrupar los 5 métodos que mutan la query y recargan. Podrías llamarlo withReloadCoordinators, withQueryReloads, o no extraerlo. Es una agrupación, no una capacidad nueva de NgRx Signals.

No existe en la librería. Es una convención que yo propuse. Si te resulta confuso, ignóralo: puedes dejar esos 5 métodos en el store concreto y solo extraer withListLoader y withCrudWrites, que son los que más se repiten.

Paso 5: qué ganas y qué pagas
Ganas:

withListLoader y withCrudWrites se escriben una vez y se reutilizan en N stores.

Añadir un método genérico (ej. refresh) se hace en un sitio.

Los stores concretos solo contienen lo del dominio.

Pagas:

3 archivos extra en core/store/features/.

Dependencia de orden entre features (withListLoader antes de withListCoordinators y withCrudWrites).

Debugging ligeramente más indirecto (el método no está en el archivo del store).

Paso 6: veredicto claro para tu caso
Si solo tienes RoleListStore: no extraigas nada. Déjalo como está. La abstracción cuesta más de lo que aporta con un único consumidor.

Si vas a tener 2+ stores parecidos: extrae solo withListLoader y withCrudWrites. Deja los coordinadores y los modales en cada store concreto. Esa es la frontera con mejor relación valor/coste.

withListCoordinators: opcional. Solo si te molesta repetir 5 métodos triviales en cada store.

Y lo más importante: ninguno de estos features existe en NgRx Signals. Son nombres que puse yo para agrupar métodos que tú ya tienes. La librería te da signalStoreFeature como mecanismo; qué features defines encima es decisión tuya.

