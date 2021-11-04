# async-abort

[![npm version](https://img.shields.io/npm/v/async-abort.svg?style=flat-square)](https://www.npmjs.org/package/async-abort)
[![install size](https://packagephobia.now.sh/badge?p=async-abort)](https://packagephobia.now.sh/result?p=async-abort)
[![bundle size](https://badgen.net/bundlephobia/min/async-abort)](https://badgen.net/bundlephobia/min/async-abort)
[![npm downloads](https://img.shields.io/npm/dm/async-abort.svg?style=flat-square)](http://npm-stat.com/charts.html?package=async-abort)



A canceleable promise utility which helps solve memory leak in asynchronous code in a react components which cannot be solved using [AbortController]() or other hooks which uses similar type of cancelling mechanisms. 
AsyncAbort internally uses `dont care policy` for the promise cancellation ie.. it won't stop the promises from settling but it stops callbacks attached from being called. It does so by detaching the loosely attached callbacks from promise and preventing memory references of these callbacks from being held by promise call which can cause memory leak if not.

## Table of Contents

  - [Features](#features)
  - [Browser Support](#browser-support)
  - [Installing](#installing)
  - [Preventing Memory leaks in React Component](#preventing-memory-leaks-in-react-component)
  - [Other Examples](#other-examples)
  - [Resources](#resources)
  - [Credits](#credits)
  - [License](#license)

## Features

- Ability to prevent execution of actions (then, catch, finally blocks) that happen when a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) returned from async function settles.
- Useful in Preventing Memory leaks resulting in asynchronous code in React components
- works with any kind of promises (native or bluebord or any other polyfills)
## Browser Support

![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png) |
--- | --- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | 11 ✔ |

## Installing

Using npm:

```bash
$ npm install async-abort
```

Using yarn:

```bash
$ yarn add async-abort
```


## Preventing Memory leaks in React Component
A React Component that will leak: 
 ```javascript
   
   function ALeakyTodoComponent({ userId }) {
       const [todos, setTodos] = useState([]);
       const [failed, setFailed] = useState(false);

       useEffect(() => {
          // on mount 
          fetchTodosOfUser(userId)
            .then((resp) => {
              setTodos(resp.todos);
            })
            .catch((err) => {
              setFailed(true);
            });
       }, [userId]);

       return (<div>
         { failed && <FailedMsg/>}
         {todos.map((todo) => (
             <div>
                <h1>{todo.title}</h1>
                <p>{todo.description}</p>
             </div>
         ))}
       </div>)
   }
 ```

  Now what happens when the above component is mounted and umounted immediately
  1. the `fetchTodosOfUser` is called on mount and it holds the references
    to the `setTodos` and `setFailed` callbacks
  2. while the promise is still being settled the component will unmount, 
    in order for component to completely unmount and garbage collected, all the references must be cleared.
    but the promise holds the references of the setState callbacks untill it settles
  3. this will stop the component from garbage collected and leads to memory leak
  4. even if you use AbortController or some flags to 
  stop setting the state in your code, the references are still attached and it will not prevent the memory leak

Using AsyncAbort to prevent this leak: 

```javascript
  
  import AsyncAbort from 'async-abort';

  function ANonLeakyTodoComponent({ userId }) {
       const [todos, setTodos] = useState([]);
       const [failed, setFailed] = useState(false);
       useEffect(() => {
          // on mount 
         const cancel = new AsyncAbort(fetchTodosOfUser, [userId])
            .then((resp) => {
              setTodos(resp.todos);
            })
            .catch((err) => {
              setFailed(true);
            })
            .call();
        return () => {
           cancel();
        }
       }, [userId]);

       return (<div>
         { failed && <FailedMsg/>}
         {todos.map((todo) => (
             <div>
                <h1>{todo.title}</h1>
                <p>{todo.description}</p>
             </div>
         ))}
       </div>)
   }
```

  Now what happens when the above component is mounted and umounted immediately
  1. the `fetchTodosOfUser` is called on mount through AsyncAbort
  2. the component gets unmounted while the promise is still being settled  and 
      `cancel()` is called in cleanup method of hook this will remove the references
      of then,catch,finally callbacks which are attached to the `fetchTodoOfUser`
      **note** cancel won't stop promise from being settling
  3. after calling cancel() no more references of component are held, the component is garbage collected.
  4. thus no more memory leaks


## Other Examples

### note: CommonJS usage
To get TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with `require()` use the following approach:

```js
const AsyncAbort = require('async-abort').default;

// AsyncAbort.<method> will now provide autocomplete and parameter typings
```

Example for calling an `Async Function` or `Any Promise returning Function`

```js
import AsyncAbort from 'async-abort';

async function anAsyncFunc(arg1, arg2) {
    // does some operations
    // throws an error or returns a value
}

new AsyncAbort(anAsyncFunc, [arg1Value, arg2Value])
    .then((resp) => {
      // code when promise resolves
    }).catch((err) => {
      // code when promise rejects
    }).finally(() => {
      // similar to finally block 
    }).call();

function somePromiseReturningFunc(arg1, arg2) {
  // returns a promise
  return new Promise((resolve, reject) => {
      // either rejects or resolves
  });
}

new AsyncAbort(somePromiseReturningFunc, [arg1Value, arg2Value])
    .then((resp) => {
      // code when promise resolves
    }).catch((err) => {
      // code when promise rejects
    }).finally(() => {
      // similar to finally block 
    }).call();

```
Action Blocks can be omitted

```js
 // then and finally are omitted
 new AsyncAbort(somePromiseReturningFunc, [arg1Value, arg2Value])
    .catch((err) => {
        ...
    }).call();

 // finally is omitted
 new AsyncAbort(somePromiseReturningFunc, [arg1Value, arg2Value])
    .then((val) => {
        ...
    }).catch((resp) => {
        ...
    }).call();

```
**note** : `.call()` is necessary to call the async function that is passed

Cancelling execution of Action blocks

```js

const cancel = new AsyncAbort(somePromiseReturningFunc, [arg1Value, arg2Value])
    .then((val) => {
        ...
    }).catch((resp) => {
        ...
    }).call();
 
 // to prevent execution of Action blocks (then, catch, finally)
 cancel();
```

## Resources

* [Changelog](https://github.com/mohanteja1/async-abort/blob/master/CHANGELOG.md)


## Credits
  - to setup the environment for building this npm package I used code from this [repo](https://github.com/GeorgianStan/framework-for-building-libraries)
  - used readme file from [axios](https://github.com/axios/axios) project as a template for this readme file
## License

[MIT](./LICENSE)
