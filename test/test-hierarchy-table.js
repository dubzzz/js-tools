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

function retrieveHierarchyTableContent($table_lines) {
	var real_content = new Array();
	for (var i = 0 ; i != $table_lines.length ; ++i) {
		var line = new Array();
		var $line_tds = $($table_lines[i]).find("td");
		for (var j = 0 ; j != $line_tds.length ; ++j) {
			var $td = $($line_tds[j]);
			if ($td.find(".expand-button").length > 0) { // aggreagated
				line.push($($td.find("span")[1]).text());
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

	var $table_headers = $table.find("thead > tr > th > a");
	assert.strictEqual($table_headers.length, 2, "Two-column table");
	assert.strictEqual($($table_headers[0]).text(), "Data 1", "First column is: Data 1");
	assert.strictEqual($($table_headers[1]).text(), "Data 2", "Second column is: Data 2");
	assert.strictEqual($($table_headers[0]).hasClass("hierarchy-asc"), true, "Ascending ordering on first column");
	assert.strictEqual($($table_headers[0]).hasClass("hierarchy-desc"), false, "No descending ordering on first column");
	assert.strictEqual($($table_headers[1]).hasClass("hierarchy-asc")
			|| $($table_headers[1]).hasClass("hierarchy-desc"), false, "No ordering on second column");

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
	$($table.find("tbody > tr .expand-button")[0]).click();
	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10"      , ""],
			[      "10", ""],
			[       "0", ""],
			["20"      , ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand 10>0>");
	$($table.find("tbody > tr .expand-button")[2]).click();
	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["10"      ,  ""],
			[      "10",  ""],
			[       "0",  ""],
			[        "", "6"],
			["20"      ,  ""]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Expand 20>");
	$($table.find("tbody > tr .expand-button")[3]).click();
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
	$($table.find("tbody > tr .expand-button")[0]).click();
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

	var $table1 = $($('#qunit-fixture > table')[0]);
	var $table2 = $($('#qunit-fixture > table')[1]);
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
	$($table2.find("tbody > tr .expand-button")[0]).click();

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

	var $table1 = $($('#qunit-fixture > table')[0]);
	var $table2 = $($('#qunit-fixture > table')[1]);
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
	$($table2.find("tbody > tr .expand-button")[0]).click();

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
	$($table.find("thead > tr > th > a")[0]).click();

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
	$($table.find("thead > tr > th > a")[0]).click();

	assert.ok(true, "Expand 20>");
	$($table.find("tbody > tr .expand-button")[0]).click();

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
	$($table.find("thead > tr > th > a")[0]).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["20", "30"],
			["10", "60"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Cancel sort on column 1");
	$($table.find("thead > tr > th > a")[0]).click();

	assert.ok(true, "Sort on column 2");
	$($table.find("thead > tr > th > a")[1]).click();

	real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	expected_content = [
			["20", "30"],
			["10", "60"]];
	checkContent(assert, real_content, expected_content);

	assert.ok(true, "Reverse sort on column 2");
	$($table.find("thead > tr > th > a")[1]).click();

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
	$($table.find("tbody > tr .expand-button")[1]).click();
	assert.ok(true, "Expand 10>");
	$($table.find("tbody > tr .expand-button")[0]).click();

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
	$($table.find("thead > tr > th > a")[2]).click();

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
	$($table.find("thead > tr > th > a")[0]).click();

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
	$($table.find("thead > tr > th > a")[0]).click();

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
	htable.display();

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
	$($table.find("tbody > tr .expand-button")[1]).click();
	assert.ok(true, "Expand 10>");
	$($table.find("tbody > tr .expand-button")[0]).click();

	htable.removeColumn(1);
	htable.display();

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
	htable.display();

	assert.ok(true, "Expand 20>");
	$($table.find("tbody > tr .expand-button")[1]).click();
	assert.ok(true, "Expand 10>");
	$($table.find("tbody > tr .expand-button")[0]).click();

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
	htable.display();

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
	$($table.find("tbody > tr .expand-button")[0]).click();
	assert.ok(true, "Expand 10>10>");
	$($table.find("tbody > tr .expand-button")[1]).click();
	assert.ok(true, "Expand 10>10>10>");
	$($table.find("tbody > tr .expand-button")[2]).click();

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	console.log(real_content);
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
	htable.display();

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
	htable.display();

	assert.ok(true, "Expand 20>");
	$($table.find("tbody > tr .expand-button")[1]).click();
	assert.ok(true, "Expand 10>");
	$($table.find("tbody > tr .expand-button")[0]).click();

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
	htable.display();

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
	$($table.find("tbody > tr .expand-button")[0]).click();

	htable.addColumn(1, data_new, items_labels_new);
	htable.display();

	var real_content = retrieveHierarchyTableContent($table.find("tbody > tr"));
	var expected_content = [
			["10", "60", "35"],
			[  "", "10", "20"],
			[  "", "50",  "5"],
			[  "",  "0", "10"],
			["20", "30", "60"]];
	checkContent(assert, real_content, expected_content);
});
