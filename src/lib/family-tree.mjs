import { hierarchy, tree } from "d3-hierarchy";

export const FAMILY_NODE_WIDTH = 340;
export const FAMILY_NODE_HEIGHT = 195;

const HORIZONTAL_GAP = 72;
const VERTICAL_GAP = 80;
const COMPONENT_GAP = 156;

function normalizeClassName(className) {
  return String(className || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function createClassRanker(classOrder) {
  const rankByClass = new Map(
    classOrder.map((className, index) => [normalizeClassName(className), index]),
  );
  return (member) =>
    rankByClass.get(normalizeClassName(member.current_class_number)) ?? Infinity;
}

function compareMembers(a, b, classRank) {
  const aClass = classRank(a);
  const bClass = classRank(b);
  if (aClass !== bClass) return aClass < bClass ? -1 : 1;
  return (
    (a.name || a.uniqname).localeCompare(b.name || b.uniqname) ||
    a.uniqname.localeCompare(b.uniqname)
  );
}

export function wouldCreateCycle(edges, big, little) {
  const pending = [little];
  const seen = new Set();
  while (pending.length) {
    const current = pending.pop();
    if (current === big) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const edge of edges) {
      if (edge.big_uniqname === current) pending.push(edge.little_uniqname);
    }
  }
  return false;
}

function layoutComponent(members, edges, classRank) {
  const byId = new Map(members.map((member) => [member.uniqname, member]));
  const ordered = [...byId.values()].sort((a, b) =>
    compareMembers(a, b, classRank),
  );
  const ids = new Set(byId.keys());
  const candidates = edges
    .filter(
      (edge) =>
        edge.big_uniqname !== edge.little_uniqname &&
        ids.has(edge.big_uniqname) &&
        ids.has(edge.little_uniqname),
    )
    .sort(
      (a, b) =>
        a.big_uniqname.localeCompare(b.big_uniqname) ||
        a.little_uniqname.localeCompare(b.little_uniqname),
    );
  const valid = [];
  for (const edge of candidates) {
    if (!wouldCreateCycle(valid, edge.big_uniqname, edge.little_uniqname))
      valid.push(edge);
  }

  // Database class order provides the cohort order; actual relationships can
  // only move a little below their big.
  const incomingCount = new Map(ordered.map((member) => [member.uniqname, 0]));
  for (const edge of valid) {
    incomingCount.set(
      edge.little_uniqname,
      incomingCount.get(edge.little_uniqname) + 1,
    );
  }
  const classLevels = [...new Set(ordered.map(classRank).filter(Number.isFinite))]
    .sort((a, b) => a - b);
  const classLevel = new Map(classLevels.map((value, index) => [value, index]));
  const generation = new Map(
    ordered.map((member) => [
      member.uniqname,
      classLevel.get(classRank(member)) ?? 0,
    ]),
  );
  const queue = ordered
    .filter((member) => incomingCount.get(member.uniqname) === 0)
    .map((member) => member.uniqname);
  for (let index = 0; index < queue.length; index++) {
    const big = queue[index];
    for (const edge of valid) {
      if (edge.big_uniqname !== big) continue;
      const little = edge.little_uniqname;
      generation.set(
        little,
        Math.max(generation.get(little), generation.get(big) + 1),
      );
      incomingCount.set(little, incomingCount.get(little) - 1);
      if (incomingCount.get(little) === 0) queue.push(little);
    }
  }

  // Imported data can contain cycles even though admin edits reject them.
  const leftovers = ordered.filter((member) => incomingCount.get(member.uniqname) > 0);
  let nextGeneration = Math.max(0, ...generation.values()) + 1;
  for (const member of leftovers) generation.set(member.uniqname, nextGeneration++);

  const compressedLevels = [...new Set(generation.values())].sort((a, b) => a - b);
  const compactGeneration = new Map(
    compressedLevels.map((value, index) => [value, index]),
  );
  for (const member of ordered) {
    generation.set(
      member.uniqname,
      compactGeneration.get(generation.get(member.uniqname)),
    );
  }

  // A little with multiple bigs is shown once, under the oldest/nearest big.
  // The remaining relationships stay visible as straight connecting lines.
  const incoming = new Map(ordered.map((member) => [member.uniqname, []]));
  for (const edge of valid) incoming.get(edge.little_uniqname).push(edge.big_uniqname);
  const primaryParent = new Map();
  for (const member of ordered) {
    const parents = incoming.get(member.uniqname);
    parents.sort(
      (a, b) =>
        generation.get(a) - generation.get(b) ||
        compareMembers(byId.get(a), byId.get(b), classRank),
    );
    if (parents.length) primaryParent.set(member.uniqname, parents[0]);
  }
  const primaryChildren = new Map(ordered.map((member) => [member.uniqname, []]));
  for (const [little, big] of primaryParent) primaryChildren.get(big).push(little);
  for (const children of primaryChildren.values())
    children.sort((a, b) =>
      compareMembers(byId.get(a), byId.get(b), classRank),
    );

  const roots = ordered
    .filter((member) => !primaryParent.has(member.uniqname))
    .sort((a, b) => compareMembers(a, b, classRank));
  const forest = {
    children: roots.map((member) => buildHierarchy(member.uniqname)),
  };
  function buildHierarchy(id) {
    return {
      id,
      children: primaryChildren.get(id).map(buildHierarchy),
    };
  }

  // D3's tidy-tree layout centers a parent over its child branch. A one-child
  // chain therefore shares one x coordinate from top to bottom.
  const root = hierarchy(forest, (node) => node.children);
  tree()
    .nodeSize([FAMILY_NODE_WIDTH + HORIZONTAL_GAP, 1])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.18))(root);
  const placed = root.descendants().filter((node) => node.data.id);
  const minCenter = Math.min(...placed.map((node) => node.x));
  const maxCenter = Math.max(...placed.map((node) => node.x));
  const width = maxCenter - minCenter + FAMILY_NODE_WIDTH;
  const nodes = placed.map((node) => ({
    ...byId.get(node.data.id),
    generation: generation.get(node.data.id),
    x: node.x - minCenter,
    y: generation.get(node.data.id) * (FAMILY_NODE_HEIGHT + VERTICAL_GAP),
  }));
  const nodeById = new Map(nodes.map((node) => [node.uniqname, node]));

  return {
    width,
    height:
      (Math.max(...generation.values()) + 1) * FAMILY_NODE_HEIGHT +
      Math.max(0, Math.max(...generation.values())) * VERTICAL_GAP,
    nodes,
    edges: valid.map((edge) => {
      const big = nodeById.get(edge.big_uniqname);
      const little = nodeById.get(edge.little_uniqname);
      return {
        ...edge,
        points: [
          { x: big.x + FAMILY_NODE_WIDTH / 2, y: big.y + FAMILY_NODE_HEIGHT },
          { x: little.x + FAMILY_NODE_WIDTH / 2, y: little.y },
        ],
      };
    }),
  };
}

// Keep connected families vertically readable, then set unrelated families
// beside one another with a clear, consistent margin.
export function layoutFamily(members, edges, classOrder = []) {
  const classRank = createClassRanker(classOrder);
  const byId = new Map();
  for (const member of members)
    if (!byId.has(member.uniqname)) byId.set(member.uniqname, member);
  const ordered = [...byId.values()].sort((a, b) =>
    a.uniqname.localeCompare(b.uniqname),
  );
  if (!ordered.length)
    return {
      width: FAMILY_NODE_WIDTH,
      height: FAMILY_NODE_HEIGHT,
      nodes: [],
      edges: [],
    };

  const candidates = edges
    .filter(
      (edge) => byId.has(edge.big_uniqname) && byId.has(edge.little_uniqname),
    )
    .sort(
      (a, b) =>
        a.big_uniqname.localeCompare(b.big_uniqname) ||
        a.little_uniqname.localeCompare(b.little_uniqname),
    );
  const validEdges = [];
  const seenEdges = new Set();
  for (const edge of candidates) {
    const key = `${edge.big_uniqname}\u0000${edge.little_uniqname}`;
    if (
      seenEdges.has(key) ||
      wouldCreateCycle(validEdges, edge.big_uniqname, edge.little_uniqname)
    )
      continue;
    seenEdges.add(key);
    validEdges.push(edge);
  }

  const neighbors = new Map(ordered.map((member) => [member.uniqname, []]));
  for (const edge of validEdges) {
    neighbors.get(edge.big_uniqname).push(edge.little_uniqname);
    neighbors.get(edge.little_uniqname).push(edge.big_uniqname);
  }

  const seen = new Set();
  const components = [];
  for (const member of ordered) {
    if (seen.has(member.uniqname)) continue;
    const queue = [member.uniqname];
    seen.add(member.uniqname);
    for (let index = 0; index < queue.length; index++) {
      for (const neighbor of neighbors.get(queue[index])) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    const componentIds = new Set(queue);
    components.push(
      layoutComponent(
        queue.map((id) => byId.get(id)),
        validEdges.filter((edge) => componentIds.has(edge.big_uniqname)),
        classRank,
      ),
    );
  }
  if (components.length === 1) return components[0];

  components.sort((a, b) => {
    const cohort = (component) => Math.min(...component.nodes.map(classRank));
    const aCohort = cohort(a);
    const bCohort = cohort(b);
    if (aCohort !== bCohort) return aCohort < bCohort ? -1 : 1;
    return a.nodes[0].uniqname.localeCompare(b.nodes[0].uniqname);
  });
  const width =
    components.reduce((sum, component) => sum + component.width, 0) +
    COMPONENT_GAP * (components.length - 1);
  const height = Math.max(...components.map((component) => component.height));
  const nodes = [];
  const routedEdges = [];
  let x = 0;
  for (const component of components) {
    nodes.push(
      ...component.nodes.map((node) => ({ ...node, x: node.x + x })),
    );
    routedEdges.push(
      ...component.edges.map((edge) => ({
        ...edge,
        points: edge.points.map((point) => ({ x: point.x + x, y: point.y })),
      })),
    );
    x += component.width + COMPONENT_GAP;
  }
  return { width, height, nodes, edges: routedEdges };
}

export function familyIds(edges, memberId) {
  const ids = new Set([memberId]);
  const queue = [memberId];
  for (let i = 0; i < queue.length; i++) {
    for (const edge of edges) {
      const neighbor =
        edge.big_uniqname === queue[i]
          ? edge.little_uniqname
          : edge.little_uniqname === queue[i]
            ? edge.big_uniqname
            : null;
      if (neighbor && !ids.has(neighbor)) {
        ids.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return ids;
}
