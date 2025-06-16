package org.todo;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping(value="/")
@CrossOrigin(origins="*")
public class Controller {
    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CollectionRepository collectionRepository;


    /**
     * Below are methods for collection operations with requested mappings
     */
    @RequestMapping(value = "/addNewCollection", method = RequestMethod.POST)
    public @ResponseBody Collection addNewCollection(@RequestParam String collectionName) {
        return collectionRepository.save(new Collection(collectionName));
    }


    @RequestMapping(value="/deleteCollection", method = RequestMethod.DELETE)
    public @ResponseBody Collection deleteCollection(@RequestParam Long id){
        try{
            if (!collectionRepository.existsById(id)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found!");
            }
            Collection collection = collectionRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found!"));
            collectionRepository.deleteById(id);
            return collection;
        } catch (Exception e){
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }


    @RequestMapping(value="/selectCollection", method = RequestMethod.PATCH)
    public @ResponseBody Collection selectCollection(@RequestParam Long id){
        unselectAllCollections();
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found!"));
        collection.setSelected(true);
        collectionRepository.save(collection);
        return collection;
    }



    @RequestMapping(value="/getAllTasksInCollection", method = RequestMethod.GET)
    public @ResponseBody Iterable<Task> getAllTasksInCollection(@RequestParam Long collectionId){
        Collection collection = collectionRepository.findById(collectionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found!"));
        return collection.getStored();
    }

    @RequestMapping(value="/getAllCollections", method = RequestMethod.GET)
    public @ResponseBody Iterable<Collection> getAllCollections() {
        return collectionRepository.findAll();
    }

    @RequestMapping(value="/unselectAllCollections", method = RequestMethod.GET)
    public @ResponseBody String unselectAllCollections(){
        Collection lastSelectedCollection = null;
        for (Collection collection : this.getAllCollections()){
            if (collection.isSelected()) {
                collection.setSelected(false);
                lastSelectedCollection = collection;
                collectionRepository.save(collection);
            }
        }
        return "The last selected collection has been successfully unselected!";
    }


    /**
     * Below are methods for task operations with requested mappings
     */
    @RequestMapping(value="/addNewTask", method = RequestMethod.POST)
    public @ResponseBody Task addNewTask(@RequestParam String taskContent, @RequestParam Long collectionId){
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found!"));

        Task task = new Task(taskContent, collection);
        taskRepository.save(task);

        collection.addToStored(task);
        return task;
    }

    @RequestMapping(value="/deleteTask", method = RequestMethod.DELETE)
    public @ResponseBody String deleteTask(@RequestParam Long id){
        try{
            Task task = taskRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found!"));
            task.getCollection().deleteFromStored(task);
            taskRepository.delete(task);
            return "Task with ID " + id + " has been successfully deleted!";
        } catch (Exception e){
            return "Error " + e.getMessage();
        }
    }


    @RequestMapping(value="/completeTask", method = RequestMethod.PATCH)
    public @ResponseBody Task completeTask (@RequestParam Long id){
        try{
            Task task = taskRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found!"));
            boolean bool = task.isCompleted();
            task.setCompleted(!bool);
            taskRepository.save(task);
            return task;
        } catch (Exception e){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @RequestMapping(value="/getAllTasks", method = RequestMethod.GET)
    public @ResponseBody Iterable<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @RequestMapping(value="/getAllComplete", method = RequestMethod.GET)
    public @ResponseBody Iterable<Task> getAllComplete(){
        List<Task> result = new ArrayList<>();
        for (Task task : taskRepository.findAll()){
            if (task.isCompleted()){
                result.add(task);
            }
        }
        return result;
    }

}
