import { nanoid } from "nanoid";

interface CallbackData {
  value: any,
  id: number,
}
interface Chain {
  type: any,
  block: Callback,
}

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
        if (this.listeners.has(id)) {
            return this.listeners.get(id)?.(event);
        }
    }
}

const PromiseObserver = new SimpleSingleCallbackObserver();

class AsyncAbort {
  id: string;
  asyncFun: AsyncFunction|undefined;
  asyncFunParams: Array<any>;
  chains: Array<Chain>;

  constructor(asyncFun: AsyncFunction, params: Array<any> = []) {
    this.id = nanoid(7);
    this.asyncFun = asyncFun;
    this.asyncFunParams = params;
  }

  then(callback: Callback): AsyncAbort {
    this.chains.push({ type: 'then', block: callback})
    return this;
  }

  catch(callback: Callback): AsyncAbort {
    this.chains.push({ type: 'catch', block: callback})
    return this;
  }

  finally(callback: Callback): AsyncAbort {
    this.chains.push({ type: 'finally', block: callback})
    return this;
  }

  private clearReferences() {
    this.asyncFun = undefined;
    this.asyncFunParams = undefined;
    this.chains = undefined;
  }

  call(): Callback {
    if (!this.asyncFun) return;
    
    this.chains.push({ type: 'finally', block: () => {
      PromiseObserver.remove(this.id);
    }})


    const callback = (data: CallbackData) => {
      const { id, value } = data;
      return this.chains[id].block(value);
    };

    PromiseObserver.add(this.id, callback);

    const cancel = () => {
      PromiseObserver.remove(this.id);
      this.clearReferences();
    };

    let promise = this.asyncFun(...this.asyncFunParams);
    this.chains.forEach(({ type }, index) => {
      switch (type) {
        case 'then':
          promise = promise.then((value) => {
            return PromiseObserver.emit(this.id, { id: index, value: value});
          });
        case 'catch':
          promise = promise.catch((error) => {
            return PromiseObserver.emit(this.id, { id: index, value: error});
          });
        case 'finally':
          promise = promise.finally(() => {
            return PromiseObserver.emit(this.id, { id: index });
          });
      }
    });
    return cancel;
  }
}
export default AsyncAbort;