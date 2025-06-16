package org.todo;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name="task")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String content;

    private boolean completed;

    @ManyToOne
    @JoinColumn(name = "collection_id")
    @JsonBackReference
    private Collection collection;

    public Task(){}
    public Task(String content, Collection collection){
        this.completed = false;
        this.content = content;
        this.collection = collection;
    }
    // setters
    public void setContent(String content) {
        this.content = content;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public void setCollection(Collection collection){
        this.collection = collection;
    }

    //getters

    public String getContent() {
        return content;
    }

    public boolean isCompleted() {
        return completed;
    }

    public Collection getCollection(){
        return collection;
    }

    public Long getId(){
        return id;
    }


}
