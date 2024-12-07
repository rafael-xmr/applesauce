import { Observable, OperatorFunction } from "rxjs";

/** Keeps retrying a value until the generator returns */
export function generatorSequence<T, R>(
  createGenerator: (value: T) => Generator<Observable<R>, undefined, R[] | undefined>,
): OperatorFunction<T, R> {
  return (source) => {
    return new Observable<R>((observer) => {
      let complete = false;

      const sub = source.subscribe({
        next: (value) => {
          const generator = createGenerator(value);

          const next = (prevResults?: R[]) => {
            const result = generator.next(prevResults);

            // generator complete, exit
            if (result.done) return;

            const results: R[] = [];
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
                // if the upstream observable was complete. exit
                if (complete) return observer.complete();

                // run next step
                next(results);
              },
            });
          };

          // start running steps
          next();
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
