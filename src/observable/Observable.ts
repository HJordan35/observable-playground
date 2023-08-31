/**
 * This class is intended to provide a simple abstraction around any external
 * data state.
 *
 * The objective of this abstraction is to solve the following problems well:
 * 1. Support reloading state from an external endpoint with new params
 * 2. Make specific states of data, loading, or errors easily mockable
 * 3. Provide a single reference for loading states, DRY if(loading)
 *
 * Every single external API call producing state or loading statues should
 * be wrapped in an observable to reduce the likelhood of error.
 *
 * @todo debounce on reloading too often
 * @todo support a callback that connects reload to a pubsub event
 *
 * @example Basic usage
 *
 * ```ts
 * function getSearchResults(query: string) {
 *   new Observable(({ query }) => fetch("https://google.com/q=" + query))
 *     .setParams(query)
 * }
 *
 * const results = getSearchResults("flatfile")
 *
 * results.load()
 *
 * results.data // undefined
 * results.loading // true
 * results.error // undefined
 *
 * // ... some time later ...
 *
 * results.data // {...}
 * results.loading // false
 * results.error // undefined
 *
 * // after error
 *
 * results.data // undefined (or previous state)
 * results.loading // false
 * results.error // Error("something")
 *
 * // updating results
 * results.setParams({query: "flatfile is awesome"}).load()
 * results.loading // true
 *
 * // events provided for integration with component lifecycle
 * results.on('loading', ...)
 * results.on('data', ...)
 * results.on('error', ...)
 * ```
 */
export class Observable<R = any, P = any> extends EventTarget {
  /**
   * The cached data state of this observable from the last load.
   */
  public data?: R;

  /**
   * The last error observed.
   */
  public error?: Error;

  /**
   * Not true until a value has been set or loading has started
   */
  public isAwake: boolean = false;

  /**
   * The current loading status of the observable
   */
  public isLoading: boolean = false;

  /**
   * Indicate if this observable should begin loading immediately upon use or not
   */
  public isLazy: boolean = false;

  /**
   * The currently set params to be provided during .load()
   */
  public params?: P;

  /**
   * The params that were used in the last .load()
   */
  public lastLoadedParams?: P | "MOCKING";

  constructor(protected cb: (params: P) => Promise<{ data?: R }>) {
    super();
  }

  /**
   * Set the params to be used in the next `load` state
   *
   * @param params
   */
  public setParams(params: P): this {
    this.params = params;
    return this;
  }

  public awaken(): this {
    if (!this.isAwake) {
      this.load(true);
    }
    return this;
  }

  /**
   * Invoke the callback used to load the data asynchronously
   *
   * @param reload
   * @param cb
   */
  public load(reload = false, cb?: (res: R) => void): void {
    if (this.isLoading) {
      return;
    }
    this.isAwake = true;
    if (
      (!reload && this.params === this.lastLoadedParams) ||
      this.lastLoadedParams === "MOCKING"
    ) {
      if (this.lastLoadedParams === "MOCKING" && this.data) {
        cb?.(this.data);
      }
      return;
    }
    this.lastLoadedParams = this.params;
    this.error = undefined;
    this.isLoading = true;
    this.dispatchEvent(new Event("loading"));
    this.fetch(this.params as P, cb);
  }

  /**
   * Perform an action with a callback
   *
   * @param cb
   */
  public do(cb?: (res: R) => void): void {
    this.load(true, cb);
  }

  /**
   * Similar to load() but will invoke the callback even if the params
   * have not changed.
   *
   * @alias load(true)
   */
  public reload(): void {
    this.load(true);
  }

  /**
   * Refetches data without a loading status.
   *
   * @param cb
   */
  public refetch(cb?: (res: R) => void): void {
    this.lastLoadedParams = this.params;
    this.fetch(this.params as P, cb);
  }

  /**
   * Set the data state of this observable. Can be called externally to
   * seed the state of an observable or mock it.
   *
   * @param data
   */
  public setData(data?: R) {
    if (data) {
      this.isAwake = true;
    }
    this.data = data;
    this.dispatchEvent(new Event("data"));
  }

  /**
   * Make this Observable lazy
   */
  public get lazy(): LazyObservable<R, P> {
    this.isLazy = true;
    return this as LazyObservable<R, P>;
  }

  /**
   * Use this when you want to get a narrowed observable type only relevant after guarding is
   * completed.
   */
  public get ensured(): ReadyObservable<R> {
    if (!this.isAwake) {
      throw new Error("Loading has not yet started for this observable");
    }
    if (!this.data) {
      throw new Error(
        "Attempting to ensure data is available in an observable, but the observable is not ready"
      );
    }
    return this as ReadyObservable<R>;
  }

  public connectData<T>(observable: Observable<R, T>) {
    observable.addEventListener("data", () => {
      this.setData(observable.data);
    });
    return observable;
  }

  /**
   * @todo make this pubnub
   * @param pubnubStream
   */
  // public connectToPubnub<T>(pubnubStream: Observable<R, T>) {
  //   pubnubStream.onMessage('data', (mesage) => {
  //     this.setData(mesage.data)
  //   })
  //   return observable
  // }

  /**
   * Internal use function for invoking the callback and triggering all the
   * right events.
   *
   * @param params
   * @param cb
   * @protected
   */
  protected fetch(params: P, cb?: (res: R) => void): void {
    this.params = params;

    this.cb(this.params)
      .then((res) => {
        const data = res.data;

        this.setData(data);
        this.error = undefined;
        this.isLoading = false;
        cb?.(res.data!);
      })
      .catch((err) => {
        this.error = err;
        this.isLoading = false;
        this.dispatchEvent(new Event("error"));
      });
  }
}
export type LazyObservable<T, P = undefined> = Observable<T, P> &
  Required<{ isLazy: true }>;

export type ReadyObservable<T> = Observable<T> & Required<{ data: T }>;

export type ObservableMeta<T extends Observable = any> = Pick<
  T,
  "error" | "isLoading" | "data"
>;

export type GetResult<T> = T extends Observable<infer R, any> ? R : never;
export type GetParams<T> = T extends Observable<any, infer P> ? P : never;
