(function(exports) {

// a and b are instances of HierarchyItem (or derived)
// criteria is the order on which we should consider the column for the sort
Array.prototype.hierarchyTableSort = function(criteria) {
	this.sort(function(a, b) {
		for (var i = 0 ; i != criteria.length ; i++) {
			var column = criteria[i];
			var asc_mode = true;
			if (column < 0) {
				asc_mode = false;
				column = -column -1;
			}
			var aElt = a.at(column);
			var bElt = b.at(column);
			var comparison = 0;
			if (aElt === undefined) {
				if (bElt !== undefined) {
					comparison = -1;
				}
			} else if (bElt === undefined) {
				comparison = 1;
			} else {
				comparison = aElt.compare(bElt);
			}
			if (comparison != 0) {
				return asc_mode ? comparison : -comparison;
			}
		}
		return 0;
	});
};
Array.prototype.rclone = function() {
	if (this.length > 0 && this[0] instanceof Array) {
		var newArray = new Array();
		for (var i = 0 ; i != this.length ; i++) {
			newArray.push(this[i].rclone());
		}
		return newArray;
	}
	return this.slice(0);
};
Array.prototype.clone = function() {
	return this.slice(0);
};

Array.prototype.findAtLevel = function(row, level)
{
	var item = row.data[level];
	for (var i = 0 ; i != this.length ; i++)
	{
		var atLevel = this[i].data[level];
		if (this[i].level == level &&
				(atLevel == item || (atLevel.equals && atLevel.equals(item))))
		{
			return this[i];
		}
	}
	return undefined;
};

function HierarchyItem(data) {
	this.data = data;
	var _hierarchy = undefined;
	var _column_id = -1;
	
	// -1 means this < other
	//  1 means this > other
	//  0 means this = other
	// Other cases are not supported
	this.compare = function(other) {
		return this.data < other.data ? -1 : (this.data > other.data ? 1 : 0);
	};
	
	// Should be able to treat calls with undefined values
	this.equals = function(other) {
		if (other == undefined) {
			return false;
		}
		return this.compare(other) == 0;
	};
	
	// Return the string to diplay to represent this element
	this.display = function() {
		return String(this.data);
	};
	
	// Return the aggregated node result (HierarchyItem or derived)
	// of the combination of this and node
	// Keep in mind that you should have:
	//  a.aggregate(b) = b.aggregate(a) [symetric]
	//  a.aggregate(b.aggregate(c)) = a.aggregate(b).aggregate(c) [associative]
	this.aggregate = undefined; // function(other)

	// Return  the list of HierarchyItem between the current node and its root
	// (from root to node)
	this.getPathFromRoot = function() {
		return new Array(this);
	};

	// Called by the hierarchy table in order to mark its ownership
	this.register = function(hierarchy, column_id) {
		_hierarchy = hierarchy;
		_column_id = column_id;
	};

	// Return setting's value associated to the setting_key given as a parameter
	this.getSettingValue = function(setting_key) {
		return _hierarchy.getSettingValue(_column_id, setting_key);
	};
}

function HierarchyNode(data, _parent) {
	// this.data is an object instance
	// it can have a compare method, otherwise default < and > will be used to compare data
	this.data = data;
	//parent Node if it exists
	this._parent = _parent;
	// depth of the Node starting from the root
	this.depth = _parent ? _parent.depth +1 : 0;
	// List of children Node
	this.children = new Array();
	
	this.str = function() {
		if (this._parent) {
			return this._parent.str() + " > " + this.data;
		} else {
			return this.data;
		}
	};

	this.getPathFromRoot = function() {
		if (this._parent) {
			var list = this._parent.getPathFromRoot();
			list.push(this);
			return list;
		}
		return new Array(this);
	};

	// Compare two nodes
	this.compare = function(other) {
		if (other.depth < this.depth) {
			// Compare only when depth(this) <= depth(other)
			return -other.compare(this);
		}
		
		if (other.depth > this.depth) {
			// Navigate through other's parents while depth(other) != depth(this)
			var other_parents = other;
			while (other_parents.depth > this.depth) {
				other_parents = other_parents._parent;
			}
			if (this == other_parents) {
				// One of the ancestors of other is this
				// => this < other
				return -1;
			}
			// Ask to compare nodes at the same level (depth)
			return this.compare(other_parents);
		}

		if (this == other) {
			// Pure equality
			return 0;
		}

		if (this.depth > 0 && this._parent != other._parent) {
			// Nodes are:
			// - at the same depth
			// - different from each other
			// - different parents
			// Compare parents
			return this._parent.compare(other._parent);
		}

		return this.data.compare
				? this.data.compare(other.data)
				: this.defaultCompare(this.data, other.data);
	};
	
	// This method should be overrided if you want to use another operator
	// to compare this.data
	// YourWonderfulClass.prototype = new HierarchyNode;
	this.defaultCompare = function(a, b) {
		return a < b ? -1 : (a > b ? 1 : 0);
	};
}
HierarchyNode.prototype = new HierarchyItem;

function HierarchyList(children) {
	this.children = children;
	
	this.compare = function(other) {
		return 0;
	};
	
	this.equals = function(other) {
		return false;
	};
	
	this.display = function() {
		var aggregated_node = undefined;
		for (var i = 0 ; i != this.children.length ; i++) {
			if (i == 0) {
				aggregated_node = this.children[i].aggregate ? this.children[i] : undefined;
			} else {
				aggregated_node = aggregated_node.aggregate ? aggregated_node.aggregate(this.children[i]) : undefined;
			}
			if (aggregated_node === undefined) {
				break;
			}
		}
		return aggregated_node ? aggregated_node.display() : "";
	};
}
HierarchyList.prototype = new HierarchyItem;

function HierarchyRow(data, _parent, level, contextMenuCallbacks) {
	{
		if (HierarchyRow.last === undefined) {
			HierarchyRow.last = 0;
		} else {
			HierarchyRow.last++;
		}
	}
	var self = this;

	self.id = HierarchyRow.last;

	// Optionnal elt
	// Specify the corresponding reference in HierarchyTable's rows
	self.ref = undefined;

	// data is a list of HierarchyItem
	// data has as many items as the number of columns of its corresponding HierarchyTable
	self.data = data instanceof Array ? data : new Array();

	// _parent can be undefined or another HierarchyRow
	self._parent = _parent;
	
	// List of children automatically filled
	self.children = new Array();

	// Is the node collapsed?
	self.collapsed = true;

	// Level in the node hierarchy
	self.level = level !== undefined ? level : -1;
	
	// Thsi flag is set to true if two distinct sons imply the same HierarchyItem
	// for the computation of their aggregated value
	self.children_double_contribution = false;
	
	self.contextMenuCallbacks = contextMenuCallbacks !== undefined ? (contextMenuCallbacks instanceof Array ? contextMenuCallbacks : [{'callback': contextMenuCallbacks, 'label': 'N.A'}]) : undefined;
	
	self.setReference = function(reference)
	{
		self.ref = reference;
	};

	self.setDoubleContribution = function(double_contribution)
	{
		self.children_double_contribution = double_contribution;
	};
	
	// This method remove the data corresponding to the column column_id
	// It also removes children rows which are instances of column_id
	self.removeHierarchyColumn = function(column_id) {
		// Remove column column_id from data
		self.data.splice(column_id, 1);

		// Remove children instances of column_id
		// /!\ this.children can be of different levels
		var children_after_removal = new Array();
		for (var i = 0 ; i != self.children.length ; i++)
		{
			self.children[i].removeHierarchyColumn(column_id);
			if (self.children[i].level == column_id)
			{
				for (var j = 0 ; j != self.children[i].children.length ; j++)
				{
					if (self.children[i].children[j].level > column_id)
					{
						self.children[i].children[j].level--;
					}
					self.children[i].children[j]._parent = self;

					// Aggregate lines together when it is possible
					var found = self.children[i].children[j].level >= 0
							? children_after_removal.findAtLevel(self.children[i].children[j], self.children[i].children[j].level)
							: undefined;
					if (found === undefined)
					{
						children_after_removal.push(self.children[i].children[j]);
					}
					else
					{
						found.children.concat(self.children[i].children[j].children);
					}
				}
			}
			else
			{
				if (self.children[i].level > column_id)
				{
					self.children[i].level--;
				}
				children_after_removal.push(self.children[i]);
			}
		}
		self.children = children_after_removal;
	};

	self.removeColumn = function(column_id) {
		self.data.splice(column_id, 1);
		for (var i = 0 ; i != self.children.length ; i++) {
			self.children[i].removeColumn(column_id);
		}
	};

	self.addColumn = function(item, column_id) {
		// Append the column to the current element
		self.data.splice(column_id, 0, item);
		// and to its parent if it has never been done before
		if (self._parent !== undefined && self._parent.data.length != self.data.length) {
			self._parent.addColumn(undefined, column_id);
		}
	};
	
	// Append a child to the HierarchyRow
	// Children are of type HierarchyRow
	self.append = function(child) {
		self.children.push(child);
	};

	self.at = function(index) {
		return self.data[index];
	};
	
	// Sort children nodes
	self.sort = function(criteria) {
		// Sort immediate children
		self.children.hierarchyTableSort(criteria);

		// Recursively sort others
		for (var i = 0 ; i != self.children.length ; i++) {
			self.children[i].sort(criteria);
		}
	};
	
	self.isAggregatedRow = function() {
		return self.children.length != 0;
	};

	self.computeNumParents = function() {
		if (self._parent === undefined) {
			return 0;
		}
		return 1 + self._parent.computeNumParents();
	};

	self.lookfor = function(id) {
		if (self.id === id) {
			return self;
		}
		
		for (var i = 0 ; i != self.children.length ; i++) {
			var found = self.children[i].lookfor(id);
			if (found !== undefined) {
				return found;
			}
		}
		return undefined;
	};

	self.lookforImmediate = function(items) {
		for (var i = 0 ; i != self.children.length ; i++) {
			var equal = true;
			for (var j = 0 ; j != items.length && equal ; j++) {
				var cdata = self.children[i].data[j];
				if (cdata === undefined) {
					equal = items[j] === undefined;
				} else {
					equal = cdata.equals(items[j]);
				}
			}
			if (equal) {
				return self.children[i];
			}
		}
		return undefined;
	};

	self.appendData = function(children_data) {
		if (self.isAggregatedRow()) {
			for (var i = 0 ; i < self.children.length ; ++i) {
				self.children[i].appendData(children_data);
			}
		}
		else {
			children_data.push(self.data.slice());
		}
	};

	var addTriggerContextMenu = function($row) {
		var children_data = new Array();
		self.appendData(children_data);
		
		$row.on("contextmenu", function(event) {
				event.preventDefault();
				var callbacks = self.contextMenuCallbacks;
				if (callbacks !== undefined) {
					var $contextmenu = $("ul.hierarchytable-contextmenu");
					if ($contextmenu.length == 0) {
						$contextmenu = $("<ul/>");
						$contextmenu.addClass("hierarchytable-contextmenu");
					}
					else {
						$contextmenu.html("");
					}

					for (var i = 0 ; i < callbacks.length ; ++i) {
						var $menuitem = $("<li/>")
						if (callbacks[i]['safeLabel'] !== undefined) {
							$menuitem.html(callbacks[i]['safeLabel']);
						}
						else {
							$menuitem.text(callbacks[i]['label']);
						}
						$menuitem.click(
								(function(callback, data) {
									return function() {
										callback(data);
										$contextmenu.hide(100);
									};
								})(callbacks[i]['callback'], children_data));
						$contextmenu.append($menuitem);
					}
					$("body").append($contextmenu);
					$contextmenu.finish()
							.toggle(100)
							.css({
								top: event.pageY + "px"
								, left: event.pageX + "px"
							});
				}
				return false;
		});
	};

	// Add rows into a tbody element
	self.display = function($tbody, numNodes, hierarchytable) {		
		var $row = $("<tr/>");
		var is_aggregated = self.isAggregatedRow();

		// If the table defines an hierarchy column (ie. numNodes > 0)
		// Then it has to add a <td/> for this column
		if (numNodes > 0) {
			var $value = $("<td/>");
			$value.attr("colspan", numNodes);
			$value.css("padding-left", String(20*self.computeNumParents()) + "px");

			var $icon = $("<span/>");
			var $title = $("<span/>");

			// The row being displayed has multiple children (at least one, so part of the hierarchy and not a basic output)
			if (is_aggregated) {
				var last_filled = undefined;
				for (var i = numNodes -1 ; i >= 0 ; i--) {
					if (self.data[i] !== undefined) {
						last_filled = self.data[i];
						break;
					}
				}

				$icon.addClass("expand-button");
				$icon.addClass(self.collapsed ? "collapsed" : "expanded");
				$icon.click(
						(function(id) {
							return function() { hierarchytable._onCollapseExpand(id); };
						})(self.id));

				if (last_filled !== undefined) {
					if (last_filled.displaySafe !== undefined) {
						$title.html(last_filled.displaySafe());
					} else {
						$title.text(last_filled.display());
					}
				}
			}
			else {
				$icon.addClass("expanded");
			}
			$value.append($icon);
			$value.append($title);
			$row.append($value);
		}
		
		for (var i = numNodes ; i < self.data.length ; i++) {
			var $value = $("<td/>");
			if (self.data[i] !== undefined) {
				if (is_aggregated) {
					$value.addClass("aggregated");
				}
				if (self.data[i].displaySafe !== undefined) {
					$value.html(self.data[i].displaySafe());
				} else {
					$value.text(self.data[i].display());
				}
			}
			$row.append($value);
		}
		addTriggerContextMenu($row);
		$tbody.append($row);

		if (! self.collapsed) {
			// Recursively display children
			for (var i = 0 ; i != self.children.length ; i++) {
				self.children[i].display($tbody, numNodes, hierarchytable);
			}
		}
	};
	
	// Compute aggregated value
	self.compute = function(numNodes, specific_column) {
		if (! self.isAggregatedRow()) {
			return;
		}

		for (var i = 0 ; i != self.children.length ; i++) {
			self.children[i].compute(numNodes, specific_column);
		}
		// If the children implies double-contribution
		//   take the leaves has elementaryu contributions
		// Otherwise immediate children are ok
		var base_elts = self.children_double_contribution ? self.retrieveLeaves() : self.children;
		for (var i = numNodes ; i < self.data.length ; i++) {
			if (specific_column !== undefined && i != specific_column) {
				continue; // only compute the column specific_column
			}
			var aggregated = undefined;
			for (var j = 0 ; j != base_elts.length ; j++) {
				if (base_elts[j] === undefined || base_elts[j].data[i] === undefined) {
					aggregated = undefined;
					break;
				} else if (j == 0) {
					aggregated = base_elts[j].data[i].aggregate ? base_elts[j].data[i] : undefined;
				} else { // we know that .aggregate is defined
					aggregated = base_elts[j].data[i].aggregate(aggregated);
				}
				if (aggregated === undefined) {
					break;
				}
			}
			self.data[i] = aggregated;
		}		
	};

	self.getChildren = function() {
		return self.children;
	};
	
	// Compute the list of leaves that contribute to the row
	// each row is unique
	self.retrieveLeaves = function() {
		if (self.children.length == 0)
		{
			return new Array(self);
		}

		var references = new Array();
		var leaves = new Array();
		for (var i = 0 ; i != self.children.length ; i++)
		{
			var subleaves = self.children[i].retrieveLeaves();
			for (var j = 0 ; j != subleaves.length ; j++) {
				if (subleaves[j].ref === undefined || $.inArray(subleaves[j].ref, references) == -1)
				{
					references.push(subleaves[j].ref);
					leaves.push(subleaves[j]);
				}
			}
		}
		return leaves;
	};

	self.getPathFromRoot = function()
	{
		if (self._parent === undefined)
		{
			return new Array(self);
		}
		var path = self._parent.getPathFromRoot();
		path.push(self);
		return path;
	};

	self.register = function(hierarchy) {
		// register itself
		for (var i = 0 ; i != self.data.length ; ++i) {
			var tmp_data = self.data[i];
			if (tmp_data !== undefined) {
				tmp_data.register(hierarchy, i);
			}
		}

		// register its children
		for (var i = 0 ; i != self.children.length ; ++i) {
			self.children[i].register(hierarchy);
		}
	};

	{
		if (self._parent !== undefined) {
			self._parent.append(self);
		}
	}
}

// Hide contextmenu on click elsewhere in the screen
$(document).bind("mousedown", function (e) {
// Not in the menu
	if (!$(e.target).parents("ul.hierarchytable-contextmenu").length > 0) {
		$("ul.hierarchytable-contextmenu").hide(100);
	}
});

function __cloneObject(o) {
	var o2 = {};
	var keys = Object.keys(o);
	for (var i = 0 ; i != keys.length ; ++i) {
		var key = keys[i];
		o2[key] = o[key];
	}
	return o2;
}

function ColumnProperties(title) {
	var self = this;

	var _title = title;
	var _settings = {};
	var _settings_value = {};
	var _no_settings_update = false;

	self.title = function() { return _title; }
	self.settings = function() { return _settings; };
	self.settingValue = function(key) { return _settings_value[key]; };

	self.isNoSettingsUpdate = function() { return _no_settings_update; };
	self.hasSettings = function() { return Object.keys(_settings).length > 0; };

	self.withNoSettingsUpdate = function(value) {
		if (value === false) {
			_no_settings_update = false;
		}
		else {
			_no_settings_update = true;
		}
		return self;
	};
	self.withSettingValue = function(key, value) {
		_settings_value[key] = value;
		return self;
	};

	// Clone the settings, only holds a copy
	self.withSettings = function(settings) {
		_settings = {};
		_settings_value = {};

		var keys = Object.keys(settings);
		for (var i = 0 ; i != keys.length ; ++i) {
			var key = keys[i];
			var setting = settings[key];
			_settings[key] = {
					label: setting['label'],
					values: __cloneObject(setting['values'])
			};
			_settings_value[key] = setting['default_value'];
		}
		return self;
	};
}

// For backward compatibility
// list of properties was initially a list of titles
var __sanitizeProperties = function(raw) {
	if (raw.length == 0) { return raw; }
	if (raw[0] instanceof ColumnProperties) { return raw };

	console.warn("[HierarchyTable::depreciated] List of titles have been replaced by list of properties");
	var properties = new Array();
	for (var i = 0 ; i != raw.length ; ++i) {
		properties.push(new ColumnProperties(raw[i]));
	}
	return properties;
}

function HierarchyTable($table, properties, rows, numHierarchyColumns, contextMenuCallbacks) {
	var self = this;
	
	// jQuery element corresponding to a HTML <table/>
	var $_table = $table;
	
	// Internal structure holding parameters related to a column
	// They are shared with the caller (in case they are given as an array of ColumnProperties)
	// If the caller, modify one of the ColumnProperties in the array it must refresh table display
	// It can be useful in case, multiple tables share the same columns schemas
	// - title
	// - settings (possible choices) and their values
	var _columns_properties = __sanitizeProperties(properties);

	// 2-dimension array
	// _rows[x]   : row containing several values
	// _rows[x][y]: value itself (instanceof HierarchyItem)
	// The order of this array can change from time to time due to reorderings
	var _rows = rows;
	var _internal_rows = new Array();
	
	// List of sort criteria
	// by default: order on first column
	var _sortCriteria = [0];
	
	// Number of columns that will consider to aggregate data
	var _num_aggregation_columns = numHierarchyColumns;

	var _row_contextmenu = contextMenuCallbacks;
	var _onReorder = undefined;
	var _onSettingsChange = undefined;

	// HierarchyRow
	var _main_hierarchy_row = new HierarchyRow(undefined, undefined, undefined, _row_contextmenu);
	
	// @private
	// Build one hierarchy column
	// - item: HierarchyItem
	// - items
	// - parentRows: list of HierarchyRow
	// Add item to the parentRows
	// Return updated parentRows
	self._buildOneColumn = function(item, column_id, items, parentRows) {
		var path_from_root = item.getPathFromRoot();
		for (var i = 0 ; i != path_from_root.length ; i++) {
			var node = path_from_root[i];
			for (var j = 0 ; j != items.length ; j++) {
				items[j][column_id] = node;
				var found = parentRows[j].lookforImmediate(items[j]);
				if (found === undefined) {
					found = new HierarchyRow(items[j].clone(), parentRows[j], column_id, _row_contextmenu);
				}
				parentRows[j] = found;
			}
		}
	};

	// @private
	// Build hierarchy columns (if necessary) for a given row
	self._buildColumns = function(row) {
		// Create parent rows if necessary
		var parentRows = new Array(_main_hierarchy_row);
		var items = new Array(new Array());
		items[0][row.length -1] = undefined;
		for (var j = 0 ; j != _num_aggregation_columns ; j++) {
			if (row[j] instanceof HierarchyList) {
				var nextParentRows = new Array();
				var nextItems = new Array();
				for (var k = 0 ; k != row[j].children.length ; k++) {
					var clonedParentRows = parentRows.clone();
					var clonedItems = items.rclone();
					self._buildOneColumn(row[j].children[k], j, clonedItems, clonedParentRows);
					for (var l = 0 ; l != clonedItems.length ; l++) {
						nextParentRows.push(clonedParentRows[l]);
						nextItems.push(clonedItems[l].clone());
					}
				}
				parentRows = nextParentRows;
				items = nextItems;
			} else {
				self._buildOneColumn(row[j], j, items, parentRows);
			}
		}
		return parentRows;
	};

	// @private
	// Callback called when performing a collapse/expand action
	// on a row of the table
	self._onCollapseExpand = function(rowIdInt) {
		var hRow = undefined;
		var mainRows = _main_hierarchy_row.getChildren();
		for (var i = 0 ; i != mainRows.length && hRow === undefined ; i++) {
			hRow = mainRows[i].lookfor(rowIdInt);
		}
		if (hRow !== undefined) {
			hRow.collapsed = ! hRow.collapsed;
			self._display();
		}
	};
	
	// @private
	// Method switching the reordering of a column to its next value
	self._changeReorder = function(key) {
		// Check if we already order on this key
		var sortKey = -1;
		for (var i = 0 ; i != _sortCriteria.length ; i++) {
			if (key == _sortCriteria[i] || key == -_sortCriteria[i] -1) {
				sortKey = i;
				break;
			}
		}

		if (sortKey == -1) {
			sortKey = _sortCriteria.length;
			_sortCriteria.push(key);
		} else {
			if (key == _sortCriteria[sortKey]) {
				_sortCriteria[sortKey] = -key -1;
			} else {
				_sortCriteria.splice(sortKey, 1);
			}
		}

		if (_onReorder !== undefined) {
			_onReorder(key, _sortCriteria);
		}
		self._display();
	};

	// @private
	// Callback called when clicking on the label of a column
	// Triggers a reordering of a table
	self._onClickReorder = function() {
		var th = this;	
		var $ths = $_table.find("> thead > tr > th");
		for (var i = 0 ; i != $ths.length ; i++) {
			if (th == $ths[i]) {
				return self._changeReorder(i);
			}
		}
	};
	
	// @private
	// Should only be called once (by the constructor)
	// It builds the HierarchyRow necessary for the display and sort
	self._build = function() {
		// Build the hierarchy based on _rows
		_main_hierarchy_row = new HierarchyRow(undefined, undefined, undefined, _row_contextmenu);
		_internal_rows = new Array();
		for (var i = 0 ; i != _rows.length ; i++) {
			var relatedRows = new Array();
			var parentRows = self._buildColumns(_rows[i]);
			
			// Treat the case of double-contributions
			for (var j = 0 ; j < parentRows.length ; j++)
			{
				for (var k = j+1 ; k < parentRows.length ; k++)
				{
					var path1 = parentRows[j].getPathFromRoot();
					var path2 = parentRows[k].getPathFromRoot();
					var length = Math.min(path1.length, path2.length);
					var last_common_not_included = 0;
					while (last_common_not_included < length && path1[last_common_not_included] == path2[last_common_not_included])
					{
						last_common_not_included++;
					}
					if (last_common_not_included > 1) // >1 because of _main_hierarchy_row
					{
						path1[last_common_not_included -1].setDoubleContribution(true);
					}
				}
			}

			// Create the row associated to our element
			var items = new Array();
			items[_rows[0].length -1] = undefined;
			for (var k = 0 ; k != parentRows.length ; k++) {
				for (var j = 0 ; j < _rows[i].length ; j++) {
					items[j] = _rows[i][j];
				}
				var itemRow = new HierarchyRow(items.clone(), parentRows[k], undefined, _row_contextmenu);
				itemRow.setReference(i);
				relatedRows.push(itemRow);
			}
			_internal_rows.push(relatedRows);
		}
		_main_hierarchy_row.register(self);

		// Compute aggregated values
		var mainRows = _main_hierarchy_row.getChildren();
		for (var i = 0 ; i != mainRows.length ; i++) {
			mainRows[i].compute(_num_aggregation_columns);
		}
	};

	// @private
	self._display = function() {
		_main_hierarchy_row.sort(_sortCriteria);
		$_table.children().remove();
		
		var $thead = $("<thead/>");
		var $titles = $("<tr/>");
		for (var i = 0 ; i != _columns_properties.length ; i++) {
			var $title = $("<th/>");
			var column_properties = _columns_properties[i];
			$title.click(self._onClickReorder);
			if (column_properties.hasSettings() || (_row_contextmenu !== undefined && _row_contextmenu.length > 0)) {
				$title.on("contextmenu", 
					(function(properties, column_id) {
						return function(event) {
							event.preventDefault();
							
							var $contextmenu = $("ul.hierarchytable-contextmenu");
							if ($contextmenu.length == 0) {
								$contextmenu = $("<ul/>");
								$contextmenu.addClass("hierarchytable-contextmenu");
							}
							else {
								$contextmenu.html("");
							}

							var settings = properties.settings();
							var column_settings_keys = Object.keys(settings);
							for (var i = 0 ; i < column_settings_keys.length ; ++i) {
								var key = column_settings_keys[i];
								var setting = settings[key];

								var $menuitem = $("<li/>");
								$menuitem.addClass("column-settings");
								var $menuitem_span = $("<span/>");
								$menuitem_span.text(setting['label'] + ": " + setting['values'][properties.settingValue(key)]);
								
								var $menuitem_next = $("<span/>");
								$menuitem_next.addClass("glyphicon glyphicon-chevron-right");
								var $menuitem_previous = $("<span/>");
								$menuitem_previous.addClass("glyphicon glyphicon-chevron-left");

								if (properties.isNoSettingsUpdate()) {
									$menuitem.attr("disabled", "");
								}
								else {
									$menuitem_next.click(
											(function(properties, key, $menuitem_span, column_id) {
												return function() {
													var setting = properties.settings()[key];
													var values = Object.keys(setting['values']);
													var idx = values.indexOf(properties.settingValue(key));
													if (idx !== -1) {
														var new_value = values[(idx +1) % values.length];
														properties.withSettingValue(key, new_value);
														$menuitem_span.text(setting['label'] + ": " + setting['values'][new_value]);
														if (_onSettingsChange === undefined || ! _onSettingsChange(column_id, key)) {
															self._build();
															self._display();
														}
													}
												};
											})(properties, key, $menuitem_span, column_id));
									$menuitem_previous.click(
											(function(properties, key, $menuitem_span, column_id) {
												return function() {
													var setting = properties.settings()[key];
													var values = Object.keys(setting['values']);
													var idx = values.indexOf(properties.settingValue(key));
													if (idx !== -1) {
														var new_value = values[(idx +values.length -1) % values.length];
														properties.withSettingValue(key, new_value);
														$menuitem_span.text(setting['label'] + ": " + setting['values'][new_value]);
														if (_onSettingsChange === undefined || ! _onSettingsChange(column_id, key)) {
															self._build();
															self._display();
														}
													}
												};
											})(properties, key, $menuitem_span, column_id));
								}
								$menuitem.append($menuitem_previous);
								$menuitem.append($menuitem_next);
								$menuitem.append($menuitem_span);
								$contextmenu.append($menuitem);
							}

							if (_row_contextmenu !== undefined && _row_contextmenu.length > 0) {
								if (properties.hasSettings()) {
									var $menuitem = $("<li/>");
									$menuitem.addClass("separator");
									$contextmenu.append($menuitem);
								}
								for (var i = 0 ; i < _row_contextmenu.length ; ++i) {
									var $menuitem = $("<li/>");
									if (_row_contextmenu[i]['safeLabel'] !== undefined) {
										$menuitem.html(_row_contextmenu[i]['safeLabel']);
									}
									else {
										$menuitem.text(_row_contextmenu[i]['label']);
									}
									$menuitem.click(
											(function(callback, row) {
												return function() {
													var children_data = new Array();
													row.appendData(children_data);
													callback(children_data);
													$contextmenu.hide(100);
												};
											})(_row_contextmenu[i]['callback'], _main_hierarchy_row));
									$contextmenu.append($menuitem);
								}
							}

							$("body").append($contextmenu);
							$contextmenu.finish()
									.toggle(100)
									.css({
										top: event.pageY + "px"
										, left: event.pageX + "px"
									});
							return false;
						}
					}(column_properties, i)
				));
			}
			else {
				$title.on("contextmenu", function(event) { event.preventDefault(); return false; });
			}
			var $title_text = $("<span/>");
			$title_text.text(_columns_properties[i].title());
			$title.append($title_text);
			$titles.append($title);
		}
		for (var i = 0 ; i != _sortCriteria.length ; i++) {
			var $title_text = undefined;
			if (_sortCriteria[i] >= 0) {
				$title_text = $($titles.first().children()[_sortCriteria[i]]).children();
				$title_text.addClass("hierarchy-asc");
			} else {
				$title_text = $($titles.first().children()[-_sortCriteria[i]-1]).children();
				$title_text.addClass("hierarchy-desc");
			}
			if (_sortCriteria.length > 1) {
				var $title_order = $("<div/>");
				$title_order.addClass("hierarchy-order");
				$title_order.text(i+1);
				$title_text.parent().append($title_order);
			}
		}
		$thead.append($titles);
		$_table.append($thead);
		
		var $tbody = $("<tbody/>");
		var mainRows = _main_hierarchy_row.getChildren();
		for (var i = 0 ; i != mainRows.length ; i++) {
			mainRows[i].display($tbody, _num_aggregation_columns, self);
		}
		$_table.append($tbody);
	};

	/** Force a full refresh of the display **/

	self.refresh = function() {
		self._build();
		self._display();
	};

	/** Modification of an existing table **/
	/** Keeping the same content, just adding or removing columns (not rows) **/
	
	// Remove a column from the table given its position
	// Both "hierarchy columns" and "normal columns" can be removed with this method
	self.removeColumn = function(column_id) {
		if (column_id < _num_aggregation_columns) {
			--_num_aggregation_columns;
			_main_hierarchy_row.removeHierarchyColumn(column_id);
		} else {
			_main_hierarchy_row.removeColumn(column_id);
		}
		_columns_properties.splice(column_id, 1);
		self._display();
	};
	
	// Append a normal column to the table
	// the full table need to be passed in new_rows parameter
	self.addColumn = function(column_id, new_rows, new_properties) {
		// Add the column
		_rows = new_rows; // _rows is a copy by pointer /!\
		_columns_properties = __sanitizeProperties(new_properties);
		for (var i = 0 ; i != _rows.length ; i++) {
			for (var j = 0 ; j != _internal_rows[i].length ; j++) {
				_internal_rows[i][j].addColumn(_rows[i][column_id], column_id);
			}
		}
		_main_hierarchy_row.register(self);
		
		// Compute new aggregated values
		var mainRows = _main_hierarchy_row.getChildren();
		for (var i = 0 ; i != mainRows.length ; i++) {
			mainRows[i].compute(_num_aggregation_columns, column_id);
		}
		self._display();
	};
	
	self.addHierarchyColumn = function(column_id, new_rows, new_properties) {
		if (column_id > _num_aggregation_columns) {
			console.warning("Invalid call to HierarchyTable::addHierarchyColumn");
		}
		++_num_aggregation_columns;
		_rows = new_rows;
		_columns_properties = __sanitizeProperties(new_properties);

		self._build();
		self._display();
	};

	/** Callback registration **/

	self.registerOnReorderCallback = function(callback) {
		_onReorder = callback;
		return self;
	};

	// Callback will be called just after the update of settings
	// It receives: column_id, key (impacted settings)
	// and should return a boolean: true means that no rebuild and display update is required as everything has been done by the callback
	self.registerOnSettingsChange = function(callback) {
		_onSettingsChange = callback;
		return self;
	};

	/** Accessors **/

	self.getSettings = function(column_id) { return _columns_properties[column_id].settings(); };
	self.getSettingValue = function(column_id, key) { return _columns_properties[column_id].settingValue(key); };
	self.getSortCriteria = function() { return _sortCriteria; };
	
	self.sort = function(criteria) {
		_sortCriteria = criteria.slice();
		self.refresh();
	};

	{
		self._build();
		self._display();
	}
}

exports.HierarchyItem = HierarchyItem;
exports.HierarchyNode = HierarchyNode;
exports.HierarchyList = HierarchyList;
exports.ColumnProperties = ColumnProperties;
exports.HierarchyTable = HierarchyTable;

}(typeof exports === 'undefined'
		? (this['JsTools'] === undefined ? this['JsTools']={} : this['JsTools'])
		: exports));

var HierarchyItem = JsTools.HierarchyItem;
var HierarchyNode = JsTools.HierarchyNode;
var HierarchyList = JsTools.HierarchyList;
var ColumnProperties = JsTools.ColumnProperties;
var HierarchyTable = JsTools.HierarchyTable;
