import { useEffect, useState } from 'react';
import ReactFlow, { Background, Elements, Position } from 'react-flow-renderer';
import {
  getAllCourses,
  getCourse,
  getCoursePrerequisites,
} from '../../lib/courses';
import { ICourse } from '../../types';
import ELK, { ElkNode, ElkPrimitiveEdge } from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const layoutElements = async (prereqs: Record<string, ICourse[]>) => {
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: { 'elk.algorithm': 'layered' },
    children: [
      ...Object.entries(prereqs).map(([base]) => {
        return {
          id: base,
          width: 172,
          height: 36,
        };
      }),
    ],
    edges: [],
  };
  Object.entries(prereqs).map(([base, prereqs]) => {
    if (prereqs.length === 0) return;
    for (const index of prereqs.keys()) {
      (graph.edges as ElkPrimitiveEdge[]).push({
        id: `e-${base}`,
        source: prereqs[index].course_no,
        target: base,
      });
    }
  });

  const parsedGraph = await elk.layout(graph);
  const elements: Elements = [];
  if (parsedGraph.children) {
    parsedGraph.children.forEach((node) => {
      elements.push({
        id: node.id,
        type: 'default',
        data: {
          label: (
            <h1 className="font-display font-black text-gray-700">{node.id}</h1>
          ),
        },
        position: { x: node.x ?? 0, y: node.y ?? 0 },
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
      });
    });
  }

  if (parsedGraph.edges) {
    (parsedGraph.edges as ElkPrimitiveEdge[]).forEach((edge) => {
      elements.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: false,
      });
    });
  }
  return elements;
};

// TODO: Add a button inside the react-flow chart
// to load + render all prerequisites for courses that have an
// empty array as a prerequisite in the prereqs variable

const CoursePage = ({
  course,
  initialPrereqs,
}: {
  course: ICourse;
  initialPrereqs: Record<string, ICourse[]>;
}) => {
  const [prereqs, setPrereqs] =
    useState<Record<string, ICourse[]>>(initialPrereqs);

  const [elements, setElements] = useState<Elements>([]);

  // Relayout the chart when prereqs changes
  useEffect(() => {
    async function main() {
      const elements = await layoutElements(prereqs);
      setElements(elements);
    }
    main();
  }, [prereqs]);

  const getMorePrereqs = async () => {
    const prereqsToWrite = { ...prereqs };
    for (const [base, currPrereqs] of Object.entries(prereqs)) {
      if (currPrereqs.length !== 0) continue;
      const res = await fetch(`http://localhost:3000/api/prereqs/${base}`);
      const newPrereqs: ICourse[] = await res.json();
      if (newPrereqs.length > 0) {
        prereqsToWrite[base] = newPrereqs;
        for (const newPrereq of newPrereqs) {
          prereqsToWrite[newPrereq.course_no] = [];
        }
      }
    }
    setPrereqs(prereqsToWrite);
  };

  return (
    <div>
      <div className="bg-exeter px-8 pt-28 pb-20 lg:px-40">
        <h1 className="font-display text-2xl text-gray-300 md:text-3xl">
          {course.course_no}
        </h1>
        <h1 className="mt-2 font-display text-4xl font-black text-white md:text-5xl ">
          {course.lt}
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-16 px-8 pt-14 pb-20 md:grid-cols-5 lg:px-40">
        <div className="md:col-span-2">
          <h1 className="font-display text-3xl font-black text-gray-700">
            Description
          </h1>
          <h1 className="mt-4 font-display text-lg leading-8 text-gray-900">
            {course.desc}
          </h1>
        </div>
        <div className="md:col-span-3">
          <h1 className="font-display text-3xl font-black text-gray-700">
            Prerequisites
          </h1>
          <div className="h-full">
            <button
              className="absolute z-10 m-2 rounded-md bg-gray-700 p-2 font-display text-sm font-bold text-white shadow-lg transition duration-150 ease-out active:translate-y-1"
              onClick={getMorePrereqs}
            >
              More Prereqs
            </button>
            <ReactFlow
              className="mt-4 shadow-md"
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              selectNodesOnDrag={false}
              elements={elements}
            >
              <Background color="#858585" />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

export async function getStaticPaths() {
  const courses = getAllCourses();

  const paths = courses.map((course) => ({
    params: { id: course.course_no },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  const course = getCourse(params.id);
  const firstPrereqs = getCoursePrerequisites(params.id);
  const initialPrereqs: Record<string, ICourse[]> = {};
  initialPrereqs[params.id] = firstPrereqs;
  for (const prereq of firstPrereqs) {
    initialPrereqs[prereq.course_no] = [];
  }

  return {
    props: {
      course: course,
      initialPrereqs: initialPrereqs,
    },
  };
}

export default CoursePage;
