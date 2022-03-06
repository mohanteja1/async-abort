type Callback = (...args: any[]) => any;
type AsyncFunction = (...args: any[]) => Promise<any>;
type BlockType = 'then' | 'catch' | 'finally';
type Block = { type: BlockType, cb: Callback };

class Observer {
    cbs: Map<string, Callback>;
    count: number;
    constructor() {
        this.cbs = new Map();
        this.count = 0;
    }

    add(id: string, cbs: Array<Block>) {
      const combined = ({ index, value } : { value: any, index: number }) => cbs[index].cb(value);
      if(!this.cbs.has(id)) this.cbs.set(id, combined);
    }

    remove(id: string) {
      this.cbs.delete(id);
    }

    emit(id: string, event: any) {
      return this.cbs.get(id)?.(event);
    }

    createCancel(id: string) {
      return () => this.remove(id);
    }
}

const PromiseObserver = new Observer();

function extendPromise(id: string, promise: Promise<any>, chainTypes: Array<BlockType>) {
  chainTypes.forEach((type , index) => {
    switch (type) {
      case 'then':
        promise = promise.then((value) => PromiseObserver.emit(id, { index, value }));
        break;
      case 'catch':
        promise = promise.catch((error) => PromiseObserver.emit(id, { index, value: error }));
        break;
      case 'finally':
        promise = promise.finally(() => PromiseObserver.emit(id, { index }));
        break;
    }
  });
}

class AsyncAbort {
  private id: string;
  private func: AsyncFunction;
  private args: Array<any>;
  private chains: Array<Block>;

  constructor(func: AsyncFunction, args: Array<any> = []) {
    this.id = `${Date.now()}_${++PromiseObserver.count}`;
    this.func = func;
    this.args = args;
    this.chains = [];
  }

  then(cb: Callback): AsyncAbort {
    this.chains.push({ type: 'then', cb});
    return this;
  }

  catch(cb: Callback): AsyncAbort {
    this.chains.push({ type: 'catch', cb });
    return this;
  }

  finally(cb: Callback): AsyncAbort {
    this.chains.push({ type: 'finally', cb });
    return this;
  }

  call(): Callback {
    const id = this.id;
    this.chains.push({ type: 'finally', cb: PromiseObserver.createCancel(id)});
    PromiseObserver.add(id, [...this.chains]);
    const types = this.chains.map(({ type }) => type);
    const promise = this.func(...this.args);
    extendPromise(id, promise, types);
    this.chains = this.args = this.func = this.id = undefined;
    return PromiseObserver.createCancel(id);
  }
}

export default AsyncAbort;