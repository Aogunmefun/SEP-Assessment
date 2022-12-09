const APIs = (() => {
    console.log("running")
    const URL = "http://localhost:3000/todos";

    const addTodo = (newTodos) => {
       
        return fetch(URL, {
            method: "POST",
            body: JSON.stringify(newTodos),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            return res.json();
        })
    }


    const deleteTodo = (id) => {
        return fetch(`${URL}/${id}`, {
            method: "DELETE"
        }).then((res) => {
            return res.json();
        })
    };

    const patchTodo = (id, key, value) => {
        return fetch(`${URL}/${id}`, {
            method: "PATCH",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                [key]:value
            })
        }).then((res)=>{return res.json()})
    }

    const getTodos = () => {
        return fetch(`${URL}`).then((res) => {
            return res.json();
        })
    }

    return {
        getTodos,
        deleteTodo,
        patchTodo,
        addTodo
    }
})()




/* 
    closure, IIFE
    event bubbling, event capturing
    json server
*/
const Model = (() => {
    class State {
        #todos;
        #onChangeCb;
        constructor() {
            this.#todos = [];
            this.#onChangeCb = () => { }
        }
        get todos() {
            return this.#todos
        }
        set todos(newTodos) {
            this.#todos = newTodos
            // console.log("State Changed", newTodos)
            this.#onChangeCb();
        }

        subscirbe = (cb) => {
            this.#onChangeCb = cb;
        }
    }
    return {
        State
    }

})();

/* 
    [
        {content:"work",id:1},
        {content:"eat",id:2}
    ]
*/

const View = (() => {
    const formEl = document.querySelector(".todo__form");
    const todoListEl = document.querySelector(".todo__list");
    const finishedTaskListEl = document.querySelector(".finished__list")

    const renderTodolist = (todos) => {
        // console.log(todos)
        let todotemplate = "";
        let finishedTasktemplate ="";
        todos.sort((a,b)=>b.id-a.id).forEach((todo) => {
            if (todo.state === "done") { // condition to check whether the Task is complete or not
                finishedTasktemplate += `
            <li id="${todo.id}" class="li-taskComplete"><span id="${todo.id}"><s>${todo.content}</s></span><button class="btn--delete" id="${todo.id}"></button></li>
            `
            }
            else {
                if (todo.edit === "true") {
                    todotemplate += `
            <li id="${todo.id}"><input class="input--todo" id="${todo.id}" placeholder="${todo.content}"  value="${todo.content}"></input><button class="btn--edit" id="${todo.id}"></button><button class="btn--delete" id="${todo.id}"></button></li>
            `
                }
                else {
                    todotemplate += `
            <li id="${todo.id}"><span id="${todo.id}">${todo.content}</span><button class="btn--edit" id="${todo.id}"></button><button class="btn--delete" id="${todo.id}"></button></li>
            `
                }
                
            }
        })
        todoListEl.innerHTML = todotemplate;
        finishedTaskListEl.innerHTML = finishedTasktemplate;
        
    }
    return {
        formEl,
        renderTodolist,
        todoListEl,
        finishedTaskListEl
    }
})();



const ViewModel = ((Model, View) => {
    const state = new Model.State();

    const addTodo = () => {
        View.formEl.addEventListener("submit", (event) => {
            event.preventDefault();
            const content = event.target[0].value;
            // console.log("content", content)
            // console.log(event.target)
            if(content.trim() === "") return;
            const newTodo = { content, state:"pending", edit:"false"  }
            APIs.addTodo(newTodo).then(res => {
                // console.log("Res", res);
                state.todos = [res, ...state.todos];//anti-pattern
                event.target[0].value = ""
            })

        })
    }

    const deleteTodo = () => {
        View.todoListEl.addEventListener("click", (event) => {
            // console.log(event.currentTarget, event.target)
            const { id } = event.target
            if (event.target.className === "btn--delete") {
                APIs.deleteTodo(id).then(res => {
                    // console.log("Res", res);
                    state.todos = state.todos.filter((todo) => {
                        return +todo.id !== +id
                    });
                });
            }
        })
        View.finishedTaskListEl.addEventListener("click", (event) => {
            // console.log(event.currentTarget, event.target)
            const { id } = event.target
            if (event.target.className === "btn--delete") {
                APIs.deleteTodo(id).then(res => {
                    console.log("Res", res);
                    state.todos = state.todos.filter((todo) => {
                        return +todo.id !== +id
                    });
                });
            }
        })
    }

    const markdone = () => {
        View.todoListEl.addEventListener("click", (e)=>{
            
            const id = e.target.id
            
            if ((e.target.className != "btn--edit") && (e.target.className != "btn--delete") && (e.target.className != "input--todo")) {   
                console.log("class name", e.target.className)
                APIs.patchTodo(id, "state", "done").then((res)=>{
                    // console.log("res", res)
                    state.todos = state.todos.map(task => {
                        if (+task.id === +id) {
                            console.log(res)
                            // return task = {...task, state:"done"}
                            return task = res
                        }
                        else {
                            return task
                        }
                    })
                    // console.log(state.todos)
                })   
                
            }
        })
    }

    const editTodo = () => {
        View.todoListEl.addEventListener("click", (e)=>{
            const id = e.target.id
            
            if (e.target.className === "btn--edit") {
                const task = state.todos.filter((todo)=>{
                    return +todo.id === +id
                })
                // console.log("task", task[0])
                if (task[0].edit === "false") {
                    // console.log("here")
                    APIs.patchTodo(task[0].id, "edit", "true").then((res)=>{
                        state.todos = state.todos.map(task => {
                            if (+task.id === +id) {
                                // console.log(task)
                                return task = res
                            }
                            else {
                                return task
                            }
                        })
                        // console.log("state", state.todos)
                    })
                }
                else {
                    // console.log("value", e.currentTarget.querySelector("input").value)
                    APIs.patchTodo(task[0].id, "content", e.currentTarget.querySelector("input").value)
                    .then((res)=>{
                        // console.log("response", res)
                        state.todos = state.todos.map(task => {
                            if (+task.id === +id) {
                                // console.log(task)
                                return task = res
                            }
                            else {
                                return task
                            }
                        })
                        // console.log("state", state.todos)
                    })
                    APIs.patchTodo(task[0].id, "edit", "false")
                    .then((res)=>{
                        state.todos = state.todos.map(task => {
                            if (+task.id === +id) {
                                // console.log(task)
                                return task = res
                            }
                            else {
                                return task
                            }
                        })
                    })
                }
                
            }
        })
    }

    const getTodos = ()=>{
        APIs.getTodos().then(res=>{
            
            state.todos = res;
        })
    }

    const bootstrap = () => {
        addTodo();
        deleteTodo();
        markdone()
        editTodo()
        getTodos();
        state.subscirbe(() => {
            View.renderTodolist(state.todos)
        });
    }
    return {
        bootstrap
    }
})(Model, View);

ViewModel.bootstrap();


