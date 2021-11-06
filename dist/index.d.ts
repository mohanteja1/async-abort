declare type Callback = (...args: any[]) => any;
declare type AsyncFunction = (...args: any[]) => Promise<any>;
declare class AsyncAbort {
    id: string;
    asyncFun: AsyncFunction;
    asyncFunParams: Array<any>;
    chain: Array<{
        type: 'then' | 'catch' | 'finally';
        callback: Callback;
    }>;
    constructor(asyncFun: AsyncFunction, params?: Array<any>);
    then(callback: Callback): AsyncAbort;
    catch(callback: Callback): AsyncAbort;
    finally(callback: Callback): AsyncAbort;
    private clearReferences;
    call(): Callback;
}
export default AsyncAbort;
