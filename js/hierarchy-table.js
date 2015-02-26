// a and b are instances of HierarchyItem (or derived)
// criteria is the order on which we should consider the column for the sort
Array.prototype.hierarchyTableSort = function(criteria) {
	this.sort(function(a, b) {
		for (var i = 0 ; i != criteria.length ; i++) {
			var column = criteria[i];
			var comparison = a[column].compare(b[column]);
			if (comparison != 0) {
				return comparison;
			}
		}
		return 0;
	});
}

function HierarchyItem(data) {
	this.data = data;
	this.compare = function(other) {
		return this.data < other.data ? -1 : (this.data > other.data ? 1 : 0);
	};
	this.display = function() {
		return String(this.data);
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
	this.display = this.str;

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

	self.display = function() {
		self.rows.hierarchyTableSort(self.sortCriteria);
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
		var previous_row = undefined;
		for (var i = 0 ; i != self.rows.length ; i++) {
			var previous_path = new Array();
			var current_path = new Array();
			for (var j = 0 ; j != self.numNodes ; j++) {
				if (previous_row) {
					previous_path = previous_path.concat(previous_row[j].getPathFromRoot());
				}
				current_path = current_path.concat(self.rows[i][j].getPathFromRoot());
			}
			for (var j = 0 ; j != current_path.length ; j++) {
				if (j >= previous_path.length || previous_path[j] != current_path[j]) {
					var $aggregation_row = $("<tr/>");
					var $value = $("<td/>");
					$value.attr("colspan", self.numNodes);
					$value.text(current_path[j].display());
					$aggregation_row.append($value);
					for (var k = 1 ; k < self.rows[i].length ; k++) {
						$aggregation_row.append($("<td/>"));
					}
					$tbody.append($aggregation_row);
				}
			}

			var $row = $("<tr/>");
			for (var j = 0 ; j < self.rows[i].length ; j++) {
				var $value = $("<td/>");
				if (j >= self.numNodes) {
					$value.text(self.rows[i][j].display());
				}
				$row.append($value);
			}
			$tbody.append($row);
			previous_row = self.rows[i];
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

		self.display();
	}
}

