import { nanoid } from "nanoid";

interface CallbackData {
  type: string,
  value: any
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
            this.listeners.get(id)?.(event);
        }
    }
}

const PromiseObserver = new SimpleSingleCallbackObserver();

class AsyncAbort {
    id: string;
    asyncFun: AsyncFunction|undefined;
    asyncFunParams: Array<any>;
    thenBlock: Callback|undefined;
    catchBlock: Callback|undefined;
    finallyBlock: Callback|undefined;

    constructor(asyncFun: AsyncFunction, params: Array<any> = []) {
      this.id = nanoid(7);
      this.asyncFun = asyncFun;
      this.asyncFunParams = params;
    }
  
    then(callback: Callback): AsyncAbort {
      this.thenBlock = callback;
      return this;
    }
  
    catch(callback: Callback): AsyncAbort {
      this.catchBlock = callback;
      return this;
    }
  
    finally(callback: Callback): AsyncAbort {
      this.finallyBlock = callback;
      return this;
    }
  
    call(): Callback {
      if (!this.asyncFun) return;
      const callback = (data: CallbackData) => {
        const { type, value } = data;
        switch (type) {
          case "then":
            if (this.thenBlock) this.thenBlock(value);
            break;
          case "catch":
            if (this.catchBlock) this.catchBlock(value);
            break;
          case "finally":
            if (this.finallyBlock) this.finallyBlock(value);
            break;
          default:
        }
      };

      PromiseObserver.add(this.id, callback);
      const cancel = () => {
        PromiseObserver.remove(this.id);
      };
      this.asyncFun(...this.asyncFunParams)
        .then((resp: any) => {
          PromiseObserver.emit(this.id, { type: "then", value: resp });
        })
        .catch((error: any) => {
          PromiseObserver.emit(this.id, { type: "catch", value: error });
        })
        .finally(() => {
          PromiseObserver.emit(this.id, { type: "finally" });
          PromiseObserver.remove(this.id);
        });
      return cancel;
    }
}

export default AsyncAbort;