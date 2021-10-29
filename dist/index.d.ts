declare type Callback = (...args: any[]) => any;
declare type AsyncFunction = (...args: any[]) => Promise<any>;
declare class AsyncAbort {
    id: string;
    asyncFun: AsyncFunction | undefined;
    asyncFunParams: Array<any>;
    thenBlock: Callback | undefined;
    catchBlock: Callback | undefined;
    finallyBlock: Callback | undefined;
    constructor(asyncFun: AsyncFunction, params?: Array<any>);
    then(callback: Callback): AsyncAbort;
    catch(callback: Callback): AsyncAbort;
    finally(callback: Callback): AsyncAbort;
    call(): Callback;
}
export default AsyncAbort;
