import { FC, ReactElement, useRef } from 'react'
import { ContentSkeleton } from '../../packages/SpacesUISkeleton'
import { ErrorState } from '../../elements/EmptyState'
import { MainContent } from '../../elements/MainContent'

export const ContentLoader: FC<
  MakeOptional<ObservableLoaderProps, 'loadingContent' | 'errorContent'>
> = ({ observe, children, loadingContent, errorContent }) => {
  const skeleton = ContentSkeleton()
  return (
    <ObservableLoader
      observe={observe}
      loadingContent={loadingContent ?? skeleton}
      errorContent={
        errorContent ?? (
          <MainContent data-testid='loading-error'>
            <ErrorState />
          </MainContent>
        )
      }
    >
      {children}
    </ObservableLoader>
  )
}

export const ObservableLoader: FC<ObservableLoaderProps> = ({
  observe,
  children,
  loadingContent,
  errorContent,
}) => {
  const loaded = useRef<true>()
  const isFirstLoad = loaded.current === undefined
  loaded.current = true

  if (isFirstLoad && observe.loading) {
    return loadingContent
  }
  if (observe.error) {
    return errorContent
  }
  return children()
}

export type ObservableLoaderProps = {
  observe: Partial<{ loading: boolean; error: string | Error }>
  loadingContent: ReactElement
  errorContent: ReactElement
  children: () => ReactElement
}

type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> &
  Partial<Pick<Type, Key>>

export type OneOrMore<T> = T | Array<T>
