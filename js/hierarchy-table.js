// a and b are instances of HierarchyItem (or derived)
// criteria is the order on which we should consider the column for the sort
Array.prototype.hierarchyTableSort = function(criteria) {
	this.sort(function(a, b) {
		for (var i = 0 ; i != criteria.length ; i++) {
			var column = criteria[i];
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
				return comparison;
			}
		}
		return 0;
	});
};
Array.prototype.clone = function() {
	return this.slice(0);
};

function HierarchyItem(data) {
	this.data = data;
	this.hierarchyRow = undefined;
	
	// -1 means this < other
	//  1 means this > other
	//  0 means this = other
	// Other cases are not supported
	this.compare = function(other) {
		return this.data < other.data ? -1 : (this.data > other.data ? 1 : 0);
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

function HierarchyRow(data, _parent, aggregatedRow) {
	// data is a list of HierarchyItem
	// data has as many items as the number of columns of its corresponding HierarchyTable
	this.data = data;

	// _parent can be undefined or another HierarchyRow
	this._parent = _parent;
	
	// List of children automatically filled
	this.children = new Array();

	// Append a child to the HierarchyRow
	// Children are of type HierarchyRow
	this.append = function(child) {
		this.children.push(child);
	};

	this.at = function(index) {
		return this.data[index];
	};
	
	// Sort children nodes
	this.sort = function(criteria) {
		// Sort immediate children
		this.children.hierarchyTableSort(criteria);

		// Recursively sort others
		for (var i = 0 ; i != this.children.length ; i++) {
			this.children[i].sort(criteria);
		}
	};
	
	this.isAggregatedRow = function() {
		return this.children.length != 0;
	};

	this.computeNumParents = function() {
		if (this._parent === undefined) {
			return 0;
		}
		return 1 + this._parent.computeNumParents();
	};

	// Add rows into a tbody element
	this.display = function($tbody, numNodes) {
		var $row = $("<tr/>");
		if (this.isAggregatedRow()) {
			var last_filled = undefined;
			for (var i = numNodes -1 ; i >= 0 ; i--) {
				if (this.data[i] !== undefined) {
					last_filled = this.data[i];
					break;
				}
			}
			var $value = $("<td/>");
			$value.attr("colspan", numNodes);
			$value.css("padding-left", String(20*this.computeNumParents()) + "px");
			if (last_filled !== undefined) {
				$value.text(last_filled.display());
			}
			$row.append($value);
			for (var i = numNodes ; i < this.data.length ; i++) {
				var $value = $("<td/>");
				if (this.data[i] !== undefined) {
					$value.text(this.data[i].display());
				}
				$row.append($value);
			}
			$tbody.append($row);

			// Recursively display children
			for (var i = 0 ; i != this.children.length ; i++) {
				this.children[i].display($tbody, numNodes);
			}
		} else {
			for (var i = 0 ; i < this.data.length ; i++) {
				var $value = $("<td/>");
				if (i >= numNodes && this.data[i] !== undefined) {
					$value.text(this.data[i].display());
				}
				$row.append($value);
			}
			$tbody.append($row);
		}
	};
	
	// Compute aggregated value
	this.compute = function(numNodes) {
		if (! this.isAggregatedRow()) {
			return;
		}

		for (var i = 0 ; i != this.children.length ; i++) {
			this.children[i].compute(numNodes);
		}
		for (var i = numNodes ; i < this.data.length ; i++) {
			var aggregated = undefined;
			for (var j = 0 ; j != this.children.length ; j++) {
				if (this.children[j] === undefined || this.children[j].data[i] === undefined) {
					aggregated = undefined;
					break;
				} else if (j == 0) {
					aggregated = this.children[j].data[i].aggregate ? this.children[j].data[i] : undefined;
				} else { // we know that .aggregate is defined
					aggregated = this.children[j].data[i].aggregate(aggregated);
				}
				if (aggregated === undefined) {
					break;
				}
			}
			this.data[i] = aggregated;
		}		
	};

	this.getChildren = function() {
		return this.children;
	};

	{
		if (this._parent !== undefined) {
			this._parent.append(this);
		}
	}
}

function HierarchyTable($table, titles, rows) {
	var self = this;
	
	// jQuery element corresponding to a HTML <table/>
	self.$table = $table;
	
	// Columns' titles
	self.titles = titles;

	// 2-dimension array
	// self.rows[x]   : row containing several values
	// self.rows[x][y]: value itself (instanceof HierarchyItem)
	// The order of this array can change from time to time due to reorderings
	self.rows = rows;
	
	// List of sort criteria
	// by default: order on first column
	self.sortCriteria = [0];
	
	// Number of HierarchyNode
	// Should be placed at the beginning of self.rows[x] to be taken into account
	self.numNodes = 0;

	// HierarchyRow
	self.mainHierarchyRow = new HierarchyRow(undefined, undefined);
	
	// Should only be called once (by the constructor)
	// It builds the HierarchyRow necessary for the display and sort
	self.build = function() {
		// Build the hierarchy based on self.rows
		for (var i = 0 ; i != self.rows.length ; i++) {
			// Create parent rows if necessary
			var parentRow = self.mainHierarchyRow;
			var items = new Array();
			items[self.rows[0].length -1] = undefined;
			for (var j = 0 ; j != self.numNodes ; j++) {
				var path_from_root = self.rows[i][j].getPathFromRoot();
				for (var k = 0 ; k != path_from_root.length ; k++) {
					var node = path_from_root[k];
					if (node.hierarchyRow === undefined) {
						items[j] = node;
						node.hierarchyRow = new HierarchyRow(items.clone(), parentRow);
					}
					parentRow = node.hierarchyRow;
				}
			}
			
			// Create the row associated to our element
			for (var j = 0 ; j < self.rows[i].length ; j++) {
				items[j] = self.rows[i][j];
			}
			var itemRow = new HierarchyRow(items.clone(), parentRow);
		}

		// Compute aggregated values
		var mainRows = self.mainHierarchyRow.getChildren();
		for (var i = 0 ; i != mainRows.length ; i++) {
			mainRows[i].compute(self.numNodes);
		}
	};

	self.display = function() {
		self.mainHierarchyRow.sort(self.sortCriteria);
		self.$table.children().remove();
		
		var $thead = $("<thead/>");
		var $titles = $("<tr/>");
		for (var i = 0 ; i != self.titles.length ; i++) {
			var $title = $("<th/>");
			$title.html(self.titles[i]);
			$titles.append($title);
		}
		$thead.append($titles);
		self.$table.append($thead);
		
		var $tbody = $("<tbody/>");
		var mainRows = self.mainHierarchyRow.getChildren();
		for (var i = 0 ; i != mainRows.length ; i++) {
			mainRows[i].display($tbody, self.numNodes);
		}
		self.$table.append($tbody);
	};

	{
		self.numNodes = 0;
		if (self.rows.length > 0) {
			for (var i = 0 ; i != self.rows[0].length ; i++) {
				if (self.rows[0][i] instanceof HierarchyNode) {
					self.numNodes++;
				} else {
					break;
				}
			}
		}
		
		self.build();
		self.display();
	}
}

