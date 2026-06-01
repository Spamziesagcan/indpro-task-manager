from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, case, delete, select
from sqlalchemy.orm import Session

from app.deps import get_current_active_user
from app.core.database import get_session
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskMove, TaskRead, TaskReplace


router = APIRouter(prefix="/tasks", tags=["tasks"])


def _status_rank_expr():
    return case(
        (Task.status == "todo", 0),
        (Task.status == "in-progress", 1),
        (Task.status == "done", 2),
        else_=3,
    )


def _normalize_positions(session: Session, user_id: int, status_value: str) -> None:
    tasks = session.execute(
        select(Task)
        .where(Task.user_id == user_id, Task.status == status_value)
        .order_by(asc(Task.position), asc(Task.id))
    ).scalars().all()
    for idx, task in enumerate(tasks):
        task.position = idx
        task.updated_at = datetime.now(timezone.utc)
        session.add(task)


def _next_position(session: Session, user_id: int, status_value: str) -> int:
    tasks = session.execute(
        select(Task).where(Task.user_id == user_id, Task.status == status_value)
    ).scalars().all()
    if not tasks:
        return 0
    return max(t.position for t in tasks) + 1


def _reorder_task(
    session: Session,
    task: Task,
    target_status: str,
    target_position: int,
) -> Task:
    target_tasks = session.execute(
        select(Task)
        .where(Task.user_id == task.user_id, Task.status == target_status, Task.id != task.id)
        .order_by(asc(Task.position), asc(Task.id))
    ).scalars().all()

    insert_at = min(target_position, len(target_tasks))
    now = datetime.now(timezone.utc)

    # Move the edited task out of the way before reshuffling the destination column.
    task.status = target_status
    task.position = -1
    task.updated_at = now
    session.add(task)

    if target_tasks:
        for item in target_tasks:
            item.position = item.position + 1000
            item.updated_at = now
            session.add(item)
        session.flush()

    task.position = insert_at
    task.updated_at = now
    session.add(task)

    for idx, item in enumerate(target_tasks):
        item.position = idx if idx < insert_at else idx + 1
        item.updated_at = now
        session.add(item)

    session.commit()
    session.refresh(task)
    return task


@router.get("", response_model=list[TaskRead])
def list_tasks(
    status_value: Optional[str] = Query(default=None, alias="status"),
    session: Session = Depends(get_session),
):
    # TODO: Use current_user from auth when implemented
    user_id = 1  # Test user ID
    query = select(Task).where(Task.user_id == user_id)
    if status_value is not None:
        query = query.where(Task.status == status_value)
    query = query.order_by(_status_rank_expr(), asc(Task.position), asc(Task.id))
    return session.execute(query).scalars().all()


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    session: Session = Depends(get_session),
):
    # TODO: Use current_user from auth when implemented
    user_id = 1  # Test user ID
    position = _next_position(session, user_id, payload.status)

    task = Task(
        user_id=user_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        status=payload.status,
        position=position,
    )

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskReplace,
    session: Session = Depends(get_session),
):
    # TODO: Use current_user from auth when implemented
    user_id = 1  # Test user ID
    task = session.get(Task, task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")

    previous_status = task.status
    target_status = payload.status
    target_position = (
        payload.position
        if payload.position is not None
        else (_next_position(session, user_id, target_status) if target_status != previous_status else task.position)
    )

    task.title = payload.title.strip()
    task.description = payload.description.strip()
    task.updated_at = datetime.now(timezone.utc)

    session.add(task)

    if target_status != previous_status or payload.position is not None:
        session.flush()
        task = _reorder_task(session, task, target_status, target_position)
        if previous_status != target_status:
            _normalize_positions(session, user_id, previous_status)
            session.commit()
        return task

    session.commit()
    session.refresh(task)
    return task


@router.patch("/{task_id}/move", response_model=TaskRead)
def move_task(
    task_id: int,
    payload: TaskMove,
    session: Session = Depends(get_session),
):
    # TODO: Use current_user from auth when implemented
    user_id = 1  # Test user ID
    task = session.get(Task, task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status
    task = _reorder_task(session, task, payload.status, payload.position)
    _normalize_positions(session, user_id, old_status)
    session.commit()
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    session: Session = Depends(get_session),
):
    # TODO: Use current_user from auth when implemented
    user_id = 1  # Test user ID
    task = session.get(Task, task_id)
    if not task or task.user_id != user_id:
        raise HTTPException(status_code=404, detail="Task not found")

    deleted_status = task.status
    session.execute(delete(Task).where(Task.id == task_id))
    session.commit()

    _normalize_positions(session, user_id, deleted_status)
    session.commit()
    return None
