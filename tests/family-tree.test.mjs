import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FAMILY_NODE_HEIGHT,
  FAMILY_NODE_WIDTH,
  familyIds,
  layoutFamily,
  wouldCreateCycle,
} from "../src/lib/family-tree.mjs";
const edge = (big_uniqname, little_uniqname) => ({
  big_uniqname,
  little_uniqname,
});
const members = ["a", "b", "c", "d", "alone"].map((uniqname) => ({ uniqname }));
const edges = [edge("a", "c"), edge("b", "c"), edge("c", "d"), edge("a", "d")];
test("shared littles and multiple littles retain every edge and appear once", () => {
  const graph = layoutFamily(members, edges);
  assert.equal(graph.nodes.length, 5);
  assert.equal(graph.edges.length, 4);
  const positions = new Map(graph.nodes.map((n) => [n.uniqname, n.y]));
  for (const e of edges)
    assert.ok(positions.get(e.big_uniqname) < positions.get(e.little_uniqname));
});
test("cycles, reverse links and self links are rejected, shared littles are allowed", () => {
  assert.equal(wouldCreateCycle(edges, "d", "a"), true);
  assert.equal(wouldCreateCycle(edges, "c", "a"), true);
  assert.equal(wouldCreateCycle(edges, "a", "a"), true);
  assert.equal(wouldCreateCycle(edges, "b", "d"), false);
});
test("family includes co-bigs and descendants but excludes disconnected members", () => {
  assert.deepEqual([...familyIds(edges, "c")].sort(), ["a", "b", "c", "d"]);
  assert.deepEqual([...familyIds(edges, "alone")], ["alone"]);
});
test("empty graphs, missing members, and malformed cycles do not crash layout", () => {
  assert.deepEqual(layoutFamily([], []).nodes, []);
  assert.equal(layoutFamily(members, [edge("missing", "a")]).edges.length, 0);
  assert.equal(
    layoutFamily(members, [edge("a", "b"), edge("b", "a")]).nodes.length,
    5,
  );
});

test("complex families keep all members distinct and route every shared connection", () => {
  const largeMembers = Array.from({ length: 60 }, (_, index) => ({
    uniqname: `member-${index}`,
    name: `Member ${index}`,
  }));
  const largeEdges = [];
  for (let index = 10; index < 60; index++) {
    largeEdges.push(edge(`member-${index - 10}`, `member-${index}`));
    if (index % 3 === 0)
      largeEdges.push(edge(`member-${index - 9}`, `member-${index}`));
    if (index >= 20 && index % 7 === 0)
      largeEdges.push(edge(`member-${index - 20}`, `member-${index}`));
  }
  const graph = layoutFamily(largeMembers, largeEdges);
  assert.equal(graph.nodes.length, 60);
  assert.equal(graph.edges.length, largeEdges.length);
  for (const node of graph.nodes) {
    assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y));
    for (const other of graph.nodes) {
      if (node.uniqname === other.uniqname) continue;
      assert.ok(
        node.x + FAMILY_NODE_WIDTH <= other.x ||
          other.x + FAMILY_NODE_WIDTH <= node.x ||
          node.y + FAMILY_NODE_HEIGHT <= other.y ||
          other.y + FAMILY_NODE_HEIGHT <= node.y,
        "Member cards must not overlap",
      );
    }
  }
  for (const connection of graph.edges) {
    assert.equal(connection.points.length, 2, "each relationship is a single straight segment");
    assert.ok(
      connection.points.every(
        (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
      ),
    );
    const from = graph.nodes.find(
      (node) => node.uniqname === connection.big_uniqname,
    );
    const to = graph.nodes.find(
      (node) => node.uniqname === connection.little_uniqname,
    );
    assert.ok(from.y < to.y);
  }
});

test("unrelated components stay side by side in one horizontal row", () => {
  const isolated = Array.from({ length: 18 }, (_, index) => ({
    uniqname: `person-${index}`,
  }));
  const portrait = layoutFamily(isolated, [], []);
  const landscape = layoutFamily(isolated, [], []);
  assert.equal(portrait.width, landscape.width);
  assert.equal(portrait.height, landscape.height);
  assert.equal(portrait.height, FAMILY_NODE_HEIGHT);
  for (const graph of [portrait, landscape]) {
    assert.equal(graph.nodes.length, 18);
    for (const node of graph.nodes) {
      assert.ok(node.x >= 0 && node.y >= 0);
      assert.ok(
        node.x + FAMILY_NODE_WIDTH <= graph.width &&
          node.y + FAMILY_NODE_HEIGHT <= graph.height,
      );
      for (const other of graph.nodes) {
        if (node.uniqname === other.uniqname) continue;
        assert.ok(
          node.x + FAMILY_NODE_WIDTH <= other.x ||
            other.x + FAMILY_NODE_WIDTH <= node.x ||
            node.y + FAMILY_NODE_HEIGHT <= other.y ||
            other.y + FAMILY_NODE_HEIGHT <= node.y,
        );
      }
    }
  }
});

test("packing keeps family connections attached and placement independent of input order", () => {
  const people = ["a", "b", "c", "d", "e", "f", "g"].map((uniqname) => ({
    uniqname,
  }));
  const relationships = [
    edge("a", "c"),
    edge("b", "c"),
    edge("d", "e"),
    edge("e", "f"),
  ];
  const graph = layoutFamily(people, relationships, []);
  const reversed = layoutFamily(
    [...people].reverse(),
    [...relationships].reverse(),
    [],
  );
  assert.deepEqual(graph, reversed);
  for (const connection of graph.edges) {
    const big = graph.nodes.find(
      (node) => node.uniqname === connection.big_uniqname,
    );
    const little = graph.nodes.find(
      (node) => node.uniqname === connection.little_uniqname,
    );
    assert.deepEqual(connection.points[0], {
      x: big.x + FAMILY_NODE_WIDTH / 2,
      y: big.y + FAMILY_NODE_HEIGHT,
    });
    assert.deepEqual(connection.points.at(-1), {
      x: little.x + FAMILY_NODE_WIDTH / 2,
      y: little.y,
    });
    assert.ok(big.y < little.y);
  }
});

test("database class order guides co-bigs despite graduation-year conflicts", () => {
  const roster = [
    {
      uniqname: "older-class",
      current_class_number: "Alpha",
      graduation_year: 2030,
    },
    {
      uniqname: "newer-class",
      current_class_number: "Beta",
      graduation_year: 2025,
    },
    {
      uniqname: "little",
      current_class_number: "Gamma",
      graduation_year: 2024,
    },
  ];
  const links = [
    edge("older-class", "little"),
    edge("newer-class", "little"),
  ];
  const graph = layoutFamily(roster, links, ["Alpha", "Beta", "Gamma"]);
  const y = Object.fromEntries(graph.nodes.map(node => [node.uniqname, node.y]));
  assert.ok(y["older-class"] < y["newer-class"] && y["newer-class"] < y.little);
  assert.equal(graph.edges.length, links.length);
});

test("a real relationship overrides the database class order", () => {
  const graph = layoutFamily([
    { uniqname: "big", current_class_number: "Beta" },
    { uniqname: "little", current_class_number: "Alpha" },
  ], [edge("big", "little")], ["Alpha", "Beta"]);
  const y = Object.fromEntries(graph.nodes.map(node => [node.uniqname, node.y]));
  assert.ok(y.big < y.little);
  assert.equal(graph.edges.length, 1);
});

test("unrelated components follow database class order", () => {
  const graph = layoutFamily(
    [
      { uniqname: "beta", current_class_number: "Beta" },
      { uniqname: "alpha", current_class_number: "Alpha" },
    ],
    [],
    ["Alpha", "Beta"],
  );
  const x = Object.fromEntries(graph.nodes.map((node) => [node.uniqname, node.x]));
  assert.ok(x.alpha < x.beta);
});

test("a one-child line stays straight down the same center", () => {
  const graph = layoutFamily(
    ["a", "b", "c"].map((uniqname) => ({ uniqname })),
    [edge("a", "b"), edge("b", "c")],
  );
  const x = Object.fromEntries(
    graph.nodes.map((node) => [node.uniqname, node.x + FAMILY_NODE_WIDTH / 2]),
  );
  assert.equal(x.a, x.b);
  assert.equal(x.b, x.c);
  assert.ok(graph.edges.every((connection) => connection.points[0].x === connection.points[1].x));
});

test("a big is centered over multiple littles", () => {
  const graph = layoutFamily(
    ["big", "left", "right"].map((uniqname) => ({ uniqname })),
    [edge("big", "left"), edge("big", "right")],
  );
  const nodes = Object.fromEntries(graph.nodes.map((node) => [node.uniqname, node]));
  const bigCenter = nodes.big.x + FAMILY_NODE_WIDTH / 2;
  const childCenter =
    (nodes.left.x + nodes.right.x + FAMILY_NODE_WIDTH) / 2;
  assert.equal(bigCenter, childCenter);
});
