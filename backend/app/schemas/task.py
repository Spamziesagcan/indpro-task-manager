from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


TaskStatus = Literal["todo", "in-progress", "done"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    status: TaskStatus = "todo"
    position: Optional[int] = Field(default=None, ge=0)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[TaskStatus] = None
    position: Optional[int] = Field(default=None, ge=0)


class TaskReplace(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    status: TaskStatus
    position: Optional[int] = Field(default=None, ge=0)


class TaskMove(BaseModel):
    status: TaskStatus
    position: int = Field(ge=0)


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: str
    status: TaskStatus
    position: int
