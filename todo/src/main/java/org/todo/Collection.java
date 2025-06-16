package org.todo;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Entity
@Table(name="collection")
public class Collection {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String name;

    private boolean selected;

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> stored;

    public Collection(){}
    public Collection(String name) {
        this.name = name;
        this.stored = new ArrayList<>();
    }

    // Getters
    public Long getId(){
        return id;
    }

    public String getName() {
        return name;
    }

    public boolean isSelected() {
        return selected;
    }

    @JsonManagedReference
    public List<Task> getStored(){
        return stored;
    }

    // Setters


    public void setName(String name) {
        this.name = name;
    }

    public void setSelected(boolean selected) {
        this.selected = selected;
    }

    public void addToStored(Task task){
        stored.add(task);
    }

    public void deleteFromStored(Task task){
        stored.remove(task);
    }

    public Iterator<Task> getStoredIterator(){
       return stored.iterator();
    }
}
