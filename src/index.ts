type Callback = (...args: any[]) => any;
type AsyncFunction = (...args: any[]) => Promise<any>;

class Observer {
    cbs: Map<string, Callback>;
    count: number;
    constructor() {
        this.cbs = new Map();
        this.count = 0;
    }

    add(id: string, cb: Callback) {
      if(!this.cbs.has(id)) this.cbs.set(id, cb);
    }

    remove(id: string) {
      this.cbs.delete(id);
    }

    emit(id: string, event: any) {
      return this.cbs.get(id)?.(event);
    }
}

const PromiseObserver = new Observer();
class AsyncAbort {
  private id: string;
  private func: AsyncFunction;
  private args: Array<any>;
  private chain: Array<{ type: 'then' | 'catch' | 'finally', cb: Callback }>;

  constructor(func: AsyncFunction, args: Array<any> = []) {
    this.id = `${Date.now()}_${++PromiseObserver.count}`;
    this.func = func;
    this.args = args;
    this.chain = [];
  }

  then(cb: Callback): AsyncAbort {
    this.chain.push({ type: 'then', cb});
    return this;
  }

  catch(cb: Callback): AsyncAbort {
    this.chain.push({ type: 'catch', cb });
    return this;
  }

  finally(cb: Callback): AsyncAbort {
    this.chain.push({ type: 'finally', cb });
    return this;
  }

  call(): Callback {
    this.chain.push({ type: 'finally', cb: () => PromiseObserver.remove(this.id)});
    PromiseObserver.add(this.id, ({ index, value } : { value: any, index: number }) => this.chain[index].cb(value));
    const id = this.id;
    let promise = this.func(...this.args);
    this.chain.forEach(({ type }, index) => {
      switch (type) {
        case 'then':
          promise = promise.then((value) => PromiseObserver.emit(this.id, { index, value }));
          break;
        case 'catch':
          promise = promise.catch((error) => PromiseObserver.emit(this.id, { index, value: error }));
          break;
        case 'finally':
          promise = promise.finally(() => PromiseObserver.emit(this.id, { index }));
          break;
      }
    });
    return () => PromiseObserver.remove(id);
  }
}

export default AsyncAbort;