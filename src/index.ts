import { nanoid } from "nanoid";

type Callback = (...args: any[]) => any;
type AsyncFunction = (...args: any[]) => Promise<any>;

class SimpleSingleCallbackObserver {
    listeners: Map<string, Callback>;
    constructor() {
        this.listeners = new Map();
    }

    add(id: string, listener: Callback) {
      if(!this.listeners.has(id)) this.listeners.set(id, listener);
    }

    remove(id: string) {
      this.listeners.delete(id);
    }

    emit(id: string, event: any) {
      return this.listeners.get(id)?.(event);
    }
}

const PromiseObserver = new SimpleSingleCallbackObserver();

class AsyncAbort {
  id: string;
  asyncFun: AsyncFunction;
  asyncFunParams: Array<any>;
  chain: Array<{ type: 'then' | 'catch' | 'finally', callback: Callback }>;

  constructor(asyncFun: AsyncFunction, params: Array<any> = []) {
    this.id = nanoid(7);
    this.asyncFun = asyncFun;
    this.asyncFunParams = params;
    this.chain = [];
  }

  then(callback: Callback): AsyncAbort {
    this.chain.push({ type: 'then', callback});
    return this;
  }

  catch(callback: Callback): AsyncAbort {
    this.chain.push({ type: 'catch', callback});
    return this;
  }

  finally(callback: Callback): AsyncAbort {
    this.chain.push({ type: 'finally', callback});
    return this;
  }

  private clearReferences() {
    this.asyncFun = undefined;
    this.asyncFunParams = undefined;
    this.chain = undefined;
  }

  call(): Callback {
    this.chain.push({ type: 'finally', callback: () => PromiseObserver.remove(this.id)});
    PromiseObserver.add(this.id, ({ index, value } : { value: any, index: number }) => this.chain[index].callback(value));
    const cancel = () => {
      PromiseObserver.remove(this.id);
      this.clearReferences();
    };
    let promise = this.asyncFun(...this.asyncFunParams);
    this.chain.forEach(({ type }, index) => {
      switch (type) {
        case 'then':
          promise = promise.then((value) => PromiseObserver.emit(this.id, { index, value }));
        case 'catch':
          promise = promise.catch((error) => PromiseObserver.emit(this.id, { index, value: error }));
        case 'finally':
          promise = promise.finally(() => PromiseObserver.emit(this.id, { index }));
      }
    });
    return cancel;
  }
}
export default AsyncAbort;