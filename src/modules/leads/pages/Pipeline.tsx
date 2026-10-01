import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { LeadStage, Lead } from '../types';

const STAGES: LeadStage[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export default function PipelineBoard() {
  const [columns, setColumns] = useState<Record<LeadStage, Lead[]>>({
    New: [],
    Contacted: [],
    Qualified: [],
    Proposal: [],
    Negotiation: [],
    Won: [],
    Lost: [],
  });

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceCol = columns[source.droppableId as LeadStage];
      const destCol = columns[destination.droppableId as LeadStage];
      const sourceItems = [...sourceCol];
      const destItems = [...destCol];
      const [removed] = sourceItems.splice(source.index, 1);
      
      removed.stageName = destination.droppableId as LeadStage; // optimistic update
      destItems.splice(destination.index, 0, removed);
      
      setColumns({
        ...columns,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destItems,
      });

      // trigger API update here
    } else {
      const column = columns[source.droppableId as LeadStage];
      const copiedItems = [...column];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: copiedItems,
      });
    }
  };

  return (
    <div className="p-4 h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Pipeline</h1>
      
      <div className="flex-1 overflow-x-auto pb-24">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-h-[500px]">
            {STAGES.map((stage) => (
              <div key={stage} className="bg-gray-100 dark:bg-zinc-800/50 rounded-lg p-3 w-72 flex-shrink-0 flex flex-col border border-gray-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold text-gray-700 dark:text-gray-300">{stage}</h2>
                  <span className="bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">
                    {columns[stage].length}
                  </span>
                </div>
                
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 min-h-[150px] transition-colors rounded-md ${snapshot.isDraggingOver ? 'bg-gray-200/50 dark:bg-zinc-700/50' : ''}`}
                    >
                      {columns[stage].map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 mb-2 bg-white dark:bg-zinc-800 rounded shadow-sm border border-gray-200 dark:border-zinc-700 ${snapshot.isDragging ? 'shadow-lg border-blue-300 dark:border-blue-700' : ''}`}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <h4 className="font-medium dark:text-white">{item.fullName}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.company}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
