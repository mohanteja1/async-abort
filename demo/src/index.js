import React from 'react';
import ReactDOM from 'react-dom';
import { combineReducers, createStore } from 'redux';
import AsyncAbort from '../../src/index.ts';
import { useSelector } from 'react-redux';
import { Provider } from 'react-redux';

/***************** */
// redux store
/***************** */
function componentReducer(state = { selected: 'none' }, action) {
    switch(action.type) {
      case 'SELECT' :
        return { selected: action.payload }
      default: 
       return state;
    }
}

const rootReducer = combineReducers({
  Component: componentReducer,
});

const store = createStore(rootReducer);

/***************** */
// helpers and other
/***************** */

const Components = {
  FETCH: 'fetch',
  ABORT_CONTROLLER: 'abort-controller',
  ASYNC_ABORT: 'async-abort',
  NONE: 'none',
}

const timers = {
  timer1: null,
  timer2: null,
}

const setComponent = (id) => store.dispatch({ type: 'SELECT', payload: id});

function stopTogglingButtons() {
  clearInterval(timers.timer1);
  clearInterval(timers.timer2);
}

function toggleComponents(id1, id2) {
  timers.timer1 = setInterval(() => {
    setComponent(id1);
  }, 1000);
   setTimeout(() => {
     timers.timer2 = setInterval(() => {
      setComponent(id2);
      }, 1500)
    } , 500);
}

function fetchTodosOfUser(signal) {
  // return some todos with a 2 second delay
    return fetch('http://localhost:8000/todos', { signal }).then(response => response.json());
}

/***************** */
//  differnt components 
// with different solutions
/***************** */

class FetchComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      failed: false,
    }
  }
  componentDidMount() {
      console.log('calling');
      fetchTodosOfUser()
        .then((todos) => {
          this.setState({ todos })
        }).catch((err) => {
          this.setState({ failed: true });
        });
  }
  
  render () {
    const { failed, todos } = this.state;
    return (<div>
      <h1>{Components.FETCH}</h1>
      { failed && <div> unable to load </div>}
      {(todos.length === 0 && !failed) && <div> loading fetch component </div>}
      {todos.map((todo, index) => (
          <div key={index}>
             <h1>{todo.title}</h1>
             <p>{todo.description}</p>
          </div>
      ))}
    </div>)
  }
}

class AbortControllerComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      failed: false,
    }
    this.abortController = null;
  }

  componentDidMount() {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    fetchTodosOfUser(signal)
    .then((todos) => {
      this.setState({ todos })
    }).catch((err) => {
      console.log('abort controller: catch');
      this.setState({ failed: true });
    });
  }

  componentWillUnmount() {
    this.abortController?.abort();
    console.log('abort controller: unmounting');
  }
  
  render () {
    const { failed, todos } = this.state;
    return (<div>
      { failed && <div> unable to load </div>}
      {(todos.length === 0 && !failed) && <div> loading abort controller component </div>}
      {todos.map((todo, index) => (
          <div key={index}>
             <h1>{todo.title}</h1>
             <p>{todo.description}</p>
          </div>
      ))}
    </div>)
  }

}

class AsyncAbortComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      failed: false,
    }
    this.cancel = null;
  }
  componentDidMount() {
    this.cancel = new AsyncAbort(fetchTodosOfUser)
    .then((todos) => {
      this.setState({ todos })
    }).catch((err) => {
      this.setState({ failed: true });
    }).call();
  }

  componentWillUnmount(){
    this.cancel?.();
  }
  
  render () {
    const { failed, todos } = this.state;
    return (<div>
      { failed && <div> unable to load </div>}
      {(todos.length === 0 && !failed) && <div> loading async-abort component </div>}
      {todos.map((todo, index) => (
          <div key={index}>
             <h1>{todo.title}</h1>
             <p>{todo.description}</p>
          </div>
      ))}
    </div>)
  }
}


/***************** */
// App
/***************** */



function SideNav(props) {
  return (
    <aside className="nav" >
        <button
          id={Components.FETCH}
          className="nav-button"
          onClick={() => setComponent(Components.FETCH)}
        >
          fetch
        </button>
        
        <button
          id={Components.ABORT_CONTROLLER}
          className="nav-button"
          onClick={() => {setComponent(Components.ABORT_CONTROLLER)}}
        >
          abort controller
        </button>
        
        <button
          id={Components.ASYNC_ABORT}
          className="nav-button"
          onClick={() => {setComponent(Components.ASYNC_ABORT)}}
        >
          async-abort
        </button>
       
        <button
          id={Components.NONE}
          className="nav-button"
          onClick={() => {setComponent(Components.NONE)}}
        >
          unmount current loading component
        </button>
        <button
          className="nav-button"
          onClick={() => {toggleComponents(Components.FETCH, Components.NONE)}}
        >
          toggle fetch
        </button>
        <button
          className="nav-button"
          onClick={() => {toggleComponents(Components.ABORT_CONTROLLER, Components.NONE)}}
        >
          toggle abort controller
        </button>
        <button className="nav-button"
           onClick={() => {toggleComponents(Components.ASYNC_ABORT, Components.NONE)}}
        >
          toggle async abort
        </button>
        <button className="nav-button"
           onClick={stopTogglingButtons}>stop toggling</button>
      </aside>
  );
}

function ComponentSelected(props) {
  const selected = useSelector((state) => state.Component.selected);
  switch(selected) {
    case Components.FETCH:
       return <FetchComponent/>;
    case Components.ABORT_CONTROLLER:
      return <AbortControllerComponent/>;
    case Components.ASYNC_ABORT:
      return <AsyncAbortComponent/>;
    case Components.NONE:
    default: 
      return <div>none</div>
  }
}

function App() {  
  return (
    <Provider store={store}>
      <div className="App">
        <SideNav/>
        <section className="rsection" >
          <ComponentSelected/>
        </section>
      </div>
    </Provider>
  );
}


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);