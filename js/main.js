(function() {
  'use strict';

  const STORAGE_KEY = 'fjord-vue-memo-1'
  const todoStorage = {
    fetch() {
      let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      todos.forEach((todo, index) => {
        todo.id = index
      });
      Storage.uid = todos.length;
      return todos
    },
    save(todos) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    }
  };

  const filters = {
    all(todos) {
      return todos;
    },
    active(todos) {
      return todos.filter((todo) =>
        !todo.done
      );
    },
    completed(todos) {
      return todos.filter((todo) =>
        todo.done
      );
    }
  };

  const app = {
    el: '#app',
    data() {
      return {
        todos: todoStorage.fetch(),
        newTodo: '',
        done: false,
        visibility: 'all',
        editedTodo: null,
        beforeEditCache: '',
        debug: null
      }
    },
    mounted() {
      if(localStorage.getItem(STORAGE_KEY)) {
        try {
          this.todos = JSON.parse(localStorage.getItem(STORAGE_KEY))
        } catch(e) {
          localStorage.removeTodo(STORAGE_KEY)
        }
      }
      window.addEventListener('hashchange', this.onHashChange);
      this.onHashChange();
    },
    computed: {
      remaining() {
        const count = this.todos.reduce((count, todo) => count = (todo.done) ? count : ++count, 0);
        return count
      },
      filteredTodos() {
        return filters[this.visibility](this.todos);
      }
    },
    methods: {
      archive() {
        this.todos = this.todos.filter((todo) => !todo.done)
        this.saveTodos();
      },
      addTodo(newTodo) {
        this.todos.push({
          id: todoStorage.uid++,
          title: newTodo,
          done: false
        })
        todoStorage.save(this.todos)
      },
      removeTodo(todo) {
        this.todos = this.todos.filter((_todo) => _todo !== todo);
        this.saveTodos();
      },
      editTodo(todo) {
        this.beforeEditCache = todo.title;
        this.editedTodo = todo;
      },
      doneEdit(todo) {
        if(!this.editedTodo) return;
        this.editedTodo = null;
        const title = todo.title.trim(); 
        if (title) {
          todo.title = title;
          todoStorage.save(this.todos)
        } else {
          this.removeTodo(todo);
        }
      },
      cancelEdit(todo) {
        this.editedTodo = null;
        todo.title = this.beforeEditCache;
      },
      saveTodos() {
        let parsed = JSON.stringify(this.todos);
        localStorage.setItem(STORAGE_KEY, parsed);
      },
      onHashChange() {
        const visibility = window.location.hash.replace(/#\/?/, '');
        if (filters[visibility]) {
          this.visibility = visibility;
        } else {
          window.location.hash = '';
          this.visibility = 'all';
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const vueApp = Vue.createApp(app)
    vueApp.mount('#app')
    vueApp.directive('todo-focus', (el, binding) => {
      console.log(binding.value)
      // if (binding.value) {
      //   el.focus();
      // }
    })
    vueApp.component('list-header', {
      props: ['todos', 'remaining'],
      methods: {
        archive() {
          this.$emit('archive');
        }
      },
      template: `
        <p>
          全{{todos.length}}件中残り{{remaining}}件
          <button @click="archive" class="btn btn-danger btn-sm">削除</button>
        </p>`
    })
    vueApp.component('list-footer', {
      props: {
        visibility: {
          type: String,
          required: true
        }
      },
      template: `
      <a href="#/all" :class="['btn btn-outline-info btn-sm btn-footer', {active: visibility === 'all'}]">All</a>
      <a href="#/active" :class="['btn btn-outline-info btn-sm btn-footer', {active: visibility === 'active'}]">Active</a>
      <a href="#/completed" :class="['btn btn-outline-info btn-sm btn-footer', {active: visibility === 'completed'}]">Completed</a>`
    })

    vueApp.component('add-todo', {
      data() {
        return {
          todoText: ''
        };
      },
      methods: {
        addTodo() {
          const newTodo = this.todoText.trim();
          this.todoText = '';
          if (!newTodo) {return;}
          this.$emit('add-todo', newTodo);
        }
      },
      template: `
      <p>
        <input type="text" v-model="todoText" @keypress.enter="addTodo" placeholder="add a todo here" class="input-todo">
        <button @click="addTodo" class="btn btn-primary btn-sm">追加</button>
      </p>`
    })
    vueApp.component('todo-list', {
      props: ['filteredTodos', 'editedTodo'],
      methods: {
        editTodo: function(todo) {
          this.$emit('edit-todo', todo);
        },
        removeTodo(todo) {
          this.$emit('remove-todo', todo);
        },
        doneEdit: function(todo) {
          this.$emit('done-edit', todo);
        },
        cancelEdit: function(todo) {
          this.$emit('cancel-edit', todo);
        }
      },
      template: `
      <ul class="todo-list">
        <li v-for="todo in filteredTodos" :class="{completed: todo.completed, editing: todo == editedTodo}">
          <todo-item :todo="todo" @remove-todo="removeTodo" @edit-todo="editTodo" @done-edit="doneEdit" @cancel-edit="cancelEdit"></todo-item>
        </li>
      </ul>`
    })
    vueApp.component('todo-item', {
      props: ['todo'],
      methods: {
        editTodo: function(todo) {
          this.$emit('edit-todo', todo);
        },
        removeTodo: function(todo) {
          this.$emit('remove-todo', todo);
        },
        doneEdit: function(todo) {
          this.$emit('done-edit', todo);
        },
        cancelEdit: function(todo) {
          this.$emit('cancel-edit', todo);
        }
      },
      template: `
      <div>
        <div class="view">
          <input type="checkbox" v-model="todo.done" class="toggle">
          <label @dblclick="editTodo(todo)" :class="{'done': todo.done}">{{todo.title}}</label>
          <button @click="removeTodo(todo)" class="btn btn-warning btn-sm destroy">削除</button>
        </div>
        <input class="edit" type="text"
                v-model="todo.title"
                v-todo-focus="todo == editedTodo"
                @keypress.enter="doneEdit(todo)"
                @keyup.esc="cancelEdit(todo)"
                @blur="doneEdit(todo)">
      </div>`
    })
  });
})();