declare type Callback = (...args: any[]) => any;
declare type AsyncFunction = (...args: any[]) => Promise<any>;
declare class AsyncAbort {
    id: string;
    private func;
    private args;
    private chain;
    constructor(func: AsyncFunction, args?: Array<any>);
    then(cb: Callback): AsyncAbort;
    catch(cb: Callback): AsyncAbort;
    finally(cb: Callback): AsyncAbort;
    private clearRefs;
    call(): Callback;
}
export default AsyncAbort;
