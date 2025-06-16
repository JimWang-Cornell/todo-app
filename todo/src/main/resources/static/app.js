//// section 1: collection action treatment
// reload everytime visits websiet
document.addEventListener("DOMContentLoaded", async function() {

  const appState = {
     lastSelectedCollection: null}

  // collection element initialization

  const addCollectionButton = document.getElementById("addCollectionButton");
  const collectionInput = document.getElementById("collectionInput");
  const collectionList = document.getElementById("collectionList");

  // task element initialization
  const taskInput = document.getElementById("taskInput");
  const addTaskButton = document.getElementById("addTaskButton");
  const taskList = document.getElementById("taskList");

  // load the tasks in database
  loadTasks(taskList);
  // load the collections in database
  await loadCollections(appState);


  // now it's task addition
  addTaskButton.addEventListener("click", async function(){

    // input handling
    const taskContent = taskInput.value.trim();
    if (!appState.lastSelectedCollection) {
      alert("Please Select A Collection Before Adding A Task.");
      return;
    }
    if (taskContent === ""){
      alert("Task Content Cannot Be Empty!");
      return;
    }
    if (!isValidTaskContent(taskContent)){
      alert("Invalid Syntax!");
      return;
    }
    const taskItem = document.createElement("li");
    await addTaskBackend(taskItem, taskContent, appState.lastSelectedCollection.id);
    constructTaskItem(taskItem, false);
    taskList.prepend(taskItem);
    taskInput.value = "";
  });

  //event listener for collection add button
  addCollectionButton.addEventListener("click", async function(){
    // collection content handeling
    const collectionName = collectionInput.value.trim();
    if (collectionName === ""){
      alert("Collection Name Cannot Be Empty!");
      return;
    }
    if (!isValidCollectionName(collectionName)){
      alert("Invalid Syntax!");
      return;
    }
    // add collectionItem
    const collectionItem = document.createElement("li")
    // backend!
    await addCollectionBackend(collectionName, collectionItem);
    constructCollectionItem(appState, collectionItem);
    collectionInput.value = "";
  });


// });
  // global listener
  document.addEventListener("keypress", async function(event){
    const activeElement = document.activeElement;
    try{
      if (event.key === "Enter"){
        if (activeElement === collectionInput){
          event.preventDefault();
          await addCollectionButton.click();
        }
        else if (activeElement === taskInput){
          await addTaskButton.click();
        }
        else {alert("Please press an input box to" +
          " generate a new task/collection."
        );}
      }
    } catch (e){
      console.log(e.message);//error
    }
  });
  console.log("Program initiated!");
});

 /**
  * called in the very start of the program. it load all of the previously
  * stored collections, and their tasks are not automatically loaded.
  */
function loadCollections(appState) {
  // unselection done in backend
  fetch('/unselectAllCollections')
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server responded with status ${response.status}: ${text}`);
      }
    })
    .catch(error => {
      console.error("Error unselecting collection:", error); // error
    });
  // frontend treatment for each collection
  fetch('/getAllCollections')
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Server responded with status ${response.status}: ${text}`);
        });
      }
      return response.json();
    })
    .then(collections => {
      collections.forEach(collection => {
          // create the list element
          const collectionItem = document.createElement("li");
          collectionItem.id = collection.id;
          collectionItem.collection = collection;
          constructCollectionItem(appState, collectionItem);
      });
    })
    .catch(error => {console.error(error)}); // error
    console.log("All collections loaded!"); // note
}



/**
 * load all tasks, initialized with "minimized" toggled.
 */
async function loadTasks(taskList){
  const response = await fetch("/getAllTasks");
  const iter = await response.json();
  iter.forEach(async function(task){
    // create taskItem
    const taskContent = task.content;
    const taskItem = document.createElement("li");
    taskItem.id = task.id;
    taskItem.content = task.content;
    await constructTaskItem(taskItem, true);

    if (task.completed){
      taskItem.classList.add("completed");
      taskItem.querySelector(".taskCheckbox").checked = true;
      taskList.appendChild(taskItem);
    } else {
      taskList.prepend(taskItem);
    }
  });

}

// helper function section
/**
 * This helper construct the inner elements and listeners for a new
 * collectionItem.It does the following:
 * 1. create the innerHTML
 * 2. add the listener for itself, triggering selection
 * 3. add the listener for deletebutton, triggering deletion.
 * 4. append the collectionItem to the collectionList
 */
function constructCollectionItem(appState, collectionItem){
    collectionItem.innerHTML = `${collectionItem.collection.name} <button class="deleteCollectionButton">Delete</button>`;

    collectionItem.addEventListener("click", async function() {
      if (appState.lastSelectedCollection) {
        const lastCollectionItem = await document.getElementById(appState.lastSelectedCollection.id);
        lastCollectionItem.classList.toggle("selected");
      } else {
        console.log("No selected collection in appState"); // note
      }
      collectionItem.classList.toggle("selected");
      await selectCollectionBackend(appState, collectionItem.collection.id);
      console.log("Construction complete!")// temp
    });

    const deleteButton = collectionItem.querySelector(".deleteCollectionButton");
    deleteButton.addEventListener("click", function(event) {
      event.stopPropagation();
      // confirm deletion of collection
      const isConfirmed = confirm("Are you sure you want to delete this collection?" +
      " All tasks in the collection would be lost, and this action cannot be "+
      "withdrawn.");
      if (!isConfirmed) {
        console.log("User withdraws the deletion of collection."); // note
        return;}
      console.log("User confirmed deletion."); // note
      deleteCollectionBackend(appState, collectionItem.collection.id);
      collectionItem.remove();
    });
    // append to visualize
    collectionList.appendChild(collectionItem);
}
/**
 * this helper does the following:
 * 1. add taskItem as class of taskItem.
 * 2. add innerHTML element
 * 3. if bool is true, taskItem is minimized
 * 4. add deleteTaskButton and its listener
 * 5. add Checkbox and its listener
 * require taskItem to be initialized with .id and .content
 */
async function constructTaskItem(taskItem, bool){
  const taskId = taskItem.id;
  taskItem.classList.add("taskItem");
  // taskItem created here
  taskItem.innerHTML = `
    <label>
      <input type="checkbox" class="taskCheckbox" taskId="${taskId}">
      <span class="taskLabel" taskId="${taskId}">${taskItem.content}</span>
      <button class="deleteTaskButton">Delete</button>
    </label>`;
  // minimize
  if (bool){
    taskItem.classList.add("minimized");
  }
  const deleteTaskButton = await taskItem.querySelector(".deleteTaskButton");
  const taskCheckBox = await taskItem.querySelector(".taskCheckbox");
  // checkbox function actualization

  taskCheckBox.addEventListener("click", async function(event) {
    event.stopPropagation();
    console.log("Checkbox clicked! Current state:", taskCheckBox.checked); // note

    try {
      const updatedTask = await completeTaskBackend(taskId);
      // console.log(updatedTask); // temp
      const taskItem = document.getElementById(taskId);

      if (taskItem) {
        taskItem.classList.toggle("completed", updatedTask.completed);
        console.log("Updated task completed status:", updatedTask.completed); // note
        if (updatedTask.completed){
          await taskItem.remove();
          taskList.appendChild(taskItem);
          console.log("Task item moved to the bottom!");
        }
      }
      } catch (error) {
        console.error("Failed to update task:", error); // error
      }

  });
  // delete task function actualization

  deleteTaskButton.addEventListener("click", async function(event){
    event.stopPropagation();
    console.log("Task delete button clicked!"); // note
    // easier.
    await deleteTaskBackend(taskId);
    taskItem.remove();
  });
}
 /**
  * this helper does the following:
  * 1. add the NEWLY CREATED collection to mysql
  * 2. assign collectionItem attributes:
  *     a. collectionItem.id
  *     b. collectionItem.collection
  */
async function addCollectionBackend(collectionName, collectionItem){
  if (!isValidCollectionName(collectionName)) {
    return;
  }
  return await fetch('/addNewCollection?collectionName=' + encodeURIComponent(collectionName).trim(), {
    method: "POST",
    headers: {'Content-Type': 'application/json'}
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(text => {
        throw new Error(`Server responded with status ${response.status}`);
      });
    }
    return response.json();
  })
  .then(collection => {
    console.log("Collection Added!"); // note
    collectionItem.id = String(collection.id);
    collectionItem.collection = collection;
  })
  .catch(error => {console.error(error)}); // error
}


/**
 * it delete the collection in mysql. it need the lastSelectedCollection from
 * appState to make sure that if that collection is deleted, lastSelectedCollection
 * goes back to null. It deletes by ID.
 */
function deleteCollectionBackend(appState, id){
  fetch('/deleteCollection?id=' + id, {
    method: "DELETE",
    headers: {'Content-Type': 'application/json'}
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(text => {
        throw new Error(`Server responded with status ${response.status}: ${text}`);
      });
    }
    return response.json();
  })
  .then(collection => {
    const tasks = collection.stored;
    tasks.forEach(function(task){
      document.getElementById(task.id).remove();
    })
    console.log("Collection with name '" + collection.name + "' has been deleted!"); // note
  })
  .then(
    () => {appState.lastSelectedCollection = null;}
  )
  .catch(error => {console.error(error);}); // error
}

/**
 * select the collection in the backend. need to modify lastSelectedCollection.
 * identify collection by id. It should be accompanied with frontend actions
 * like refreshing the taskList with the new collection's tasks.
 * so by the way, it's not completely backend cuz it has repaint function
 */
async function selectCollectionBackend(appState, id){
  await fetch('/selectCollection?id=' + id, {
    method: "PATCH",
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(text => {
        throw new Error(`Server responded with status ${response.status}`);
      });
    }
    return response.json();
  })
  .then(async (collection) => {


    // this paints the newly selected collection's taskList
    repaintSelectedCollection(appState, collection.id);

    // select the current collection in variable
    appState.lastSelectedCollection = collection;
    return collection;
  })
  .then(collection =>
    {console.log(`Collection with name '${collection.name}' has `+
      `been ${collection.selected ? 'selected!' : 'unselected!'}`); // note
})
  .catch(error => {console.error(error)});//error
}


// simple
function isValidCollectionName(name) {
  if (!name || name.trim() === "") {
    alert("Collection Name Cannot Be Empty!");
    return false;
  }

  if (name.length > 50) {
    alert("Collection Name Cannot Exceed 50 Characters");
    return false;
  }

  if (/</.test(name) || />/.test(name)) {
    alert("Invalid Character Detected");
    return false;
  }

  return true;
}

/**
 * repaint all tasks that are from a specific collectionId. it firstly
 * clears taskList. then it checks the given collection's associated tasks
 * and add them all to the list. require lastSelectedCollection to avoid
 * repeated clicks on the same collection.
 */
function repaintSelectedCollection(appState, collectionId){
   console.log("Repainting collection with ID:", collectionId);
  // check if it's repeated click on same collection
  if (appState.lastSelectedCollection != null){
    if (collectionId === appState.lastSelectedCollection.id){
      // console.log("Same collection clicked again, skipping repaint."); //temp
      return;
    }
  }
  // minimize all original
  const taskItemList = document.querySelectorAll("#taskList .taskItem");
  taskItemList.forEach(taskItem => {
    taskItem.classList.add("minimized");
  })
  // getting all tasks
  fetch('/getAllTasksInCollection?collectionId=' + collectionId, {
    method: "GET",
    headers: {'Content-Type': 'application/json'}
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(json => {
        throw new Error(`Server responded with status ${response.status}`);
      });
    }
    return response.json();
  })
  .then(iter => {
    if (iter != null){
      iter.forEach(function(task){
        const taskItem = document.getElementById(task.id);
        // if (!taskItem){console.warn("Task item not found!");} // temp
        taskItem.classList.remove("minimized");
      });
    }
  })
  .catch(error => {console.error(error)}); // error
}


/**
 * add the task in the backend.
 * also assign taskItem.id = task.id
 */
 async function addTaskBackend(taskItem, taskContent, collectionId){
   if (!isValidTaskContent(taskContent)) {
     return;
   }

   try {
     const response = await fetch(`/addNewTask?taskContent=${encodeURIComponent(taskContent).trim()}&collectionId=${encodeURIComponent(collectionId)}`, {
       method: "POST",
       headers: {'Content-Type': 'application/json'}
     });

     if (!response.ok) {
       throw new Error(`Server responded with status ${response.status}`);
     }

     const task = await response.json();

     console.log("Task Added!"); // note
     taskItem.id = task.id;
     taskItem.content = task.content;

   } catch (error) {
     console.error("Failed to add task:", error); // error
     throw error;
   }
 }


/**
 * delete the task in the backend. called both when deleting task individually
 * and when deleting collection
 */
function deleteTaskBackend(id){
  fetch('/deleteTask?id=' + id,{
    method: "DELETE",
    headers: {"Content-Type": "application/json"}
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`Server responded with status ${response.status}: ${text}`)
      });
    }
    return response.text();
  })
  .then(data => {console.log(data)}) // note
  .catch(error => {console.error(error)}); // error
}

/**
 * complete the task in the backend mysql. simple call.
 */
 async function completeTaskBackend(id){
   try {
     const response = await fetch(`/completeTask?id=${id}`, {
       method: "PATCH",
       headers: {
         "Content-Type": "application/json"
       }
     });

     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(`Server responded with status ${response.status}`);
     }

     const updatedTask = await response.json();
     return updatedTask;

   } catch (error) {
     console.error("Error completing task:", error); // error
     throw error;
   }
 }



// simple
function isValidTaskContent(content) {
  if (!content || content.trim() === "") {
    alert("Task Content Cannot Be Empty!");
    return false;
  }

  if (content.length > 255) {
    alert("Task Content Cannot Exceed 255 Characters!");
    return false;
  }

  if (/</.test(content) || />/.test(content)) {
    alert("Invalid Character Detected");
    return false;
  }

  return true;
}
