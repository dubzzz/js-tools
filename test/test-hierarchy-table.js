QUnit.start();

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

function retrieveHierarchyTableContent($table_lines) {
	var real_content = new Array();
	for (var i = 0 ; i != $table_lines.length ; ++i) {
		var line = new Array();
		var $line_tds = $table_lines.eq(i).find("td");
		for (var j = 0 ; j != $line_tds.length ; ++j) {
			var $td = $line_tds.eq(j);
			if ($td.find(".expanded").length > 0 || $td.find(".collapsed").length > 0) { // aggreagated
				line.push($td.find("span").eq(1).text());
			}
			else {
				line.push($td.text());
			}
		}
		real_content.push(line);
	}
	return real_content;
}

function checkContent(assert, real_content, expected_content) {
	for (var i = 0 ; i != expected_content.length ; ++i) {
		for (var j = 0 ; j != expected_content[0].length ; ++j) {
			assert.strictEqual(
					real_content[i][j]
					, expected_content[i][j]
					, "Check item line: " + String(i) + ", column: " + String(j));
		}
	}
}

function HierarchyAggregateItem(data) {
	var self = this;
	self.data = data;

	self.display = function() {
		return String(self.data);
	};
	self.aggregate = function(other) {
		if (self.data === other.data) {
			return new HierarchyAggregateItem(self.data);
		}
		return undefined;
	};
}
HierarchyAggregateItem.prototype = new HierarchyItem;

function HierarchySumItem(data) {
	var self = this;
	self.data = data;

	self.display = function() {
		return String(self.data);
	};
	self.aggregate = function(other) {
		return new HierarchySumItem(self.data + other.data);
	};
}
HierarchySumItem.prototype = new HierarchyItem;

QUnit.module("HierarchyTable::display");

QUnit.test("Basic HierarchyItem: No aggregation", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10)],
		[new HierarchyItem(50),  new HierarchyItem(0)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	var $table_headers = $table.find("thead > tr > th > span");
	assert.strictEqual($table_headers.length, 2, "Two-column table");
	assert.strictEqual($table_headers.eq(0).text(), "Data 1", "First column is: Data 1");
	assert.strictEqual($table_headers.eq(1).text(), "Data 2", "Second column is: Data 2");
	assert.strictEqual($table_headers.eq(0).hasClass("hierarchy-asc"), true, "Ascending ordering on first column");
	assert.strictEqual($table_headers.eq(0).hasClass("hierarchy-desc"), false, "No descending ordering on first column");
	assert.strictEqual($table_headers.eq(1).hasClass("hierarchy-asc")
			|| $table_headers.eq(1).hasClass("hierarchy-desc"), false, "No ordering on second column");

	var $table_lines = $table.find("tbody > tr");
	var $line_expands = $table_lines.find(".expand-button");
	assert.strictEqual($table_lines.length, 2, "Only two lines should be visible");
	assert.strictEqual($line_expands.length, 2, "Only two expand buttons should be visible");

	var real_content = retrieveHierarchyTableContent($table_lines);
	var expected_content = [
			["10", ""],
			["50", ""]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: With aggregation", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10)],
		[new HierarchyItem(10),  new HierarchyItem(0)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	var $table_lines = $table.find("tbody > tr");
	var $line_expands = $table_lines.find(".expand-button");
	assert.strictEqual($table_lines.length, 1, "Only one line should be visible");
	assert.strictEqual($line_expands.length, 1, "Only one expand button should be visible");

	var real_content = retrieveHierarchyTableContent($table_lines);
	var expected_content = [["10",   ""]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: Click to expand lines", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10)],
		[new HierarchyItem(10),  new HierarchyItem(0)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	$table.find("tbody > tr .expand-button").first().click();
	var $table_lines = $table.find("tbody > tr");
	assert.strictEqual($table_lines.length, 3, "Three lines should be visible after expand");

	var real_content = retrieveHierarchyTableContent($table_lines);
	var expected_content = [
			["10",   ""],
			[  "", "10"],
			[  "",  "0"]];
	assert.strictEqual(real_content[1][1], "10", "Default ordering only on first column, remaining keeps it original order");
	assert.strictEqual(real_content[2][1],  "0", "Default ordering only on first column, remaining keeps it original order");
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: Click to collapse lines", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10)],
		[new HierarchyItem(10),  new HierarchyItem(0)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	$table.find("tbody > tr .expand-button").first().click();
	$table.find("tbody > tr .expand-button").first().click();
	var $table_lines = $table.find("tbody > tr");
	assert.strictEqual($table_lines.length, 1, "One line should be visible after collapse");

	var real_content = retrieveHierarchyTableContent($table_lines);
	var expected_content = [["10",   ""]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: Multi-level collapse/expand lines", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10),  new HierarchyItem(1)],
		[new HierarchyItem(20),  new HierarchyItem(0),  new HierarchyItem(2)],
		[new HierarchyItem(20), new HierarchyItem(10),  new HierarchyItem(3)],
		[new HierarchyItem(20), new HierarchyItem(10),  new HierarchyItem(4)],
		[new HierarchyItem(10), new HierarchyItem(10),  new HierarchyItem(5)],
		[new HierarchyItem(10),  new HierarchyItem(0),  new HierarchyItem(6)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 2;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", ""],
			["20", ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand 10>");
	$table.find("tbody > tr .expand-button").eq(0).click();
	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10"      , ""],
			[      "10", ""],
			[       "0", ""],
			["20"      , ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand 10>0>");
	$table.find("tbody > tr .expand-button").eq(2).click();
	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10"      ,  ""],
			[      "10",  ""],
			[       "0",  ""],
			[        "", "6"],
			["20"      ,  ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand 20>");
	$table.find("tbody > tr .expand-button").eq(3).click();
	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10"      ,  ""],
			[      "10",  ""],
			[       "0",  ""],
			[        "", "6"],
			["20"      ,  ""],
			[       "0",  ""],
			[      "10",  ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Collapse 10>");
	$table.find("tbody > tr .expand-button").eq(0).click();
	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10"      , ""],
			["20"      , ""],
			[       "0", ""],
			[      "10", ""]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: No collision between two hierarchy tables", function(assert) {
	var data1 = [
		[new HierarchyItem(10), new HierarchyItem(10)],
		[new HierarchyItem(10),  new HierarchyItem(0)]];
	var data2 = [
		[new HierarchyItem(30), new HierarchyItem(10)],
		[new HierarchyItem(10), new HierarchyItem(20)]];

	var $table1 = $('#qunit-fixture > table').eq(0);
	var $table2 = $('#qunit-fixture > table').eq(1);
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable1 = new HierarchyTable($table1, items_labels, data1, num_hierarchy_columns, undefined);
	var htable2 = new HierarchyTable($table2, items_labels, data2, num_hierarchy_columns, undefined);

	assert.ok(true, "Content of table 1");
	var real_content = retrieveHierarchyTableContent($table1.find("tbody > tr"));
	var expected_content = [["10", ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Content of table 2");
	real_content = retrieveHierarchyTableContent($table2.find("tbody > tr"));
	expected_content = [
			["10", ""],
			["30", ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand on table 2");
	$table2.find("tbody > tr .expand-button").eq(0).click();

	assert.ok(true, "Content of table 1");
	real_content = retrieveHierarchyTableContent($table1.find("tbody > tr"));
	expected_content = [["10", ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Content of table 2");
	real_content = retrieveHierarchyTableContent($table2.find("tbody > tr"));
	expected_content = [
			["10",   ""],
			[  "", "20"],
			["30",   ""]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: No collision between two hierarchy tables with same data", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10)],
		[new HierarchyItem(10),  new HierarchyItem(0)]];

	var $table1 = $('#qunit-fixture > table').eq(0);
	var $table2 = $('#qunit-fixture > table').eq(1);
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable1 = new HierarchyTable($table1, items_labels, data, num_hierarchy_columns, undefined);
	var htable2 = new HierarchyTable($table2, items_labels, data, num_hierarchy_columns, undefined);

	assert.ok(true, "Content of table 1");
	var real_content = retrieveHierarchyTableContent($table1.find("tbody > tr"));
	var expected_content = [["10", ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Content of table 2");
	real_content = retrieveHierarchyTableContent($table2.find("tbody > tr"));
	expected_content = [["10", ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand on table 2");
	$table2.find("tbody > tr .expand-button").eq(0).click();

	assert.ok(true, "Content of table 1");
	real_content = retrieveHierarchyTableContent($table1.find("tbody > tr"));
	expected_content = [["10", ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Content of table 2");
	real_content = retrieveHierarchyTableContent($table2.find("tbody > tr"));
	expected_content = [
			["10",   ""],
			[  "", "10"],
			[  "",  "0"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: Reverse sort", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10)],
		[new HierarchyItem(20), new HierarchyItem(50)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", ""],
			["20", ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Reverse sort on column 1");
	$table.find("thead > tr > th").eq(0).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["20", ""],
			["10", ""]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: Expand after reverse sort", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10)],
		[new HierarchyItem(20), new HierarchyItem(50)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	assert.ok(true, "Reverse sort on column 1");
	$table.find("thead > tr > th").eq(0).click();

	assert.ok(true, "Expand 20>");
	$table.find("tbody > tr .expand-button").eq(0).click();

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["20",   ""],
			[  "", "50"],
			["10",   ""]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: Sorting on other column", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchySumItem(10)],
		[new HierarchyItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20), new HierarchySumItem(20)],
		[new HierarchyItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem( 0)],
		[new HierarchyItem(10),  new HierarchySumItem(0)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "60"],
			["20", "30"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Reverse sort on column 1");
	$table.find("thead > tr > th").eq(0).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["20", "30"],
			["10", "60"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Cancel sort on column 1");
	$table.find("thead > tr > th").eq(0).click();

	assert.ok(true, "Sort on column 2");
	$table.find("thead > tr > th").eq(1).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["20", "30"],
			["10", "60"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Reverse sort on column 2");
	$table.find("thead > tr > th").eq(1).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10", "60"],
			["20", "30"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Basic HierarchyItem: Sorting on multiple columns", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchySumItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchySumItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchySumItem(0), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	assert.ok(true, "Expand 20>");
	$table.find("tbody > tr .expand-button").eq(1).click();
	assert.ok(true, "Expand 10>");
	$table.find("tbody > tr .expand-button").eq(0).click();

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "60", "35"],
			[  "", "10", "20"],
			[  "", "50",  "5"],
			[  "",  "0", "10"],
			["20", "30", "60"],
			[  "", "20", "10"],
			[  "", "10", "50"],
			[  "",  "0",  "0"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Add sort on column 3");
	$table.find("thead > tr > th").eq(2).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10", "60", "35"],
			[  "", "50",  "5"],
			[  "",  "0", "10"],
			[  "", "10", "20"],
			["20", "30", "60"],
			[  "",  "0",  "0"],
			[  "", "20", "10"],
			[  "", "10", "50"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Reverse sort on column 1");
	$table.find("thead > tr > th").eq(0).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["20", "30", "60"],
			[  "",  "0",  "0"],
			[  "", "20", "10"],
			[  "", "10", "50"],
			["10", "60", "35"],
			[  "", "50",  "5"],
			[  "",  "0", "10"],
			[  "", "10", "20"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "No more sort on column 1");
	$table.find("thead > tr > th").eq(0).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10", "60", "35"],
			[  "", "50",  "5"],
			[  "",  "0", "10"],
			[  "", "10", "20"],
			["20", "30", "60"],
			[  "",  "0",  "0"],
			[  "", "20", "10"],
			[  "", "10", "50"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("HierarchyItem with aggregation", function(assert) {
	var data = [
		[new HierarchyAggregateItem(10), new HierarchyAggregateItem(0), new HierarchyAggregateItem(1)],
		[new HierarchyAggregateItem(20), new HierarchyAggregateItem(0), new HierarchyAggregateItem(0)],
		[new HierarchyAggregateItem(20), new HierarchyAggregateItem(1), new HierarchyAggregateItem(0)],
		[new HierarchyAggregateItem(10), new HierarchyAggregateItem(0), new HierarchyAggregateItem(0)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "0",  ""],
			["20",  "", "0"]];
	checkContent(assert, real_content, expected_content);
});

QUnit.module("HierarchyTable::removeColumn");

QUnit.test("Remove a column", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchySumItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchySumItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchySumItem(0), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	htable.removeColumn(1);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "35"],
			["20", "60"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Remove a column does not collapse anything", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchySumItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchySumItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchySumItem(0), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	assert.ok(true, "Expand 20>");
	$table.find("tbody > tr .expand-button").eq(1).click();
	assert.ok(true, "Expand 10>");
	$table.find("tbody > tr .expand-button").eq(0).click();

	htable.removeColumn(1);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "35"],
			[  "", "20"],
			[  "",  "5"],
			[  "", "10"],
			["20", "60"],
			[  "", "10"],
			[  "", "50"],
			[  "",  "0"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Remove a column then expand", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchySumItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchySumItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchySumItem(0), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	htable.removeColumn(1);

	assert.ok(true, "Expand 20>");
	$table.find("tbody > tr .expand-button").eq(1).click();
	assert.ok(true, "Expand 10>");
	$table.find("tbody > tr .expand-button").eq(0).click();

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "35"],
			[  "", "20"],
			[  "",  "5"],
			[  "", "10"],
			["20", "60"],
			[  "", "10"],
			[  "", "50"],
			[  "",  "0"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Remove a hierarchy column", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchySumItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchySumItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchySumItem(0), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 2;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	htable.removeColumn(1);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "35"],
			["20", "60"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Remove a hierarchy column does not collapse expanded nodes", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10), new HierarchyItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchyItem(10), new HierarchyItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchyItem(20), new HierarchyItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchyItem(10), new HierarchyItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchyItem(0),  new HierarchyItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchyItem(0),  new HierarchyItem(1), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 3;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);
	
	assert.ok(true, "Expand 10>");
	$table.find("tbody > tr .expand-button").eq(0).click();
	assert.ok(true, "Expand 10>10>");
	$table.find("tbody > tr .expand-button").eq(1).click();
	assert.ok(true, "Expand 10>10>10>");
	$table.find("tbody > tr .expand-button").eq(2).click();

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10",             "35"],
			[      "10",       "25"],
			[            "10", "20"],
			[              "", "20"],
			[            "50",  "5"],
			[       "0",       "10"],
			["20",             "60"]];
	checkContent(assert, real_content, expected_content);

	htable.removeColumn(1);

	assert.ok(true, "Remove the 2nd column");

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10",       "35"],
			[      "10", "20"],
			[        "", "20"],
			[      "50",  "5"],
			[       "1", "10"],
			["20",       "60"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Remove a hierarchy column then expand", function(assert) {
	var data = [
		[new HierarchyItem(10), new HierarchyItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchyItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchyItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchyItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchyItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchyItem(0), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 2;
	var htable = new HierarchyTable($table, items_labels, data, num_hierarchy_columns, undefined);

	htable.removeColumn(1);

	assert.ok(true, "Expand 20>");
	$table.find("tbody > tr .expand-button").eq(1).click();
	assert.ok(true, "Expand 10>");
	$table.find("tbody > tr .expand-button").eq(0).click();

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "35"],
			[  "", "20"],
			[  "",  "5"],
			[  "", "10"],
			["20", "60"],
			[  "", "10"],
			[  "", "50"],
			[  "",  "0"]];
	checkContent(assert, real_content, expected_content);
});

QUnit.module("HierarchyTable::addColumn"); // addHierarchyColumn should be used to add a hierarchy column

QUnit.test("Add a column", function(assert) {
	var data_old = [
		[new HierarchyItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0)],
		[new HierarchyItem(10), new HierarchySumItem(10)]];
	var data_new = [
		[new HierarchyItem(10), new HierarchySumItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchySumItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchySumItem(0), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels_old = ["Data 1", "Data 3"];
	var items_labels_new = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels_old, data_old, num_hierarchy_columns, undefined);

	htable.addColumn(1, data_new, items_labels_new);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "60", "35"],
			["20", "30", "60"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Add a column on expanded and keep it expanded", function(assert) {
	var data_old = [
		[new HierarchyItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0)],
		[new HierarchyItem(10), new HierarchySumItem(10)]];
	var data_new = [
		[new HierarchyItem(10), new HierarchySumItem(10), new HierarchySumItem(20)],
		[new HierarchyItem(10), new HierarchySumItem(50),  new HierarchySumItem(5)],
		[new HierarchyItem(20), new HierarchySumItem(20), new HierarchySumItem(10)],
		[new HierarchyItem(20), new HierarchySumItem(10), new HierarchySumItem(50)],
		[new HierarchyItem(20),  new HierarchySumItem(0),  new HierarchySumItem(0)],
		[new HierarchyItem(10),  new HierarchySumItem(0), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels_old = ["Data 1", "Data 3"];
	var items_labels_new = ["Data 1", "Data 2", "Data 3"];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels_old, data_old, num_hierarchy_columns, undefined);

	assert.ok(true, "Expand 10>");
	$table.find("tbody > tr .expand-button").eq(0).click();

	htable.addColumn(1, data_new, items_labels_new);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "60", "35"],
			[  "", "10", "20"],
			[  "", "50",  "5"],
			[  "",  "0", "10"],
			["20", "30", "60"]];
	checkContent(assert, real_content, expected_content);
});

QUnit.module("HierarchyTable:: columns with settings");

function HierarchySettingsItem(data, assert) {
	var self = this;
	self.data = data;
	var assert = assert;

	self.display = function() {
		var setting = self.getSettingValue("display");
		assert.notEqual(setting, undefined, "::display should never be called with uninitialized settings");
		
		if (setting == "d1") {
			return String(self.data);
		}
		else {
			return "~" + String(Math.floor(self.data % 100)) + "." + String(Math.floor(self.data/100));
		}
	};
	self.aggregate = function(other) {
		var setting = self.getSettingValue("aggregate");
		assert.notEqual(setting, undefined, "::aggregate should never be called with uninitialized settings");
		
		var agg = false;
		if (setting == "a1") { agg = self.data == other.data; }
		else { agg = Math.floor(self.data/100) == Math.floor(other.data/100); }

		if (agg) {
			return new HierarchySettingsItem(self.data + other.data, assert);
		}
		else {
			return undefined;
		}
	};
	self.compare = function(other) {
		var setting = self.getSettingValue("compare");
		assert.notEqual(setting, undefined, "::compare should never be called with uninitialized settings");
		if (setting == "c1") {
			return self.data < other.data ? -1 : (self.data > other.data ? 1 : 0);
		}
		else {
			var smod = self.data % 100;
			var omod = other.data % 100;
			var sfloor = Math.floor(self.data/100);
			var ofloor = Math.floor(other.data/100);
			return smod < omod ? -1 : (smod > omod ? 1
				: (sfloor < ofloor ? -1 : (sfloor > ofloor ? 1 : 0)))
		}
	};
}
HierarchySettingsItem.__SETTINGS__ = {
	aggregate: {
		label: 'Aggregate setting',
		default_value: 'a1',
		values: { a1: 'data itself', a2: 'floor(data/100)' },
	}, compare: {
		label: 'Compare setting',
		default_value: 'c1',
		values: { c1: 'data itself', c2: 'data%100 then floor(data/100)' },
	}, display: {
		label: 'Display setting',
		default_value: 'd1',
		values: { d1: 'data itself', d2: 'floor(data/100)' },
	}
};
HierarchySettingsItem.prototype = new HierarchyItem;

QUnit.test("One unique column with settings", function(assert) {
	var data = [
		[new HierarchyItem(10),  new HierarchySettingsItem(20, assert)],
		[new HierarchyItem(10),   new HierarchySettingsItem(5, assert)],
		[new HierarchyItem(20),  new HierarchySettingsItem(10, assert)],
		[new HierarchyItem(20),  new HierarchySettingsItem(50, assert)],
		[new HierarchyItem(20),   new HierarchySettingsItem(0, assert)],
		[new HierarchyItem(10),  new HierarchySettingsItem(10, assert)],
		[new HierarchyItem(30),   new HierarchySettingsItem(1, assert)],
		[new HierarchyItem(30), new HierarchySettingsItem(101, assert)]];

	var $table = $('#qunit-fixture > table').first();
	var items_columns = [
			new ColumnProperties("Data 1")
			, new ColumnProperties("Data 2")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("aggregate", "a2")
	];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_columns, data, num_hierarchy_columns, undefined);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "35"],
			["20", "60"],
			["30",   ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand line 3");
	$table.find("tbody > tr .expand-button").eq(2).click();
	assert.ok(true, "Expand line 2");
	$table.find("tbody > tr .expand-button").eq(1).click();
	assert.ok(true, "Expand line 1");
	$table.find("tbody > tr .expand-button").eq(0).click();
	assert.ok(true, "Add sort on column 2");
	$table.find("thead > tr > th").eq(1).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10", "35"],
			[  "",  "5"],
			[  "", "10"],
			[  "", "20"],
			["20", "60"],
			[  "",  "0"],
			[  "", "10"],
			[  "", "50"],
			["30",   ""],
			[  "",  "1"],
			[  "","101"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("One unique column with settings as hierarchy", function(assert) {
	var data = [
		[new HierarchySettingsItem(110, assert), new HierarchySumItem(20)],
		[ new HierarchySettingsItem(10, assert),  new HierarchySumItem(5)],
		[new HierarchySettingsItem(120, assert), new HierarchySumItem(10)],
		[new HierarchySettingsItem(120, assert), new HierarchySumItem(50)],
		[ new HierarchySettingsItem(20, assert),  new HierarchySumItem(0)],
		[ new HierarchySettingsItem(10, assert), new HierarchySumItem(10)]];

	var $table = $('#qunit-fixture > table').first();
	var items_columns = [
			new ColumnProperties("Data 1")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("compare", "c2")
			, new ColumnProperties("Data 2")
	];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_columns, data, num_hierarchy_columns, undefined);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			[ "10", "15"],
			["110", "20"],
			[ "20",  "0"],
			["120", "60"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Multiple columns sharing same class having settings", function(assert) {
	var data = [
		[new HierarchyItem(10),  new HierarchySettingsItem(20, assert),  new HierarchySettingsItem(20, assert)],
		[new HierarchyItem(10), new HierarchySettingsItem(105, assert), new HierarchySettingsItem(105, assert)],
		[new HierarchyItem(20), new HierarchySettingsItem(110, assert), new HierarchySettingsItem(110, assert)],
		[new HierarchyItem(20), new HierarchySettingsItem(150, assert), new HierarchySettingsItem(150, assert)],
		[new HierarchyItem(10),  new HierarchySettingsItem(10, assert),  new HierarchySettingsItem(10, assert)],
		[new HierarchyItem(30),   new HierarchySettingsItem(1, assert),   new HierarchySettingsItem(1, assert)],
		[new HierarchyItem(30), new HierarchySettingsItem(101, assert), new HierarchySettingsItem(101, assert)],
		[new HierarchyItem(40),   new HierarchySettingsItem(1, assert),   new HierarchySettingsItem(1, assert)],
		[new HierarchyItem(40),   new HierarchySettingsItem(1, assert),   new HierarchySettingsItem(1, assert)]];

	var $table = $('#qunit-fixture > table').first();
	var items_columns = [
			new ColumnProperties("Data 1")
			, new ColumnProperties("Data 2")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("aggregate", "a2")
				.withSettingValue("display", "d2")
			, new ColumnProperties("Data 3")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("compare", "c2")
	];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_columns, data, num_hierarchy_columns, undefined);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10",      "",   ""],
			["20", "~60.2",   ""],
			["30",      "",   ""],
			["40",  "~2.0",  "2"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand line 4");
	$table.find("tbody > tr .expand-button").eq(3).click();
	assert.ok(true, "Expand line 3");
	$table.find("tbody > tr .expand-button").eq(2).click();
	assert.ok(true, "Expand line 2");
	$table.find("tbody > tr .expand-button").eq(1).click();
	assert.ok(true, "Expand line 1");
	$table.find("tbody > tr .expand-button").eq(0).click();
	assert.ok(true, "Add sort on column 3");
	$table.find("thead > tr > th").eq(2).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10",      "",    ""],
			[  "",  "~5.1", "105"],
			[  "", "~10.0",  "10"],
			[  "", "~20.0",  "20"],
			["20", "~60.2",    ""],
			[  "", "~10.1", "110"],
			[  "", "~50.1", "150"],
			["30",      "",    ""],
			[  "",  "~1.0",   "1"],
			[  "",  "~1.1", "101"],
			["40",  "~2.0",   "2"],
			[  "",  "~1.0",   "1"],
			[  "",  "~1.0",   "1"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Remove one of the columns with settings", function(assert) {
	var data = [
		[new HierarchyItem(10),  new HierarchySettingsItem(20, assert),  new HierarchySettingsItem(20, assert)],
		[new HierarchyItem(10), new HierarchySettingsItem(105, assert), new HierarchySettingsItem(105, assert)],
		[new HierarchyItem(20), new HierarchySettingsItem(110, assert), new HierarchySettingsItem(110, assert)],
		[new HierarchyItem(20), new HierarchySettingsItem(150, assert), new HierarchySettingsItem(150, assert)],
		[new HierarchyItem(10),  new HierarchySettingsItem(10, assert),  new HierarchySettingsItem(10, assert)],
		[new HierarchyItem(30),   new HierarchySettingsItem(1, assert),   new HierarchySettingsItem(1, assert)],
		[new HierarchyItem(30), new HierarchySettingsItem(101, assert), new HierarchySettingsItem(101, assert)],
		[new HierarchyItem(40),   new HierarchySettingsItem(1, assert),   new HierarchySettingsItem(1, assert)],
		[new HierarchyItem(40),   new HierarchySettingsItem(1, assert),   new HierarchySettingsItem(1, assert)]];

	var $table = $('#qunit-fixture > table').first();
	var items_columns = [
			new ColumnProperties("Data 1")
			, new ColumnProperties("Data 2")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("aggregate", "a2")
				.withSettingValue("display", "d2")
			, new ColumnProperties("Data 3")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("compare", "c2")
	];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_columns, data, num_hierarchy_columns, undefined);
	htable.removeColumn(1);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10",  ""],
			["20",  ""],
			["30",  ""],
			["40", "2"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Remove one of the hierarchy columns with settings", function(assert) {
	var data = [
		[new HierarchySettingsItem(20, assert),   new HierarchySettingsItem(20, assert)],
		[new HierarchySettingsItem(105, assert), new HierarchySettingsItem(105, assert)],
		[new HierarchySettingsItem(110, assert), new HierarchySettingsItem(110, assert)],
		[new HierarchySettingsItem(150, assert), new HierarchySettingsItem(150, assert)],
		[new HierarchySettingsItem(10, assert),   new HierarchySettingsItem(10, assert)],
		[new HierarchySettingsItem(1, assert),     new HierarchySettingsItem(1, assert)],
		[new HierarchySettingsItem(101, assert), new HierarchySettingsItem(101, assert)],
		[new HierarchySettingsItem(1, assert),     new HierarchySettingsItem(1, assert)],
		[new HierarchySettingsItem(1, assert),     new HierarchySettingsItem(1, assert)]];

	var $table = $('#qunit-fixture > table').first();
	var items_columns = [
			new ColumnProperties("Data 1")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
			, new ColumnProperties("Data 2")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("compare", "c2")
				.withSettingValue("display", "d2")
	];
	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_columns, data, num_hierarchy_columns, undefined);
	
	assert.ok(true, "Add sort on column 2");
	$table.find("thead > tr > th").eq(1).click();
	
	assert.ok(true, "Remove column 1");
	htable.removeColumn(0);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [["~1.0"], ["~1.0"], ["~1.0"], ["~1.1"], ["~5.1"], ["~10.0"], ["~10.1"], ["~20.0"], ["~50.1"]];
	checkContent(assert, real_content, expected_content);
});
QUnit.test("Add a column with settings", function(assert) {
	var data_old = [
		[new HierarchyItem(10),  new HierarchySettingsItem(20, assert)],
		[new HierarchyItem(10),  new HierarchySettingsItem(20, assert)],
		[new HierarchyItem(20),  new HierarchySettingsItem(10, assert)],
		[new HierarchyItem(20),  new HierarchySettingsItem(50, assert)],
		[new HierarchyItem(30),   new HierarchySettingsItem(1, assert)],
		[new HierarchyItem(30), new HierarchySettingsItem(101, assert)]];

	var data_new = [
		[new HierarchyItem(10),  new HierarchySettingsItem(20, assert),  new HierarchySettingsItem(20, assert)],
		[new HierarchyItem(10),   new HierarchySettingsItem(5, assert),  new HierarchySettingsItem(20, assert)],
		[new HierarchyItem(20),  new HierarchySettingsItem(10, assert),  new HierarchySettingsItem(10, assert)],
		[new HierarchyItem(20),  new HierarchySettingsItem(50, assert),  new HierarchySettingsItem(50, assert)],
		[new HierarchyItem(30),   new HierarchySettingsItem(1, assert),   new HierarchySettingsItem(1, assert)],
		[new HierarchyItem(30), new HierarchySettingsItem(101, assert), new HierarchySettingsItem(101, assert)]];

	var $table = $('#qunit-fixture > table').first();
	var items_labels_old = [
			new ColumnProperties("Data 1")
			, new ColumnProperties("Data 2")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
	];

	var items_labels_new =[
			new ColumnProperties("Data 1")
			, new ColumnProperties("Data new")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("aggregate", "a2")
				.withSettingValue("display", "d2")
			, new ColumnProperties("Data 2")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
	];

	var num_hierarchy_columns = 1;
	var htable = new HierarchyTable($table, items_labels_old, data_old, num_hierarchy_columns, undefined);

	assert.ok(true, "Add column 1");
	htable.addColumn(1, data_new, items_labels_new);

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "~25.0", "40"],
			["20", "~60.0",   ""],
			["30",      "",   ""]];
	checkContent(assert, real_content, expected_content);
});

QUnit.test("Access settings with right click", function(assert) {
	var data = [
		[new HierarchyItem(10),  new HierarchySettingsItem(20, assert)],
		[new HierarchyItem(10),   new HierarchySettingsItem(5, assert)],
		[new HierarchyItem(20),  new HierarchySettingsItem(10, assert)],
		[new HierarchyItem(20),  new HierarchySettingsItem(50, assert)],
		[new HierarchyItem(20),   new HierarchySettingsItem(0, assert)],
		[new HierarchyItem(10),  new HierarchySettingsItem(10, assert)],
		[new HierarchyItem(30),   new HierarchySettingsItem(1, assert)],
		[new HierarchyItem(30), new HierarchySettingsItem(101, assert)]];

	var $table = $('#qunit-fixture > table').first();
	var items_columns = [
			new ColumnProperties("Data 1")
			, new ColumnProperties("Data 2")
				.withSettings(HierarchySettingsItem.__SETTINGS__)
				.withSettingValue("aggregate", "a2")
	];
	var num_hierarchy_columns = 1;
	var settingsChanged = {column_id: undefined, key: undefined};
	var htable = new HierarchyTable($table, items_columns, data, num_hierarchy_columns, undefined)
			.registerOnSettingsChange(function(column_id, key) {
				settingsChanged["column_id"] = column_id;
				settingsChanged["key"] = key;
				return false;
			});

	assert.ok(true, "Right click on header of column 2");
	$table.find("thead > tr > th").eq(1).contextmenu();
	
	assert.strictEqual($("ul.hierarchytable-contextmenu").length, 1, "Context menu has been triggered");

	var $lis_for_settings = $("ul.hierarchytable-contextmenu li.column-settings span.glyphicon-chevron-right").parent();
	assert.strictEqual($lis_for_settings.length, 3, "Column has 3 settings");
	for (var i = 0 ; i != $lis_for_settings.length ; ++i) {
		var $li = $lis_for_settings.eq(i);
		if ($li.find("span").eq(2).text() == "Display setting: data itself") {
			assert.ok(true, "Change setting associated to <Display>");
			$li.find("span.glyphicon-chevron-right").click();
			assert.equal($li.find("span").eq(2).text(), "Display setting: floor(data/100)", "Setting label is: floor(data/100)");
		}
	}

	assert.strictEqual(settingsChanged["column_id"], 1, "OnSettingChange callback called with column_id=1");
	assert.equal(settingsChanged["key"], "display", "OnSettingChange callback called with key=display");

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "~35.0"],
			["20", "~60.0"],
			["30",      ""]];
	checkContent(assert, real_content, expected_content);
});

QUnit.module("HierarchyNode::ColumnProperties");

QUnit.test("<constructor>", function(assert) {
	var properties = new ColumnProperties("My wonderful properties");
	assert.equal(properties.title(), "My wonderful properties", "Title correctly defined");
	assert.deepEqual(properties.settings(), {}, "No settings defined");
	assert.ok(!properties.isNoSettingsUpdate(), "Flag: No settings update correctly set");
	assert.ok(!properties.isTitleUpdate(), "Flag: Update title correctly set");
	assert.ok(!properties.hasSettings(), "Flag: Has settings correctly set");
});

QUnit.test("Trimmed title", function(assert) {
	var p1 = new ColumnProperties("    trim left with constructor");
	assert.equal(p1.title(), "trim left with constructor", "Trim left with constructor");

	var p2 = new ColumnProperties("trim right with constructor    ");
	assert.equal(p2.title(), "trim right with constructor", "Trim right with constructor");

	var p3 = new ColumnProperties("    trim both with constructor    ");
	assert.equal(p3.title(), "trim both with constructor", "Trim both with constructor");

	var p = new ColumnProperties("no trim");
	p.withTitle("    trim left with setter");
	assert.equal(p.title(), "trim left with setter", "Trim left with setter");

	p.withTitle("trim right with setter    ");
	assert.equal(p.title(), "trim right with setter", "Trim right with setter");

	p.withTitle("    trim both with setter    ");
	assert.equal(p.title(), "trim both with setter", "Trim both with setter");
});

QUnit.test("withSettings copies the settings", function(assert) {
	var properties = new ColumnProperties("My wonderful properties");
	var settings = {
		"setting1": {
			label: "label setting1",
			values: {"v1.1": "value of v1.1", "v1.3": "value of v1.3"},
			default_value: "v1.1"
		}, "setting2": {
			label: "label setting2",
			values: {"v2.1": "value of v2.1", "v2.2": "value of v2.2"},
			default_value: "v2.1"
		}, 
	};
	var settings_copy_original = {
		"setting1": {
			label: "label setting1",
			values: {"v1.1": "value of v1.1", "v1.3": "value of v1.3"},
			default_value: "v1.1"
		}, "setting2": {
			label: "label setting2",
			values: {"v2.1": "value of v2.1", "v2.2": "value of v2.2"},
			default_value: "v2.1"
		}, 
	};
	properties.withSettings(settings);

	settings["setting3"] = {
		label: "label setting3",
		values: {"v3.1": "value of v3.1", "v3.2": "value of v3.2"},
		default_value: "v3.1"
	};
	assert.deepEqual(properties.settings(), settings_copy_original, "Settings should not be altered");

	settings["setting1"]["values"]["v1.2"] = "value of v1.2";
	assert.deepEqual(properties.settings(), settings_copy_original, "Settings should not be altered");
});

QUnit.test("Check setting value", function(assert) {
	var properties = new ColumnProperties("My wonderful properties");
	var settings = {
		"setting1": {
			label: "label setting1",
			values: {"v1.1": "value of v1.1", "v1.3": "value of v1.3"},
			default_value: "v1.1"
		}, "setting2": {
			label: "label setting2",
			values: {"v2.1": "value of v2.1", "v2.2": "value of v2.2"},
			default_value: "v2.2"
		}, 
	};
	
	properties.withSettings(settings);

	assert.equal(properties.settingValue("setting1"), "v1.1", "Use 'default_value' key for the initial value of the setting");
	assert.equal(properties.settingValue("setting2"), "v2.2", "Use 'default_value' key for the initial value of the setting");
});

QUnit.test("Check export using toString", function(assert) {
	var properties = new ColumnProperties("My wonderful properties");
	var settings = {
		"setting1": {
			label: "label setting1",
			values: {"v1.1": "value of v1.1", "v1.3": "value of v1.3"},
			default_value: "v1.1"
		}, "setting2": {
			label: "label setting2",
			values: {"v2.1": "value of v2.1", "v2.2": "value of v2.2"},
			default_value: "v2.2"
		}, 
	};
	properties.withSettings(settings);

	assert.equal(properties.toString(), ":", "Only export modified values");
	properties.withSettingValue("setting2", "v2.1");
	assert.equal(properties.toString(), ":setting2=v2.1", "Only export modified values");
	properties.withSettingValue("setting2", "v2.2");
	properties.withSettingValue("setting1", "v1.3");
	assert.equal(properties.toString(), ":setting1=v1.3", "Only export modified values");
	properties.withTitle("My wonderful properties");
	assert.equal(properties.toString(), ":setting1=v1.3", "Only export modified values");
	properties.withTitle("My wonderful properties 2");
	assert.equal(properties.toString(), "My%20wonderful%20properties%202:setting1=v1.3", "Only export modified values");
	
	properties.withSettings(settings);
	properties.withTitle("My wonderful properties");
	properties.withSettingValue("setting1", "v1.3");

	var result = properties.toString(true);
	assert.ok(result == "My%20wonderful%20properties:setting1=v1.3;setting2=v2.2" || result == "My%20wonderful%20properties:setting2=v2.2;setting1=v1.3", "Export everything");
});

QUnit.test("Check import using fromString", function(assert) {
	var properties = new ColumnProperties("My wonderful properties");
	var settings = {
		"setting1": {
			label: "label setting1",
			values: {"v1.1": "value of v1.1", "v1.3": "value of v1.3"},
			default_value: "v1.1"
		}, "setting2": {
			label: "label setting2",
			values: {"v2.1": "value of v2.1", "v2.2": "value of v2.2"},
			default_value: "v2.2"
		}, 
	};
	properties.withSettings(settings).withSettingValue("setting2", "v2.1");

	properties.fromString(":");
	assert.equal(properties.title(), "My wonderful properties" , "Nothing should have been modified <title>");
	assert.equal(properties.settingValue("setting1"), "v1.1" , "Nothing should have been modified <setting1>");
	assert.equal(properties.settingValue("setting2"), "v2.1" , "Nothing should have been modified <setting2>");

	properties.fromString(":setting1=v1.3");
	assert.equal(properties.title(), "My wonderful properties" , "Only <setting1> has been modified <title>");
	assert.equal(properties.settingValue("setting1"), "v1.3" , "Only <setting1> has been modified <setting1>");
	assert.equal(properties.settingValue("setting2"), "v2.1" , "Only <setting1> has been modified <setting2>");

	properties.fromString("%20:setting1=v1.1;setting2=v2.2");
	assert.equal(properties.title(), "" , "Everything has been modified <title>");
	assert.equal(properties.settingValue("setting1"), "v1.1" , "Everything has been modified <setting1>");
	assert.equal(properties.settingValue("setting2"), "v2.2" , "Everything has been modified <setting2>");
});
