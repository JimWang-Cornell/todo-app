package org.todo;

import org.springframework.data.repository.CrudRepository;

public interface TaskRepository extends CrudRepository<Task,Long> {

}
