from typing import List, Optional

from networkx import DiGraph
from pydantic import BaseModel, Field


class BlockIOBase(BaseModel):
    """
    Base input/output type inherited by all blocks. Allows for overrides
    """

    class Config:
        extra = "allow"


class Block(BaseModel):
    id: str
    type: str
    input: BlockIOBase

    def run(self) -> BlockIOBase:
        raise NotImplementedError("Base workflow Node class must be inherited")


class EdgeUpsert(BaseModel):
    id: Optional[str]
    source: str
    target: str


class NodeUpsert(BaseModel):
    id: Optional[str]
    ref: str = Field(description="Reference ID generate by the frontend")
    pos_x: float
    pos_y: float


class Node(BaseModel):
    id: str
    ref: str
    pos_x: float
    pos_y: float


class Edge(BaseModel):
    id: str
    source: str
    target: str


class Workflow(BaseModel):
    id: str
    user_id: str
    organization_id: Optional[str] = Field(default=None)
    name: str
    description: str


# noinspection DuplicatedCode
class WorkflowUpdate(BaseModel):
    nodes: List[NodeUpsert]
    edges: List[EdgeUpsert]

    def to_graph(self) -> DiGraph:
        graph = DiGraph()
        graph.add_nodes_from([v.id or v.ref for v in self.nodes])
        graph.add_edges_from([(e.source, e.target) for e in self.edges])

        return graph


# noinspection DuplicatedCode
class WorkflowFull(Workflow):
    nodes: List[Node]
    edges: List[Edge]

    def to_graph(self) -> DiGraph:
        graph = DiGraph()
        graph.add_nodes_from([v.id for v in self.nodes])
        graph.add_edges_from([(e.source, e.target) for e in self.edges])

        return graph
