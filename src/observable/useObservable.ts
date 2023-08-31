import { useCallback, useEffect, useMemo, useState } from "react";
import { MOCKS } from "../test/mocks";
import {
  GetParams,
  GetResult,
  LazyObservable,
  Observable,
  ObservableMeta,
} from "./Observable";

/**
 * This is a React hook that makes it easy to use observables inside
 * any functional React component.
 *
 * @param factory Either the observable or a factory function that returns the observable
 * @param params  Any default params to apply to the observable
 * @param testId  An optional user-defined key that makes it easy to mock a
 *                specific observable in a component
 *
 * @example Basic usage
 *
 * ```ts
 * const records = useObservable(() => getRecords({ page: params.page }))
 *
 * return <div>
 *   <ul>
 *     {record.data.map(r => <li>{r.name}</li>)}
 *   </ul>
 *   <button onClick={() => records.setParams({page: 2}).load()>Page 2</button>
 * </div>
 * ```
 *
 */
export function useObservable<R extends Observable = any>(
  factory: R | (() => R),
  params?: GetParams<R>,
  testId: string = "default"
): [R, GetResult<R>, ObservableMeta<R>] {
  const observable = useMockableFactory(testId, factory);
  if (params) observable.setParams(params);

  // track the observable in a dictionary if named for out-of-cycle updates
  useEffect(() => {
    if (testId !== "default") {
      NAMED_OBSERVABLES[testId] = observable;
      return () => {
        delete NAMED_OBSERVABLES[testId];
      };
    }
  }, []);

  const [meta, setMeta] = useState<ObservableMeta<R>>({
    data: observable.data,
    error: observable.error,
    isLoading: observable.isLoading,
  });

  /**
   * Shorthand for the event listener
   */
  const dataListener = () => {
    setMeta(() => ({
      error: observable.error,
      isLoading: observable.isLoading,
      data: observable.data,
    }));
  };

  /**
   * attach and detach this component from the observable lifecycle
   */
  useEffect(() => {
    observable.addEventListener("data", dataListener);
    observable.addEventListener("error", dataListener);
    observable.addEventListener("loading", dataListener);

    if (!observable.isAwake && !observable.isLazy) {
      observable.load(true);
    }

    return () => {
      observable.removeEventListener("data", dataListener);
      observable.removeEventListener("error", dataListener);
      observable.removeEventListener("loading", dataListener);
    };
  }, []);

  return [observable, meta.data!, meta];
}

/**
 * Use an observable as an action
 *
 * @param factory
 * @param cb
 * @param testId
 */
export function useAction<R extends LazyObservable<any, any> = any>(
  factory: R | (() => R),
  cb?: (res: GetResult<R>) => void,
  testId: string = "default-action"
): [(props?: GetParams<R>) => void, R] {
  const [request] = useObservable(factory, undefined, testId);
  const actionBase = useCallback(
    (props?: GetParams<R>) => request.setParams(props),
    []
  );
  const action = useCallback(
    (props?: GetParams<R>) => {
      actionBase(props).do(cb);
    },
    [cb]
  );
  return [action, request];
}

/**
 * Helper function for mocking the observable.
 *
 * @param testId
 * @param factory
 */
export function useMockableFactory<T extends Observable>(
  testId: string,
  factory: T | (() => T)
): T {
  return useMemo(() => {
    if (MOCKS[`OBSERVABLE_${testId}`] !== undefined) {
      return MOCKS[`OBSERVABLE_${testId}`] as T;
    }
    if (factory instanceof Observable) {
      return factory;
    } else {
      return factory();
    }
  }, []);
}

export function updateObservable(name: string, data: any) {
  if (NAMED_OBSERVABLES[name]) {
    NAMED_OBSERVABLES[name].setData(data);
  } else {
    throw new Error(
      `${name} is not a current observable and cannot be updated`
    );
  }
}

const NAMED_OBSERVABLES: Record<string, Observable<any>> = {};
