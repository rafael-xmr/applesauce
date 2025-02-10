import { describe, it, expect } from "vitest";
import { Observable, Subject, firstValueFrom } from "rxjs";
import { simpleTimeout, TimeoutError } from "./simple-timeout.js";

describe("simpleTimeout operator", () => {
  it("should throw TimeoutError after specified timeout period", async () => {
    const subject = new Subject<string>();
    const obs = subject.pipe(simpleTimeout(10));

    const promise = firstValueFrom(obs);

    await expect(promise).rejects.toThrow(TimeoutError);
    await expect(promise).rejects.toThrow("Timeout");
  });

  it("should throw TimeoutError with custom message", async () => {
    const subject = new Subject<string>();
    const customMessage = "Custom timeout message";
    const obs = subject.pipe(simpleTimeout(10, customMessage));

    const promise = firstValueFrom(obs);

    await expect(promise).rejects.toThrow(TimeoutError);
    await expect(promise).rejects.toThrow(customMessage);
  });

  it("should not throw when value emitted before timeout", async () => {
    const subject = new Subject<string>();
    const obs = subject.pipe(simpleTimeout(1000));

    const promise = firstValueFrom(obs);
    subject.next("test value");

    await expect(promise).resolves.toBe("test value");
  });

  it("should complete without error when source emits non-null value before timeout", async () => {
    const source = new Observable<string>((subscriber) => {
      subscriber.next("test value");
    });

    const result = await firstValueFrom(source.pipe(simpleTimeout(10)));
    expect(result).toBe("test value");
  });
});
