import AsyncAbort from '../src/index';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setTimeout(100000);
})

afterEach(() => {
  jest.clearAllTimers();
})

function flushPromises() : Promise<any> {
  return new Promise(setImmediate);
}

function setTimeoutPromiseResolve(time: number): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(undefined), time);
  });
}

describe('AsyncAbort: a promise aborter', () => {
  test('should call then block', async () => {
    const asyncCall = () => Promise.resolve(44);
    const thenBlock = jest.fn();
    new AsyncAbort(asyncCall, []).then(thenBlock).call();
    await flushPromises();
    expect(thenBlock).toBeCalledWith(44);
  });

  test('should call catch block', async () => {
    const someError = new Error('some error');
    const asyncCall = () => Promise.reject(someError);
    const catchBlock = jest.fn();
    new AsyncAbort(asyncCall, []).catch(catchBlock).call();
    await flushPromises();
    expect(catchBlock).toBeCalledWith(someError);
  });

  test('should call finally block', async () => {
    const someError = new Error('some error');
    const asyncCall = () => Promise.reject(someError);
    const finallyBlock = jest.fn();
    const catchBlock = jest.fn();
    new AsyncAbort(asyncCall, [])
      .catch(catchBlock)
      .finally(finallyBlock)
      .call();
    await flushPromises();
    expect(catchBlock).toBeCalledWith(someError);
  });

  test('should not call then, catch, finally blocks if cancelled', async () => {
    const finallyBlock = jest.fn();
    const catchBlock = jest.fn();
    const thenBlock = jest.fn();
    const cancel = new AsyncAbort(setTimeoutPromiseResolve, [2000])
      .then(thenBlock)
      .catch(catchBlock)
      .finally(finallyBlock)
      .call();

    cancel();
    await flushPromises();
    expect(thenBlock).not.toBeCalled();
    expect(catchBlock).not.toBeCalled();
    expect(finallyBlock).not.toBeCalled();
  });
});
