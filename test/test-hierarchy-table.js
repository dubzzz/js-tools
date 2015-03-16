QUnit.module("HierarchyNode::str()");

QUnit.test("Root node", function(assert) {
	var node = new HierarchyNode("root", undefined);
	assert.equal(node.str(), "root", "String value");
});

QUnit.test("Intermediate node", function(assert) {
	var root = new HierarchyNode("root", undefined);
	var c1 = new HierarchyNode("c1", root);
	var c11 = new HierarchyNode("c11", c1);
	var c2 = new HierarchyNode("c2", root);
	assert.equal(c1.str(), "root > c1", "String value");
	assert.equal(root.str(), "root", "String value");
});

QUnit.test("Leaf node", function(assert) {
	var root = new HierarchyNode("root", undefined);
	var c1 = new HierarchyNode("c1", root);
	var c11 = new HierarchyNode("c11", c1);
	var c2 = new HierarchyNode("c2", root);
	assert.equal(c11.str(), "root > c1 > c11", "String value");
	assert.equal(c2.str(), "root > c2", "String value");
});

QUnit.module("HierarchyNode::getPathFromRoot()");

QUnit.test("Root node", function(assert) {
	var node = new HierarchyNode("root", undefined);
	assert.deepEqual(node.getPathFromRoot(), [node], "Path value");
});

QUnit.test("Intermediate node", function(assert) {
	var root = new HierarchyNode("root", undefined);
	var c1 = new HierarchyNode("c1", root);
	var c11 = new HierarchyNode("c11", c1);
	var c2 = new HierarchyNode("c2", root);
	assert.deepEqual(c1.getPathFromRoot(), [root, c1], "Path value");
	assert.deepEqual(root.getPathFromRoot(), [root], "Path value");
});

QUnit.test("Leaf node", function(assert) {
	var root = new HierarchyNode("root", undefined);
	var c1 = new HierarchyNode("c1", root);
	var c11 = new HierarchyNode("c11", c1);
	var c2 = new HierarchyNode("c2", root);
	assert.deepEqual(c11.getPathFromRoot(), [root, c1, c11], "String value");
	assert.deepEqual(c2.getPathFromRoot(), [root, c2], "Path value");
});

QUnit.module("HierarchyNode::compare(HierarchyNode:node)");

QUnit.test("Exactly the same node", function(assert) {
	var node = new HierarchyNode("root", undefined);
	assert.strictEqual(node.compare(node), 0, "Equality");
});

QUnit.test("Same node value", function(assert) {
	var node1 = new HierarchyNode("root", undefined);
	var node2 = new HierarchyNode("root", undefined);
	assert.strictEqual(node1.compare(node2), 0, "Equality");
});

QUnit.test("Children to Father", function(assert) {
	var root = new HierarchyNode("root", undefined);
	var c1 = new HierarchyNode("c1", root);
	assert.strictEqual(c1.compare(root), 1, "Greater than its father");
	assert.strictEqual(root.compare(c1), -1, "Lower than its child");
});

QUnit.test("Different branches", function(assert) {
	var root = new HierarchyNode("root", undefined);
	var c1 = new HierarchyNode("c1", root);
	var c2 = new HierarchyNode("c2", root);
	assert.strictEqual(c1.compare(c2), -1, "'c1' lower than 'c2'");
	assert.strictEqual(c2.compare(c1), 1, "'c2' greater than 'c1'");
});

QUnit.test("Different branches, different levels", function(assert) {
	var root = new HierarchyNode("root", undefined);
	var c1 = new HierarchyNode("c1", root);
	var c5 = new HierarchyNode("c5", c1);
	var c2 = new HierarchyNode("c2", root);
	var c0 = new HierarchyNode("c0", c2);
	var c9 = new HierarchyNode("c9", c2);
	assert.strictEqual(c0.compare(c1), 1, "'c0' greater than 'c1'");
	assert.strictEqual(c9.compare(c1), 1, "'c9' greater than 'c1'");
	assert.strictEqual(c0.compare(c5), 1, "'c0' greater than 'c5'");
	assert.strictEqual(c9.compare(c5), 1, "'c9' greater than 'c5'");
	assert.strictEqual(c2.compare(c5), 1, "'c9' greater than 'c5'");
});

QUnit.module("Array<HierarchyRow>.hierarchyTableSort(Array<int>:criteria)");

QUnit.test("Ascending ordering on a single column", function(assert) {
	var row1 = new HierarchyRow([
			new HierarchyItem(10),
			new HierarchyItem(10),
	]);
	var row2 = new HierarchyRow([
			new HierarchyItem(50),
			new HierarchyItem(0),
	]);
	var row3 = new HierarchyRow([
			new HierarchyItem(20),
			new HierarchyItem(50),
	]);
	var rows = new Array();
	var criteria = new Array();
	
	rows = [row1, row2, row3];
	criteria = [0];
	rows.hierarchyTableSort(criteria);
	assert.deepEqual(rows, [row1, row3, row2], "Ascending ordering on first column");
	
	rows = [row1, row2, row3];
	criteria = [1];
	rows.hierarchyTableSort(criteria);
	assert.deepEqual(rows, [row2, row1, row3], "Ascending ordering on second column");
});

QUnit.test("Descending ordering on a single column", function(assert) {
	var row1 = new HierarchyRow([
			new HierarchyItem(10),
			new HierarchyItem(10),
	]);
	var row2 = new HierarchyRow([
			new HierarchyItem(50),
			new HierarchyItem(0),
	]);
	var row3 = new HierarchyRow([
			new HierarchyItem(20),
			new HierarchyItem(50),
	]);
	var rows = new Array();
	var criteria = new Array();
	
	rows = [row1, row2, row3];
	criteria = [-1];
	rows.hierarchyTableSort(criteria);
	assert.deepEqual(rows, [row2, row3, row1], "Descending ordering on first column");
	
	rows = [row1, row2, row3];
	criteria = [-2];
	rows.hierarchyTableSort(criteria);
	assert.deepEqual(rows, [row3, row1, row2], "Descending ordering on second column");
});

QUnit.test("Ordering on multiple columns", function(assert) {
	var row1 = new HierarchyRow([
			new HierarchyItem(10),
			new HierarchyItem(10),
	]);
	var row2 = new HierarchyRow([
			new HierarchyItem(50),
			new HierarchyItem(0),
	]);
	var row3 = new HierarchyRow([
			new HierarchyItem(20),
			new HierarchyItem(50),
	]);
	var row4 = new HierarchyRow([
			new HierarchyItem(10),
			new HierarchyItem(50),
	]);
	var row5 = new HierarchyRow([
			new HierarchyItem(0),
			new HierarchyItem(50),
	]);
	var rows = new Array();
	var criteria = new Array();
	
	rows = [row1, row2, row3];
	criteria = [0, 1];
	rows.hierarchyTableSort(criteria);
	assert.deepEqual(rows, [row1, row3, row2], "(first, second) column: distinct first columns");
	
	rows = [row1, row2, row3, row4, row5];
	criteria = [0, 1];
	rows.hierarchyTableSort(criteria);
	assert.deepEqual(rows, [row5, row1, row4, row3, row2], "(first, second) column: equality between two first columns");
	
	rows = [row1, row2, row3, row4, row5];
	criteria = [0, -2];
	rows.hierarchyTableSort(criteria);
	assert.deepEqual(rows, [row5, row4, row1, row3, row2], "(first, -second) column: equality between two first columns");
});

