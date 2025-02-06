import { Observable, OperatorFunction } from "rxjs";

/** Keeps retrying a value until the generator returns */
export function generatorSequence<Input, Result>(
  createGenerator: (
    value: Input,
  ) =>
    | Generator<Observable<Result>, void, Result[] | undefined>
    | AsyncGenerator<Observable<Result>, void, Result[] | undefined>,
): OperatorFunction<Input, Result> {
  return (source) => {
    return new Observable<Result>((observer) => {
      let complete = false;

      const sub = source.subscribe({
        next: (value) => {
          const generator = createGenerator(value);

          const nextSequence = (prevResults?: Result[]) => {
            const p = generator.next(prevResults);

            const handleResult = (result: IteratorResult<Observable<Result>>) => {
              // generator complete, exit
              if (result.done) return observer.complete();

              const results: Result[] = [];
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
        },
        complete: () => {
          // source is complete
          complete = true;
        },
      });

      return () => sub.unsubscribe();
    });
  };
}
