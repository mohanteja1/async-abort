declare type Callback = (...args: any[]) => any;
declare type AsyncFunction = (...args: any[]) => Promise<any>;
declare class AsyncAbort {
    private id;
    private func;
    private args;
    private chains;
    constructor(func: AsyncFunction, args?: Array<any>);
    then(cb: Callback): AsyncAbort;
    catch(cb: Callback): AsyncAbort;
    finally(cb: Callback): AsyncAbort;
    call(): Callback;
}
export default AsyncAbort;
