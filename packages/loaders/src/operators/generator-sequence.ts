import { isObservable, Observable, OperatorFunction } from "rxjs";

/** Keeps retrying a value until the generator returns */
export function generatorSequence<Input, Result>(
  createGenerator: (
    value: Input,
  ) =>
    | Generator<Observable<Result> | Result, void, Result[] | undefined>
    | AsyncGenerator<Observable<Result> | Result, void, Result[] | undefined>,
): OperatorFunction<Input, Result> {
  return (source) => {
    return new Observable<Result>((observer) => {
      const sub = source.subscribe((value) => {
        const generator = createGenerator(value);

        const nextSequence = (prevResults?: Result[]) => {
          const p = generator.next(prevResults);

          const handleResult = (result: IteratorResult<Observable<Result> | Result>) => {
            // generator complete, exit
            if (result.done) return observer.complete();

            const results: Result[] = [];
            if (isObservable(result.value)) {
              result.value.subscribe({
                next: (v) => {
                  // track results and pass along values
                  results.push(v);
                  observer.next(v);
                },
                error: (err) => {
                  observer.error(err);
                },
                complete: () => {
                  // run next step
                  nextSequence(results);
                },
              });
            } else {
              results.push(result.value);
              observer.next(result.value);
              nextSequence(results);
            }
          };

          // if its an async generator, wait for the promise
          if (p instanceof Promise)
            p.then(handleResult, (err) => {
              observer.error(err);
            });
          else handleResult(p);
        };

        // start running steps
        nextSequence();
      });

      return () => sub.unsubscribe();
    });
  };
}
